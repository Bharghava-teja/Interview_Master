const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use MongoDB to store rate limit data
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'rate_limits',
    expireTimeMs: 15 * 60 * 1000
  })
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'auth_rate_limits',
    expireTimeMs: 15 * 60 * 1000
  })
});

// Code execution limiter (more restrictive)
const codeExecutionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 code executions per 5 minutes
  message: {
    error: 'Code execution rate limit exceeded. Please wait before running more code.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'code_execution_limits',
    expireTimeMs: 5 * 60 * 1000
  })
});

// Security violation reporting limiter
const violationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Allow up to 20 violation reports per minute (for legitimate exam activity)
  message: {
    error: 'Security violation reporting rate limit exceeded.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'violation_rate_limits',
    expireTimeMs: 1 * 60 * 1000
  })
});

// Progress saving limiter (allow frequent saves during exam)
const progressLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Allow up to 30 progress saves per minute
  message: {
    error: 'Progress saving rate limit exceeded.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'progress_rate_limits',
    expireTimeMs: 1 * 60 * 1000
  })
});

// File upload limiter (more lenient than auth limiter)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow up to 20 file uploads per 15 minutes
  message: {
    error: 'File upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoStore({
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview-master',
    collectionName: 'upload_rate_limits',
    expireTimeMs: 15 * 60 * 1000
  })
});

module.exports = {
  generalLimiter,
  authLimiter,
  codeExecutionLimiter,
  violationLimiter,
  progressLimiter,
  uploadLimiter
};