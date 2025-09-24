const mongoose = require('mongoose');
const validator = require('validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced Data Validation Utilities
 * Free validation helpers for MongoDB schemas
 */

/**
 * Email validation function for Mongoose schema
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const emailValidator = function(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format check
  if (!validator.isEmail(email)) return false;
  
  // Additional security checks
  const sanitized = validator.normalizeEmail(email, {
    gmail_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_lowercase: true,
    outlookdotcom_remove_subaddress: false,
    yahoo_lowercase: true,
    yahoo_remove_subaddress: false,
    icloud_lowercase: true,
    icloud_remove_subaddress: false
  });
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+.*\+/, // Multiple plus signs
    /\.{2,}/, // Multiple consecutive dots
    /@.*@/, // Multiple @ symbols
    /[<>"'`]/, // Potentially dangerous characters
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(sanitized));
};

/**
 * Password validation function for Mongoose schema
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid password
 */
const passwordValidator = function(password) {
  if (!password || typeof password !== 'string') return false;
  
  // Minimum length
  if (password.length < 8) return false;
  
  // Maximum length (prevent DoS)
  if (password.length > 128) return false;
  
  // Must contain at least 3 of the following:
  // - lowercase letter
  // - uppercase letter
  // - number
  // - special character
  const patterns = [
    /[a-z]/, // lowercase
    /[A-Z]/, // uppercase
    /[0-9]/, // number
    /[^a-zA-Z0-9]/ // special character
  ];
  
  const matchedPatterns = patterns.filter(pattern => pattern.test(password)).length;
  
  return matchedPatterns >= 3;
};

class DataValidator {
  /**
   * Email validation with comprehensive checks
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const disposableEmailDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];
    
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }
    
    const domain = email.split('@')[1].toLowerCase();
    if (disposableEmailDomains.includes(domain)) {
      throw new AppError('Disposable email addresses are not allowed', 400);
    }
    
    return true;
  }

  /**
   * Password strength validation
   */
  static validatePassword(password) {
    const minLength = 8;
    const maxLength = 128;
    
    if (password.length < minLength) {
      throw new AppError(`Password must be at least ${minLength} characters long`, 400);
    }
    
    if (password.length > maxLength) {
      throw new AppError(`Password cannot exceed ${maxLength} characters`, 400);
    }
    
    // Check for at least one uppercase, lowercase, number, and special character
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const missingRequirements = [];
    if (!hasUppercase) missingRequirements.push('uppercase letter');
    if (!hasLowercase) missingRequirements.push('lowercase letter');
    if (!hasNumber) missingRequirements.push('number');
    if (!hasSpecialChar) missingRequirements.push('special character');
    
    if (missingRequirements.length > 0) {
      throw new AppError(
        `Password must contain at least one: ${missingRequirements.join(', ')}`,
        400
      );
    }
    
    // Check against common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      throw new AppError('Password is too common. Please choose a stronger password', 400);
    }
    
    return true;
  }

  /**
   * Sanitize user input to prevent injection attacks
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>"'&]/g, (match) => {
        const htmlEntities = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return htmlEntities[match];
      });
  }

  /**
   * Validate ObjectId format
   */
  static validateObjectId(id, fieldName = 'ID') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid ${fieldName} format`, 400);
    }
    return true;
  }

  /**
   * Validate exam configuration
   */
  static validateExamConfig(config) {
    const errors = [];
    
    // Time limits validation
    if (config.mcqTimeLimit && (config.mcqTimeLimit < 300 || config.mcqTimeLimit > 7200)) {
      errors.push('MCQ time limit must be between 5 minutes (300s) and 2 hours (7200s)');
    }
    
    if (config.codingTimeLimit && (config.codingTimeLimit < 900 || config.codingTimeLimit > 14400)) {
      errors.push('Coding time limit must be between 15 minutes (900s) and 4 hours (14400s)');
    }
    
    // Number of questions validation
    if (config.numberOfQuestions && (config.numberOfQuestions < 1 || config.numberOfQuestions > 100)) {
      errors.push('Number of questions must be between 1 and 100');
    }
    
    // Category validation
    const validCategories = [
      'javascript', 'python', 'java', 'cpp', 'csharp', 'php',
      'ruby', 'go', 'rust', 'typescript', 'react', 'nodejs',
      'algorithms', 'data-structures', 'system-design', 'databases'
    ];
    
    if (config.mcqCategory && !validCategories.includes(config.mcqCategory)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    if (errors.length > 0) {
      throw new AppError(`Exam configuration errors: ${errors.join('; ')}`, 400);
    }
    
    return true;
  }

  /**
   * Validate question data
   */
  static validateQuestion(question) {
    const errors = [];
    
    if (!question.question || question.question.trim().length < 10) {
      errors.push('Question text must be at least 10 characters long');
    }
    
    if (question.type === 'mcq') {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push('MCQ questions must have at least 2 options');
      }
      
      if (question.options && question.options.length > 6) {
        errors.push('MCQ questions cannot have more than 6 options');
      }
      
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        errors.push('MCQ questions must have a correct answer specified');
      }
    }
    
    if (question.type === 'coding') {
      if (!question.codeTemplate) {
        errors.push('Coding questions must have a code template');
      }
      
      if (!question.testCases || !Array.isArray(question.testCases) || question.testCases.length === 0) {
        errors.push('Coding questions must have at least one test case');
      }
    }
    
    if (question.points && (question.points < 1 || question.points > 100)) {
      errors.push('Question points must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      throw new AppError(`Question validation errors: ${errors.join('; ')}`, 400);
    }
    
    return true;
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }
    
    if (file.size > maxSize) {
      throw new AppError(`File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`, 400);
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400);
    }
    
    return true;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1) {
      throw new AppError('Page number must be greater than 0', 400);
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new AppError('Limit must be between 1 and 100', 400);
    }
    
    return { page: pageNum, limit: limitNum };
  }

  /**
   * Validate date range
   */
  static validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime())) {
      throw new AppError('Invalid start date format', 400);
    }
    
    if (isNaN(end.getTime())) {
      throw new AppError('Invalid end date format', 400);
    }
    
    if (start >= end) {
      throw new AppError('Start date must be before end date', 400);
    }
    
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (end - start > maxRange) {
      throw new AppError('Date range cannot exceed 1 year', 400);
    }
    
    return { startDate: start, endDate: end };
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      throw new AppError('Search query must be a non-empty string', 400);
    }
    
    const sanitized = query.trim();
    
    if (sanitized.length < 2) {
      throw new AppError('Search query must be at least 2 characters long', 400);
    }
    
    if (sanitized.length > 100) {
      throw new AppError('Search query cannot exceed 100 characters', 400);
    }
    
    // Remove potentially dangerous characters
    const cleaned = sanitized.replace(/[<>"'&${}]/g, '');
    
    return cleaned;
  }

  /**
   * Validate IP address
   */
  static validateIPAddress(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      throw new AppError('Invalid IP address format', 400);
    }
    
    return true;
  }

  /**
   * Validate exam attempt data
   */
  static validateExamAttempt(attemptData) {
    const errors = [];
    
    if (!attemptData.answers || !Array.isArray(attemptData.answers)) {
      errors.push('Answers must be provided as an array');
    }
    
    if (attemptData.answers) {
      attemptData.answers.forEach((answer, index) => {
        if (!answer.questionId) {
          errors.push(`Answer ${index + 1}: Question ID is required`);
        }
        
        if (!answer.questionType) {
          errors.push(`Answer ${index + 1}: Question type is required`);
        }
        
        if (answer.userAnswer === undefined || answer.userAnswer === null) {
          errors.push(`Answer ${index + 1}: User answer is required`);
        }
      });
    }
    
    if (errors.length > 0) {
      throw new AppError(`Exam attempt validation errors: ${errors.join('; ')}`, 400);
    }
    
    return true;
  }
}

/**
 * Mongoose schema validators
 */
const schemaValidators = {
  // Email validator for schemas
  email: {
    validator: function(email) {
      try {
        DataValidator.validateEmail(email);
        return true;
      } catch (error) {
        return false;
      }
    },
    message: 'Invalid email address'
  },
  
  // Password validator for schemas
  password: {
    validator: function(password) {
      try {
        DataValidator.validatePassword(password);
        return true;
      } catch (error) {
        return false;
      }
    },
    message: 'Password does not meet security requirements'
  },
  
  // ObjectId validator
  objectId: {
    validator: function(id) {
      return mongoose.Types.ObjectId.isValid(id);
    },
    message: 'Invalid ObjectId format'
  },
  
  // URL validator
  url: {
    validator: function(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Invalid URL format'
  },
  
  // Phone number validator (international format)
  phone: {
    validator: function(phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone);
    },
    message: 'Invalid phone number format'
  }
};

module.exports = {
  DataValidator,
  schemaValidators,
  emailValidator,
  passwordValidator
};