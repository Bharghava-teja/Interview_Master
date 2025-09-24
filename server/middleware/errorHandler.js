/**
 * Comprehensive Error Handling Middleware
 * Free solution for centralized error management
 */

const { APIResponse, HTTP_STATUS, formatValidationErrors } = require('../utils/responseFormatter');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async Error Wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle different types of errors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])((?:(?!\1)[^\\]|\\.)*)\1/)[2];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, HTTP_STATUS.CONFLICT);
};

const handleValidationErrorDB = (err) => {
  const errors = formatValidationErrors(err);
  const message = 'Invalid input data';
  return new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, true, errors);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', HTTP_STATUS.UNAUTHORIZED);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', HTTP_STATUS.UNAUTHORIZED);
};

const handleMongoNetworkError = () => {
  return new AppError('Database connection failed. Please try again later.', HTTP_STATUS.SERVICE_UNAVAILABLE);
};

const handleRateLimitError = () => {
  return new AppError('Too many requests. Please try again later.', HTTP_STATUS.TOO_MANY_REQUESTS);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // Log error for debugging
  console.error('ERROR 💥:', err);
  
  const errorResponse = {
    success: false,
    message: err.message,
    error: {
      status: err.statusCode,
      stack: err.stack,
      name: err.name,
      isOperational: err.isOperational
    },
    timestamp: new Date().toISOString()
  };
  
  if (err.errors) {
    errorResponse.errors = err.errors;
  }
  
  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const errorResponse = APIResponse.error(err.message, err.errors);
    return errorResponse.send(res, err.statusCode);
  }
  
  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥:', err);
  
  const errorResponse = APIResponse.serverError('Something went wrong!');
  return errorResponse.send(res, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Global Error Handling Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MongoNetworkError') error = handleMongoNetworkError();
    if (error.type === 'entity.too.large') {
      error = new AppError('Request entity too large', HTTP_STATUS.BAD_REQUEST);
    }
    
    sendErrorProd(error, req, res);
  }
};

/**
 * Handle unhandled routes
 */
const handleNotFound = (req, res, next) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  const error = new AppError(message, HTTP_STATUS.NOT_FOUND);
  next(error);
};

/**
 * Validation Error Helper
 */
const createValidationError = (field, message, value = null) => {
  return new AppError('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, true, [{
    field,
    message,
    value
  }]);
};

/**
 * Success Response Helper
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = null) => {
  const response = APIResponse.success(data, message, meta);
  return response.send(res, statusCode);
};

/**
 * Error Response Helper
 */
const sendError = (res, message, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const response = APIResponse.error(message, errors);
  return response.send(res, statusCode);
};

/**
 * Process Handlers for Uncaught Exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  handleNotFound,
  createValidationError,
  sendSuccess,
  sendError,
  handleUncaughtException,
  handleUnhandledRejection
};