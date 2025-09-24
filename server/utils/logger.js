const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Advanced Logging System
 * Structured logging with Winston for security monitoring and debugging
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'interview-system',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Security logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Security-specific logging methods
logger.security = {
  /**
   * Log authentication events
   */
  auth: (event, data = {}) => {
    logger.info('Authentication Event', {
      type: 'security',
      category: 'authentication',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log authorization events
   */
  authz: (event, data = {}) => {
    logger.info('Authorization Event', {
      type: 'security',
      category: 'authorization',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log suspicious activities
   */
  suspicious: (event, data = {}) => {
    logger.warn('Suspicious Activity', {
      type: 'security',
      category: 'suspicious',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log security violations
   */
  violation: (event, data = {}) => {
    logger.error('Security Violation', {
      type: 'security',
      category: 'violation',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log data access events
   */
  dataAccess: (event, data = {}) => {
    logger.info('Data Access Event', {
      type: 'security',
      category: 'data_access',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
logger.performance = {
  /**
   * Log API performance metrics
   */
  api: (data = {}) => {
    logger.info('API Performance', {
      type: 'performance',
      category: 'api',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log database performance metrics
   */
  database: (data = {}) => {
    logger.info('Database Performance', {
      type: 'performance',
      category: 'database',
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log system performance metrics
   */
  system: (data = {}) => {
    logger.info('System Performance', {
      type: 'performance',
      category: 'system',
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// Business logic logging
logger.business = {
  /**
   * Log exam-related events
   */
  exam: (event, data = {}) => {
    logger.info('Exam Event', {
      type: 'business',
      category: 'exam',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log user-related events
   */
  user: (event, data = {}) => {
    logger.info('User Event', {
      type: 'business',
      category: 'user',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log result-related events
   */
  result: (event, data = {}) => {
    logger.info('Result Event', {
      type: 'business',
      category: 'result',
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// Request logging middleware
logger.requestMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request start
    logger.info('Request Started', {
      type: 'request',
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id || 'unknown'
    });
    
    // Log response end
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
      
      logger[logLevel]('Request Completed', {
        type: 'request',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id || 'unknown'
      });
    });
    
    next();
  };
};

// Error logging helper
logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    type: 'error',
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Health check logging
logger.health = {
  /**
   * Log health check results
   */
  check: (service, status, data = {}) => {
    const logLevel = status === 'healthy' ? 'info' : 'warn';
    logger[logLevel]('Health Check', {
      type: 'health',
      service,
      status,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// Audit logging
logger.audit = {
  /**
   * Log audit events
   */
  log: (action, data = {}) => {
    logger.info('Audit Event', {
      type: 'audit',
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = logger;