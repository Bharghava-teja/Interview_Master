const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const DOMPurify = require('isomorphic-dompurify');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitize input to prevent XSS attacks
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(xss(obj));
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
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

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Code execution validation
const validateCodeExecution = [
  body('code')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Code must be between 1 and 10000 characters'),
  body('language')
    .isIn(['javascript', 'python', 'java', 'c++'])
    .withMessage('Invalid programming language'),
  body('input')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Input must not exceed 1000 characters'),
  handleValidationErrors
];

// Security violation validation
const validateSecurityViolation = [
  body('examId')
    .matches(/^exam_[a-f0-9-]+$/)
    .withMessage('Invalid exam ID format'),
  body('violationType')
    .isIn([
      'fullscreen_exit', 'tab_switch', 'window_blur', 'right_click',
      'copy_paste', 'keyboard_shortcut', 'developer_tools', 'multiple_tabs',
      'suspicious_activity', 'network_disconnection', 'browser_extension',
      'virtual_machine', 'screen_sharing', 'external_monitor', 'mobile_device',
      'suspicious_timing', 'pattern_anomaly', 'ai_detection'
    ])
    .withMessage('Invalid violation type'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  handleValidationErrors
];

// Exam progress validation
const validateExamProgress = [
  body('examId')
    .matches(/^exam_[a-f0-9-]+$/)
    .withMessage('Invalid exam ID format'),
  body('answers')
    .optional()
    .isArray()
    .withMessage('Answers must be an array'),
  body('answers.*.questionId')
    .optional()
    .matches(/^q_[a-f0-9-]+$/)
    .withMessage('Invalid question ID format'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0, max: 86400000 }) // Max 24 hours in milliseconds
    .withMessage('Invalid time spent value'),
  handleValidationErrors
];

// MCQ/Coding feedback validation removed - no longer supported

// Query parameter validation for exam history
const validateExamHistoryQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'abandoned', 'auto_submitted'])
    .withMessage('Invalid status value'),
  handleValidationErrors
];

// MCQ query validation removed - no longer supported

module.exports = {
  sanitizeInput,
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCodeExecution,
  validateSecurityViolation,
  validateExamProgress,
  validateExamHistoryQuery
  // validateFeedback and validateMCQQuery removed - no longer supported
};