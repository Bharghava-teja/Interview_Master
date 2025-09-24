const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const { redisClient, sessionConfig, cache } = require('./config/redis');
const { fingerprintMiddleware, storeFingerprint, serveFingerprintScript } = require('./middleware/fingerprinting');
const User = require('./models/User');
const Exam = require('./models/Exam');
const Result = require('./models/Result');
const SecurityViolation = require('./models/SecurityViolation');
const authMiddleware = require('./middleware/authMiddleware');
const { auditLogger, logSecurityEvent } = require('./middleware/auditLogger');
const {
  generalLimiter,
  authLimiter,
  codeExecutionLimiter,
  violationLimiter,
  progressLimiter
} = require('./middleware/rateLimiter');
const {
  sanitizeInput,
  validateUserRegistration,
  validateUserLogin,
  validateCodeExecution,
  validateSecurityViolation,
  validateExamProgress,
  validateFeedback,
  validateExamHistoryQuery,
  validateMCQQuery
} = require('./middleware/validation');
const { globalErrorHandler, handleNotFound } = require('./middleware/errorHandler');
const apiVersioning = require('./middleware/apiVersioning');
const { setupSwagger } = require('./config/swagger');
const dbManager = require('./config/database');
const { DataValidator } = require('./utils/validation');
const { PerformanceMonitor } = require('./utils/performance');
const { MigrationManager, DataSeeder } = require('./utils/migrations');
const { securityPresets, generateCSRFToken } = require('./middleware/security');
const { SecurityManager } = require('./utils/security');
const { AuthMiddleware } = require('./middleware/auth');
const logger = require('./utils/logger');
const {
  requestMonitoring,
  errorMonitoring,
  securityMonitoring,
  rateLimitMonitoring,
  healthCheckEndpoint,
  metricsEndpoint
} = require('./middleware/monitoring');
const monitoringService = require('./services/monitoringService');
const cacheService = require('./services/cacheService');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.initialize();

// Store performance monitor in app locals for access in routes
app.locals.performanceMonitor = performanceMonitor;

// Initialize migration manager
const migrationManager = new MigrationManager();

// API Documentation
setupSwagger(app);

// API Versioning
app.use(apiVersioning);

// Performance monitoring middleware (before other middleware)
app.use((req, res, next) => performanceMonitor.trackRequest(req, res, next));

// Request logging middleware
app.use(logger.requestMiddleware());

// Enhanced security middleware
console.log('Applying security middleware...');
app.use(...securityPresets.basic);
console.log('Security middleware applied');

