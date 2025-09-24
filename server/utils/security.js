const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { AppError } = require('../middleware/errorHandler');

/**
 * Advanced Security Utilities
 * Free security tools and OWASP compliance helpers
 */

class SecurityManager {
  /**
   * Generate cryptographically secure random tokens
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure API keys
   */
  static generateApiKey() {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `ak_${timestamp}_${randomPart}`;
  }

  /**
   * Hash sensitive data with salt
   */
  static async hashData(data, saltRounds = 12) {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(data, salt);
    } catch (error) {
      throw new AppError('Failed to hash data', 500);
    }
  }

  /**
   * Verify hashed data
   */
  static async verifyHash(data, hash) {
    try {
      return await bcrypt.compare(data, hash);
    } catch (error) {
      throw new AppError('Failed to verify hash', 500);
    }
  }

  /**
   * Generate secure JWT tokens with enhanced claims
   */
  static generateJWT(payload, options = {}) {
    const defaultOptions = {
      expiresIn: '1h',
      issuer: 'interview-master',
      audience: 'interview-master-users',
      algorithm: 'HS256'
    };

    // Extract tokenType from options before passing to jwt.sign
    const { tokenType, ...jwtOptions } = options;
    const tokenOptions = { ...defaultOptions, ...jwtOptions };
    
    // Add security claims
    const enhancedPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: this.generateSecureToken(16), // JWT ID for token tracking
      tokenType: tokenType || 'access'
    };

    return jwt.sign(enhancedPayload, process.env.JWT_SECRET, tokenOptions);
  }

  /**
   * Verify and decode JWT tokens with enhanced validation
   */
  static verifyJWT(token, options = {}) {
    try {
      const defaultOptions = {
        issuer: 'interview-master',
        audience: 'interview-master-users',
        algorithms: ['HS256']
      };

      const verifyOptions = { ...defaultOptions, ...options };
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
      
      // Additional security checks
      if (!decoded.jti) {
        throw new AppError('Invalid token format', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw error;
    }
  }

  /**
   * Generate refresh tokens
   */
  static generateRefreshToken(userId) {
    const payload = {
      userId,
      tokenType: 'refresh',
      scope: 'refresh_access'
    };

    return this.generateJWT(payload, {
      expiresIn: '7d',
      tokenType: 'refresh'
    });
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new AppError('Failed to encrypt data', 500);
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY;
      const decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new AppError('Failed to decrypt data', 500);
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>"'&]/g, (match) => {
        const htmlEntities = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return htmlEntities[match];
      })
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  }

  /**
   * Validate and sanitize object recursively
   */
  static sanitizeObject(obj) {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? this.sanitizeInput(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip potentially dangerous keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        continue;
      }
      sanitized[key] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  /**
   * Generate Content Security Policy
   */
  static generateCSP() {
    return {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    };
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommon: !this.isCommonPassword(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let strength = 'weak';
    if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
      score,
      strength,
      checks,
      suggestions: this.getPasswordSuggestions(checks)
    };
  }

  /**
   * Check if password is commonly used
   */
  static isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', '123123', 'admin123', 'root'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Get password improvement suggestions
   */
  static getPasswordSuggestions(checks) {
    const suggestions = [];
    
    if (!checks.length) suggestions.push('Use at least 8 characters');
    if (!checks.uppercase) suggestions.push('Add uppercase letters');
    if (!checks.lowercase) suggestions.push('Add lowercase letters');
    if (!checks.numbers) suggestions.push('Add numbers');
    if (!checks.symbols) suggestions.push('Add special characters');
    if (!checks.noCommon) suggestions.push('Avoid common passwords');
    
    return suggestions;
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate IP address format
   */
  static isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Check if IP is in private range
   */
  static isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Verify CSRF token
   */
  static verifyCSRFToken(token, sessionToken) {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'base64url'),
      Buffer.from(sessionToken, 'base64url')
    );
  }
}

/**
 * Rate limiting configurations
 */
class RateLimitManager {
  /**
   * General API rate limiting
   */
  static createGeneralLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
      }
    });
  }

  /**
   * Strict rate limiting for authentication endpoints
   */
  static createAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'Authentication rate limit exceeded',
          retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
      }
    });
  }

  /**
   * Speed limiting for expensive operations
   */
  static createSpeedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 10, // Allow 10 requests per windowMs without delay
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
    });
  }

  /**
   * File upload rate limiting
   */
  static createUploadLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Limit each IP to 10 uploads per hour
      message: {
        error: 'Upload limit exceeded, please try again later.',
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }
}

/**
 * Security headers middleware
 */
class SecurityHeaders {
  /**
   * Apply comprehensive security headers
   */
  static applyHeaders() {
    return (req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Enforce HTTPS
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions policy
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Remove server information
      res.removeHeader('X-Powered-By');
      
      next();
    };
  }
}

/**
 * Input validation utilities
 */
class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate URL format
   */
  static isValidURL(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate MongoDB ObjectId
   */
  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Validate phone number (international format)
   */
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate date format
   */
  static isValidDate(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }

  /**
   * Validate file extension
   */
  static isValidFileExtension(filename, allowedExtensions) {
    const extension = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
  }

  /**
   * Validate JSON structure
   */
  static isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = {
  SecurityManager,
  RateLimitManager,
  SecurityHeaders,
  InputValidator
};