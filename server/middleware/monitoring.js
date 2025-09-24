const monitoringService = require('../services/monitoringService');
const { v4: uuidv4 } = require('uuid');

/**
 * Request monitoring middleware
 * Tracks request metrics, response times, and logs requests
 */
const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log incoming request
  const logger = monitoringService.getLogger();
  logger.info('Incoming request', {
    category: 'request',
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date()
  });
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Track request metrics
    monitoringService.trackRequest(req, res, responseTime);
    
    // Log response
    logger.info('Request completed', {
      category: 'response',
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date()
    });
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Error monitoring middleware
 * Logs errors and tracks error metrics
 */
const errorMonitoring = (err, req, res, next) => {
  const logger = monitoringService.getLogger();
  
  // Log error with context
  logger.error('Request error', {
    category: 'error',
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      statusCode: err.statusCode || 500
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    } : null,
    timestamp: new Date()
  });
  
  // Track security events for specific error types
  if (err.statusCode === 401 || err.statusCode === 403) {
    monitoringService.trackSecurityEvent('unauthorized_access', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: err.message
    });
  }
  
  if (err.name === 'ValidationError') {
    monitoringService.trackSecurityEvent('validation_error', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      validationErrors: err.errors
    });
  }
  
  next(err);
};

/**
 * Security monitoring middleware
 * Tracks suspicious activities and security events
 */
const securityMonitoring = (req, res, next) => {
  const logger = monitoringService.getLogger();
  
  // Track login attempts
  if (req.path === '/api/login' && req.method === 'POST') {
    logger.info('Login attempt', {
      category: 'security',
      requestId: req.requestId,
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  }
  
  // Track registration attempts
  if (req.path === '/api/register' && req.method === 'POST') {
    logger.info('Registration attempt', {
      category: 'security',
      requestId: req.requestId,
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  }
  
  // Track admin access attempts
  if (req.path.startsWith('/api/v1/admin')) {
    logger.info('Admin access attempt', {
      category: 'security',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      } : null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
  }
  
  // Detect potential SQL injection attempts
  const suspiciousPatterns = [
    /('|(\-\-)|(;)|(\|)|(\*)|(%))/i,
    /(union|select|insert|delete|update|drop|create|alter)/i,
    /(script|javascript|vbscript|onload|onerror)/i
  ];
  
  const checkForSuspiciousContent = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          monitoringService.trackSecurityEvent('suspicious_input', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            suspiciousContent: obj,
            location: path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          break;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForSuspiciousContent(value, `${path}.${key}`);
      }
    }
  };
  
  // Check query parameters
  if (Object.keys(req.query).length > 0) {
    checkForSuspiciousContent(req.query, 'query');
  }
  
  // Check request body
  if (req.body && Object.keys(req.body).length > 0) {
    checkForSuspiciousContent(req.body, 'body');
  }
  
  next();
};

/**
 * Rate limiting monitoring middleware
 * Tracks rate limit violations
 */
const rateLimitMonitoring = (req, res, next) => {
  // This middleware works with express-rate-limit
  // It logs when rate limits are hit
  
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 429) {
      const logger = monitoringService.getLogger();
      
      logger.warn('Rate limit exceeded', {
        category: 'security',
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });
      
      monitoringService.trackSecurityEvent('rate_limit_exceeded', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Health check endpoint middleware
 * Provides system health information
 */
const healthCheckEndpoint = async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    const metrics = monitoringService.getSystemMetrics();
    
    const response = {
      status: health.overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      services: health.services,
      metrics,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        rss: process.memoryUsage().rss
      }
    };
    
    // Set appropriate HTTP status based on health
    const statusCode = health.overallStatus === 'healthy' ? 200 :
                      health.overallStatus === 'warning' ? 200 :
                      health.overallStatus === 'unhealthy' ? 503 : 500;
    
    res.status(statusCode).json(response);
  } catch (error) {
    const logger = monitoringService.getLogger();
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date()
    });
  }
};

/**
 * Metrics endpoint middleware
 * Provides detailed system metrics
 */
const metricsEndpoint = async (req, res) => {
  try {
    const report = await monitoringService.generateMonitoringReport();
    res.json(report);
  } catch (error) {
    const logger = monitoringService.getLogger();
    logger.error('Metrics endpoint failed', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to generate metrics report',
      timestamp: new Date()
    });
  }
};

module.exports = {
  requestMonitoring,
  errorMonitoring,
  securityMonitoring,
  rateLimitMonitoring,
  healthCheckEndpoint,
  metricsEndpoint
};