console.log('Setting up body parsing middleware...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('Body parsing middleware configured');

// Trust proxy for rate limiting
console.log('Setting trust proxy...');
app.set('trust proxy', 1);

// Session management with Redis
console.log('Setting up session management...');
app.use(session(sessionConfig));
console.log('Session management configured');

// Browser fingerprinting middleware
console.log('Setting up fingerprinting middleware...');
app.use(fingerprintMiddleware({
  requireFingerprint: false, // Set to true for stricter security
  skipPaths: ['/api/auth/login', '/api/auth/signup', '/api/health', '/api/fingerprint.js', '/api/csrf-token']
}));
console.log('Fingerprinting middleware configured');

// AuthMiddleware is ready to use (no initialization required)
console.log('AuthMiddleware ready');

// Audit logging
console.log('Setting up audit logging...');
app.use(auditLogger({
  excludeEndpoints: ['/api/health', '/favicon.ico', '/robots.txt'],
  includeRequestBody: true,
  includeResponseBody: false,
  maxBodySize: 5000
}));
console.log('Audit logging configured');

// Setup monitoring middleware
console.log('Setting up monitoring middleware...');
app.use(requestMonitoring);
app.use(securityMonitoring);
app.use(rateLimitMonitoring);
console.log('Monitoring middleware configured');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/interview-master';

console.log('Starting database connection...');
console.log('Using DatabaseManager singleton instance');

// Initialize database connection synchronously (blocking)
async function initializeDatabase() {
  try {
    await dbManager.connect();
    console.log('MongoDB connected with optimized configuration');
    
    await dbManager.createOptimizedIndexes();
    console.log('Database indexes initialized');
    
    const migrationResult = await migrationManager.migrate();
    if (migrationResult.executed > 0) {
      console.log(`Executed ${migrationResult.executed} database migrations`);
    }
    
    await DataSeeder.seedAdminUser();
    console.log('Database initialization completed');
    return true;
  } catch (err) {
    console.error('Database initialization error:', err);
    console.warn('Server will continue running without full database initialization...');
    return false;
  }
}

console.log('Database connection will be initialized before server start');

console.log('Setting up inline routes...');
// User registration
app.post('/api/register', authLimiter, validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logSecurityEvent({
        action: 'registration_attempt_existing_email',
        userId: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'warning',
        metadata: { email, attemptedName: name },
        tags: ['duplicate_registration']
      });
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Log successful registration
    await logSecurityEvent({
      action: 'user_registration_success',
      userId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      severity: 'info',
      metadata: { email, name },
      tags: ['registration_success']
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.locals.errorMessage = err.message;
    res.locals.errorStack = err.stack;
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User login
app.post('/api/login', authLimiter, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      await logSecurityEvent({
        action: 'login_attempt_invalid_email',
        userId: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'warning',
        metadata: { email },
        tags: ['failed_login', 'invalid_email']
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logSecurityEvent({
        action: 'login_attempt_invalid_password',
        userId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'warning',
        metadata: { email },
        tags: ['failed_login', 'invalid_password']
      });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Log successful login
    await logSecurityEvent({
      action: 'user_login_success',
      userId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      severity: 'info',
      metadata: { email },
      tags: ['login_success']
    });

    // Store browser fingerprint for security
    if (req.fingerprint) {
      await storeFingerprint(user._id.toString(), req);
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.locals.errorMessage = err.message;
    res.locals.errorStack = err.stack;
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.user });
});

app.get('/', (req, res) => {
  res.send('API running');
});

// Serve fingerprinting script
app.get('/api/fingerprint.js', serveFingerprintScript);

// MCQ helper functions removed - no longer needed

// MCQ endpoint removed - no longer supported



// Coding endpoint removed - no longer supported

// Code execution endpoint removed - no longer supported

// MCQ/Coding feedback endpoint removed - no longer supported

// MCQ/Coding helper functions removed - no longer needed

// Import the new models


// Endpoint for logging security violations
app.post('/api/exam/violation', violationLimiter, authMiddleware, validateSecurityViolation, async (req, res) => {
  try {
    const { examId, type, violationType, description, severity = 'medium', context, technicalDetails, details, snapshot } = req.body;
    
    // Use 'type' if provided, fallback to 'violationType' for backward compatibility
    const finalViolationType = type || violationType;
    
    // Generate unique violation ID
    const violationId = `violation_${uuidv4()}`;
    
    // Find the current result for this exam and user
    const currentResult = await Result.findOne({
      examId: examId,
      userId: req.user.id,
      status: 'in_progress'
    });
    
    if (!currentResult) {
      return res.status(404).json({ error: 'No active exam session found' });
    }
    
    // Create security violation record
    const violation = new SecurityViolation({
      violationId,
      userId: req.user.id,
      examId,
      resultId: currentResult.resultId,
      violationType: finalViolationType,
      description: description || details?.description || `${finalViolationType} detected`,
      severity,
      detectionMethod: 'client_side',
      context: context || details,
      technicalDetails,
      timestamp: new Date(),
      evidence: {
        webcamCapture: snapshot // Store the base64 snapshot
      }
    });
    
    // Calculate risk score
    violation.calculateRiskScore();
    
    // Check for repeated violations
    const recentViolations = await SecurityViolation.countDocuments({
      userId: req.user.id,
      examId,
      timestamp: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
    });
    
    violation.patterns.previousViolationCount = recentViolations;
    violation.patterns.isRepeatedViolation = recentViolations > 0;
    
    // Determine response action
    if (violation.requiresImmediateAction() || recentViolations >= 2) {
      violation.response.actionTaken = 'exam_terminated';
      violation.response.reviewRequired = true;
      
      // Auto-submit the exam
      currentResult.status = 'auto_submitted';
      currentResult.endTime = new Date();
      currentResult.securityEvents.autoSubmitted = true;
      currentResult.securityEvents.autoSubmissionReason = `Multiple security violations: ${violationType}`;
      currentResult.securityEvents.violationCount = recentViolations + 1;
      
      await currentResult.save();
    } else {
      violation.response.actionTaken = recentViolations === 0 ? 'warning_shown' : 'question_locked';
    }
    
    await violation.save();
    
    // Update result with violation reference
    currentResult.securityEvents.violations.push(violation._id);
    currentResult.securityEvents.violationCount = recentViolations + 1;
    await currentResult.save();
    
    console.log(`Security violation logged: ${violationType} for user ${req.user.id}`);
    
    res.json({ 
      message: 'Violation logged successfully',
      violationId: violation.violationId,
      actionTaken: violation.response.actionTaken,
      examTerminated: violation.response.actionTaken === 'exam_terminated',
      timestamp: violation.timestamp.toISOString()
    });
  } catch (err) {
    console.error('Error logging violation:', err.message);
    res.status(500).json({ error: 'Failed to log violation' });
  }
});

// Endpoint for saving exam progress
app.post('/api/exam/progress', progressLimiter, authMiddleware, validateExamProgress, async (req, res) => {
  try {
    const { examId, stageProgress, currentStage, answers, timeSpent } = req.body;
    
    // Find or create result record
    let result = await Result.findOne({
      examId: examId,
      userId: req.user.id,
      status: { $in: ['in_progress', 'completed'] }
    });
    
    if (!result) {
      // Create new result record
      const exam = await Exam.findOne({ examId: examId });
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }
      
      result = new Result({
        resultId: `result_${uuidv4()}`,
        examId: examId,
        userId: req.user.id,
        exam: exam._id,
        startTime: new Date(),
        status: 'in_progress',
        scoring: {
          maxPossiblePoints: exam.getTotalPoints()
        }
      });
    }
    
    // Update progress data
    if (answers && Array.isArray(answers)) {
      // Merge new answers with existing ones
      answers.forEach(newAnswer => {
        const existingIndex = result.answers.findIndex(a => a.questionId === newAnswer.questionId);
        if (existingIndex >= 0) {
          result.answers[existingIndex] = { ...result.answers[existingIndex], ...newAnswer };
        } else {
          result.answers.push(newAnswer);
        }
      });
    }
    
    // Update time spent
    if (timeSpent) {
      result.totalTimeSpent = timeSpent;
    }
    
    // Update analytics
    result.analytics.questionsAttempted = result.answers.filter(a => a.userAnswer !== null && a.userAnswer !== undefined).length;
    result.analytics.questionsSkipped = result.answers.filter(a => !a.userAnswer).length;
    
    // Calculate current score if answers provided
    if (answers && answers.length > 0) {
      result.calculateScore();
      result.scoring.grade = result.calculateGrade();
    }
    
    await result.save();
    
    console.log(`Exam progress saved for user ${req.user.id}, exam ${examId}`);
    
    res.json({ 
      message: 'Progress saved successfully',
      resultId: result.resultId,
      currentScore: result.scoring.percentage,
      questionsAttempted: result.analytics.questionsAttempted,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error saving progress:', err.message);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Endpoint for getting exam history
app.get('/api/exam/history', authMiddleware, validateExamHistoryQuery, async (req, res) => {
  try {
    const { limit = 10, page = 1, status, examType } = req.query;
    
    // Build query filters
    const query = { userId: req.user.id };
    if (status) query.status = status;
    
    // Get user's exam results with pagination
    const results = await Result.find(query)
      .populate('exam', 'title examType description')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('resultId examId scoring status startTime endTime totalTimeSpent securityEvents exam createdAt');
    
    // Get total count for pagination
    const totalCount = await Result.countDocuments(query);
    
    // Format response
    const formattedResults = results.map(result => ({
      id: result.resultId,
      examId: result.examId,
      title: result.exam?.title || 'Unknown Exam',
      type: result.exam?.examType || 'unknown',
      score: result.scoring?.percentage || 0,
      grade: result.scoring?.grade || 'N/A',
      status: result.status,
      passed: result.scoring?.passed || false,
      date: result.createdAt,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.totalTimeSpent,
      questionsAttempted: result.analytics?.questionsAttempted || 0,
      violationCount: result.securityEvents?.violationCount || 0,
      autoSubmitted: result.securityEvents?.autoSubmitted || false
    }));
    
    // Get performance analytics
    const analytics = await Result.getPerformanceAnalytics(req.user.id);
    
    res.json({
      exams: formattedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) * parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1
      },
      analytics: analytics[0] || {
        totalExams: 0,
        averageScore: 0,
        passedExams: 0,
        totalTimeSpent: 0
      }
    });
  } catch (err) {
    console.error('Error fetching exam history:', err.message);
    res.status(500).json({ error: 'Failed to fetch exam history' });
  }
});

// CSRF Token endpoint
app.get('/api/csrf-token', generateCSRFToken);

// Add comprehensive monitoring endpoints
app.get('/api/health', healthCheckEndpoint);
app.get('/api/metrics', metricsEndpoint);

// Enhanced route configurations with security middleware
console.log('Setting up enhanced route configurations...');
app.use('/api/v1/auth', ...securityPresets.auth, require('./routes/auth'));
console.log('Auth route loaded successfully');
app.use('/api/v1/admin', AuthMiddleware.authenticate, AuthMiddleware.authorize('admin'), ...securityPresets.admin, require('./routes/admin'));
console.log('Admin route loaded successfully');
app.use('/api/v1/users', AuthMiddleware.authenticate, ...securityPresets.api, require('./routes/user'));
console.log('User route loaded successfully');
app.use('/api/v1/exams', AuthMiddleware.authenticate, ...securityPresets.api, require('./routes/exam'));
console.log('Exam route loaded successfully');
// Public routes (no auth required)
app.use('/api/v1/public', ...securityPresets.api, require('./routes/public'));
console.log('Public route loaded successfully');
// Protected resume routes (auth required)
app.use('/api/v1/resumes', AuthMiddleware.authenticate, ...securityPresets.api, require('./routes/resume'));
console.log('Resume route loaded successfully');
console.log('Enhanced route configurations completed');

// Security headers test endpoint
app.get('/api/security-test', (req, res) => {
  res.json({
    headers: req.headers,
    secure: req.secure,
    protocol: req.protocol,
    ip: req.ip,
    fingerprint: req.fingerprint
  });
});

// Error handling middleware (must be last)
console.log('Setting up error handling middleware...');
app.use(handleNotFound);
app.use(errorMonitoring);
app.use(globalErrorHandler);
console.log('Error handling middleware configured');

// Export app for testing
module.exports = app;

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // Initialize database first
      console.log('Initializing database connection...');
      await initializeDatabase();
      
      // Start server after database is ready
      app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
        
        // Clear all sessions on server startup to prevent auto-login
        await AuthMiddleware.clearAllSessions();
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  })();
}