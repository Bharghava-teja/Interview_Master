const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { APIResponse, HTTP_STATUS } = require('../utils/responseFormatter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { SecurityManager, InputValidator } = require('../utils/security');
const { AuthMiddleware } = require('../middleware/auth');
const { DataValidator } = require('../utils/validation');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'User registered successfully'
 *                     data:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: '507f1f77bcf86cd799439011'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: false
 *                     message:
 *                       example: 'Email already in use'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.signup = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;
  
  // Sanitize input
  name = SecurityManager.sanitizeInput(name);
  email = SecurityManager.sanitizeInput(email);
  
  // Enhanced validation
  const validationErrors = [];
  
  if (!name || name.trim().length < 2) {
    validationErrors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }
  
  if (!email || !InputValidator.isValidEmail(email)) {
    validationErrors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  if (!password) {
    validationErrors.push({ field: 'password', message: 'Password is required' });
  } else {
    // Check password strength
    const passwordCheck = SecurityManager.checkPasswordStrength(password);
    if (passwordCheck.strength === 'weak') {
      validationErrors.push({ 
        field: 'password', 
        message: 'Password is too weak', 
        suggestions: passwordCheck.suggestions 
      });
    }
  }
  
  if (validationErrors.length > 0) {
    throw new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, true, validationErrors);
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email already in use', HTTP_STATUS.CONFLICT);
  }
  
  // Hash password with enhanced security
  const hashedPassword = await SecurityManager.hashData(password);
  
  // Create new user with additional security fields
  const user = new User({ 
    name: name.trim(), 
    email: email.toLowerCase(), 
    password: hashedPassword,
    isActive: true,
    createdAt: new Date(),
    lastActivity: new Date(),
    loginAttempts: 0,
    accountLocked: false
  });
  
  await user.save();
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Log security event
  console.log(`New user registered: ${user.email} from IP: ${req.ip}`);
  
  // Send success response (don't include sensitive data)
  const response = APIResponse.success(
    { 
      token,
      user: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    },
    'User registered successfully'
  );
  response.send(res, HTTP_STATUS.CREATED);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'Login successful'
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.login = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  
  // Sanitize input
  email = SecurityManager.sanitizeInput(email);
  
  // Enhanced validation
  const validationErrors = [];
  
  if (!email || !InputValidator.isValidEmail(email)) {
    validationErrors.push({ field: 'email', message: 'Valid email is required' });
  }
  
  if (!password || password.length < 1) {
    validationErrors.push({ field: 'password', message: 'Password is required' });
  }
  
  if (validationErrors.length > 0) {
    throw new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST, true, validationErrors);
  }
  
  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +accountLocked +lockUntil');
  
  if (!user) {
    // Log failed login attempt
    console.warn(`Failed login attempt for non-existent user: ${email} from IP: ${req.ip}`);
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Check if account is locked
  if (user.accountLocked && user.lockUntil && user.lockUntil > Date.now()) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    throw new AppError(`Account is locked. Try again in ${lockTimeRemaining} minutes.`, HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Verify password using enhanced security
  const isMatch = await SecurityManager.verifyHash(password, user.password);
  
  if (!isMatch) {
    // Increment login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 5) {
      user.accountLocked = true;
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();
      
      console.warn(`Account locked for user: ${user.email} from IP: ${req.ip}`);
      throw new AppError('Account locked due to multiple failed login attempts', HTTP_STATUS.UNAUTHORIZED);
    }
    
    await user.save();
    
    console.warn(`Failed login attempt for user: ${user.email} from IP: ${req.ip}. Attempts: ${user.loginAttempts}`);
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
  }
  
  // Update last activity and IP
  user.lastActivity = new Date();
  user.lastKnownIP = req.ip;
  await user.save();
  
  // Generate secure JWT tokens
  const accessToken = SecurityManager.generateJWT({
    userId: user._id,
    email: user.email,
    role: user.role || 'user'
  }, {
    expiresIn: '1h',
    tokenType: 'access'
  });
  
  const refreshToken = SecurityManager.generateRefreshToken(user._id);
  
  // Create session
  const tokenPayload = SecurityManager.verifyJWT(accessToken);
  await AuthMiddleware.createSession(user._id, tokenPayload.jti, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    platform: req.headers['sec-ch-ua-platform']
  });
  
  // Prepare user data (exclude sensitive fields)
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    isActive: user.isActive,
    lastActivity: user.lastActivity,
    createdAt: user.createdAt
  };
  
  // Set secure HTTP-only cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // Log successful login
  console.log(`Successful login for user: ${user.email} from IP: ${req.ip}`);
  
  // Send success response
  const response = APIResponse.success(
    { 
      accessToken, 
      refreshToken, // Include refresh token in response for API testing
      user: userData,
      expiresIn: 3600 // 1 hour in seconds
    },
    'Login successful'
  );
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and invalidate token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
exports.logout = asyncHandler(async (req, res) => {
  const token = AuthMiddleware.extractToken(req);
  
  if (token) {
    try {
      const decoded = SecurityManager.verifyJWT(token);
      
      // Blacklist the token
      await AuthMiddleware.blacklistToken(decoded.jti, decoded.exp * 1000);
      
      // Log logout event
      console.log(`User logged out: ${req.user?.email || 'Unknown'} from IP: ${req.ip}`);
    } catch (error) {
      // Token might be invalid, but we still want to clear cookies
      console.warn('Invalid token during logout:', error.message);
    }
  }
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  const response = APIResponse.success(null, 'User logged out successfully');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/health:
 *   get:
 *     summary: Check authentication service health
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'Authentication service is healthy'
 *                     data:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: string
 *                           example: 'connected'
 *                         timestamp:
 *                           type: string
 *                           example: '2024-01-01T00:00:00.000Z'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState] || 'unknown';
    
    if (dbState !== 1) {
      throw new AppError('Database connection unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }
    
    // Test database query
    await User.findOne().limit(1);
    
    const response = APIResponse.success(
      {
        database: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      'Authentication service is healthy'
    );
    response.send(res, HTTP_STATUS.OK);
  } catch (error) {
    console.error('Health check failed:', error.message);
    const response = APIResponse.error(
      'Service unavailable',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      [{ field: 'service', message: error.message }]
    );
    response.send(res, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    throw new AppError('Refresh token required', HTTP_STATUS.UNAUTHORIZED);
  }
  
  try {
    // Verify refresh token
    const decoded = SecurityManager.verifyJWT(refreshToken);
    
    if (decoded.tokenType !== 'refresh') {
      throw new AppError('Invalid token type', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(decoded.jti);
    if (isBlacklisted) {
      throw new AppError('Refresh token has been revoked', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Generate new access token
    const newAccessToken = SecurityManager.generateJWT({
      userId: user._id,
      email: user.email,
      role: user.role || 'user'
    }, {
      expiresIn: '1h',
      tokenType: 'access'
    });
    
    // Create new session
    const tokenPayload = SecurityManager.verifyJWT(newAccessToken);
    await AuthMiddleware.createSession(user._id, tokenPayload.jti, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      platform: req.headers['sec-ch-ua-platform']
    });
    
    // Update last activity
    user.lastActivity = new Date();
    await user.save();
    
    // Generate new refresh token for the response
    const newRefreshToken = SecurityManager.generateRefreshToken(user._id);
    
    const response = APIResponse.success({
      accessToken: newAccessToken,
      token: newAccessToken, // Alias for integration test compatibility
      refreshToken: newRefreshToken, // Include new refresh token
      expiresIn: 3600
    }, 'Token refreshed successfully');
    
    response.send(res, HTTP_STATUS.OK);
  } catch (error) {
    // Clear invalid refresh token
    res.clearCookie('refreshToken');
    
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  let { email } = req.body;
  
  // Sanitize input
  email = SecurityManager.sanitizeInput(email);
  
  if (!email || !InputValidator.isValidEmail(email)) {
    throw new AppError('Valid email is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // Always return success to prevent email enumeration
  const response = APIResponse.success(
    null,
    'If an account with that email exists, a password reset link has been sent'
  );
  
  if (user && user.isActive) {
    // Generate secure reset token
    const resetToken = SecurityManager.generateSecureToken();
    const resetTokenHash = await SecurityManager.hashData(resetToken);
    
    // Set reset token with expiration (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    
    // Log password reset request
    console.log(`Password reset requested for user: ${user.email} from IP: ${req.ip}`);
    
    // In a real application, you would send an email here
    // For demo purposes, we'll just log the token
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
    
    // TODO: Implement email sending
    // await sendPasswordResetEmail(user.email, resetToken);
  }
  
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    throw new AppError('Token and password are required', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Check password strength
  const passwordCheck = SecurityManager.checkPasswordStrength(password);
  if (passwordCheck.strength === 'weak') {
    throw new AppError('Password is too weak', HTTP_STATUS.BAD_REQUEST, true, [{
      field: 'password',
      message: 'Password is too weak',
      suggestions: passwordCheck.suggestions
    }]);
  }
  
  // Find user with valid reset token
  const users = await User.find({
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken');
  
  let user = null;
  for (const u of users) {
    if (u.passwordResetToken) {
      const isValidToken = await SecurityManager.verifyHash(token, u.passwordResetToken);
      if (isValidToken) {
        user = u;
        break;
      }
    }
  }
  
  if (!user) {
    throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Hash new password
  const hashedPassword = await SecurityManager.hashData(password);
  
  // Update password and clear reset token
  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  user.loginAttempts = 0;
  user.accountLocked = false;
  user.lockUntil = undefined;
  
  await user.save();
  
  // Revoke all existing sessions
  await AuthMiddleware.revokeAllUserSessions(user._id);
  
  // Log password reset
  console.log(`Password reset completed for user: ${user.email} from IP: ${req.ip}`);
  
  const response = APIResponse.success(null, 'Password reset successful');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isCurrentPasswordValid = await SecurityManager.verifyHash(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Check new password strength
  const passwordCheck = SecurityManager.checkPasswordStrength(newPassword);
  if (passwordCheck.strength === 'weak') {
    throw new AppError('New password is too weak', HTTP_STATUS.BAD_REQUEST, true, [{
      field: 'newPassword',
      message: 'Password is too weak',
      suggestions: passwordCheck.suggestions
    }]);
  }
  
  // Check if new password is different from current
  const isSamePassword = await SecurityManager.verifyHash(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError('New password must be different from current password', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Hash new password
  const hashedPassword = await SecurityManager.hashData(newPassword);
  
  // Update password
  user.password = hashedPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  
  // Revoke all other sessions (keep current session)
  await AuthMiddleware.revokeAllUserSessions(user._id);
  
  // Log password change
  console.log(`Password changed for user: ${user.email} from IP: ${req.ip}`);
  
  const response = APIResponse.success(null, 'Password changed successfully');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    isActive: user.isActive,
    lastActivity: user.lastActivity,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  const response = APIResponse.success(userData, 'Profile retrieved successfully');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get user active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await AuthMiddleware.getUserSessions(req.user._id);
  
  const response = APIResponse.success(sessions, 'Sessions retrieved successfully');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/revoke-sessions:
 *   post:
 *     summary: Revoke all user sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked successfully
 */
exports.revokeSessions = asyncHandler(async (req, res) => {
  await AuthMiddleware.revokeAllUserSessions(req.user._id);
  
  // Log session revocation
  console.log(`All sessions revoked for user: ${req.user.email} from IP: ${req.ip}`);
  
  const response = APIResponse.success(null, 'All sessions revoked successfully');
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw new AppError('Verification token is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const user = await User.findOne({ 'metadata.emailVerificationToken': token });
  if (!user) {
    throw new AppError('Invalid verification token', HTTP_STATUS.BAD_REQUEST);
  }
  
  user.metadata.emailVerified = true;
  user.metadata.emailVerificationToken = null;
  await user.save();
  
  const response = APIResponse.success(null, 'Email verified successfully');
  response.send(res, HTTP_STATUS.OK);
});