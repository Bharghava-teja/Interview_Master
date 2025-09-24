const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { SecurityManager, RateLimitManager, SecurityHeaders } = require('../utils/security');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Security Middleware Collection
 * Comprehensive security middleware for Express applications
 */

/**
 * Apply security headers using Helmet
 */
const applySecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * CORS configuration middleware
 */
const corsConfig = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-domain.com', // Add your production domain
    process.env.CLIENT_URL || 'http://localhost:3000' // Dynamic client URL from environment
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Rate limiting middleware factory
 */
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    message = 'Too many requests from this IP, please try again later',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

/**
 * Slow down middleware for progressive delays
 */
const createSlowDown = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    delayAfter = 50, // allow 50 requests per windowMs without delay
    delayMs = 500, // add 500ms delay per request after delayAfter
    maxDelayMs = 20000, // max delay of 20 seconds
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;
  
  return slowDown({
    windowMs,
    delayAfter,
    delayMs: () => delayMs, // Fix: delayMs should be a function
    maxDelayMs,
    skipSuccessfulRequests,
    skipFailedRequests,
    validate: { delayMs: false } // Disable the warning
  });
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = SecurityManager.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Request size limiting middleware
 */
const limitRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length'));
    const maxBytes = typeof maxSize === 'string' ? 
      parseInt(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : 1024) : 
      maxSize;
    
    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large'
      });
    }
    
    next();
  };
};

/**
 * IP whitelist/blacklist middleware
 */
const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIP)) {
      logger.warn('Blocked IP attempt', { ip: clientIP, path: req.path });
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check whitelist if provided
    if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
      logger.warn('Non-whitelisted IP attempt', { ip: clientIP, path: req.path });
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    next();
  };
};

/**
 * Request logging middleware for security monitoring
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /onload=/gi, // Event handlers
    /onerror=/gi
  ];
  
  const requestData = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  
  const foundSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
  
  if (foundSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query
    });
  }
  
  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP error response', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent')
      });
    }
  });
  
  next();
};

/**
 * CSRF protection middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for API key authentication
  if (req.headers['x-api-key']) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
  }
  
  next();
};

/**
 * Generate CSRF token endpoint
 */
const generateCSRFToken = (req, res) => {
  const token = SecurityManager.generateSecureToken(32);
  
  if (req.session) {
    req.session.csrfToken = token;
  }
  
  res.json({
    success: true,
    csrfToken: token
  });
};

/**
 * Security middleware presets
 */
const securityPresets = {
  // Basic security for all routes
  basic: [
    applySecurityHeaders,
    corsConfig,
    sanitizeInput,
    securityLogger
  ],
  
  // API security with rate limiting
  api: [
    applySecurityHeaders,
    corsConfig,
    createRateLimit({ max: 1000, windowMs: 15 * 60 * 1000 }), // 1000 requests per 15 minutes
    sanitizeInput,
    limitRequestSize('5mb'),
    securityLogger
  ],
  
  // Authentication routes with strict rate limiting
  auth: [
    applySecurityHeaders,
    corsConfig,
    createRateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), // 10 requests per 15 minutes
    createSlowDown({ delayAfter: 3, delayMs: 1000 }),
    sanitizeInput,
    limitRequestSize('1mb'),
    securityLogger
  ],
  
  // Admin routes with maximum security
  admin: [
    applySecurityHeaders,
    corsConfig,
    createRateLimit({ max: 100, windowMs: 15 * 60 * 1000 }), // 100 requests per 15 minutes
    sanitizeInput,
    limitRequestSize('10mb'),
    securityLogger
  ],
  
  // Public routes with basic protection
  public: [
    applySecurityHeaders,
    corsConfig,
    createRateLimit({ max: 500, windowMs: 15 * 60 * 1000 }), // 500 requests per 15 minutes
    sanitizeInput,
    securityLogger
  ]
};

module.exports = {
  // Individual middleware
  applySecurityHeaders,
  corsConfig,
  createRateLimit,
  createSlowDown,
  sanitizeInput,
  limitRequestSize,
  ipFilter,
  securityLogger,
  csrfProtection,
  generateCSRFToken,
  
  // Preset combinations
  securityPresets
};