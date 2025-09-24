const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SecurityManager, InputValidator } = require('../utils/security');
const { AppError } = require('./errorHandler');
const redis = require('redis');

// Redis client for session management (optional - falls back to memory)
let redisClient = null;
try {
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.connect();
  }
} catch (error) {
  console.log('Redis not available, using memory-based session management');
}

// In-memory session store (fallback)
const sessionStore = new Map();

/**
 * Enhanced Authentication Middleware
 * Implements JWT security best practices and session management
 */
class AuthMiddleware {
  /**
   * Extract token from request headers or cookies
   */
  static extractToken(req) {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check query parameter (less secure, for specific use cases)
    else if (req.query.token) {
      token = req.query.token;
    }

    return token;
  }

  /**
   * Verify JWT token and load user
   */
  static async authenticate(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (!token) {
        return next(new AppError('Access token required', 401));
      }

      // Verify token
      const decoded = SecurityManager.verifyJWT(token);

      // Check if token is blacklisted
      const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        return next(new AppError('Token has been revoked', 401));
      }

      // Load user from database
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return next(new AppError('User not found', 401));
      }

      // Check if user is active
      if (!user.isActive) {
        return next(new AppError('Account is deactivated', 401));
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
        return next(new AppError('Password was changed recently. Please log in again.', 401));
      }

      // Add user and token info to request
      req.user = user;
      req.token = token;
      req.tokenPayload = decoded;

      // Update last activity
      await AuthMiddleware.updateLastActivity(user._id);

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError('Authentication failed', 401));
    }
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  static async optionalAuth(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (token) {
        const decoded = SecurityManager.verifyJWT(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
          req.tokenPayload = decoded;
        }
      }

      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  }

  /**
   * Role-based authorization
   */
  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      if (!roles.includes(req.user.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }

      next();
    };
  }

  /**
   * Permission-based authorization
   */
  static requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        return next(new AppError(`Permission '${permission}' required`, 403));
      }

      next();
    };
  }

  /**
   * Resource ownership check
   */
  static requireOwnership(resourceField = 'userId') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next(new AppError('Authentication required', 401));
        }

        // Admin can access all resources
        if (req.user.role === 'admin') {
          return next();
        }

        // Check if user owns the resource
        const resourceId = req.params.id || req.body.id;
        if (!resourceId) {
          return next(new AppError('Resource ID required', 400));
        }

        // This is a generic check - specific implementations should override
        const resource = await req.model?.findById(resourceId);
        if (!resource) {
          return next(new AppError('Resource not found', 404));
        }

        if (resource[resourceField]?.toString() !== req.user._id.toString()) {
          return next(new AppError('Access denied - not resource owner', 403));
        }

        req.resource = resource;
        next();
      } catch (error) {
        next(new AppError('Authorization check failed', 500));
      }
    };
  }

  /**
   * Session management
   */
  static async createSession(userId, tokenId, deviceInfo = {}) {
    const sessionData = {
      userId,
      tokenId,
      createdAt: new Date(),
      lastActivity: new Date(),
      deviceInfo: {
        userAgent: deviceInfo.userAgent || 'Unknown',
        ip: deviceInfo.ip || 'Unknown',
        platform: deviceInfo.platform || 'Unknown'
      },
      isActive: true
    };

    const sessionKey = `session:${tokenId}`;
    
    if (redisClient) {
      await redisClient.setEx(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(sessionData)); // 7 days
    } else {
      sessionStore.set(sessionKey, sessionData);
    }

    return sessionData;
  }

  /**
   * Get session data
   */
  static async getSession(tokenId) {
    const sessionKey = `session:${tokenId}`;
    
    if (redisClient) {
      const sessionData = await redisClient.get(sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } else {
      return sessionStore.get(sessionKey) || null;
    }
  }

  /**
   * Update last activity
   */
  static async updateLastActivity(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        lastActivity: new Date()
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Blacklist token (logout)
   */
  static async blacklistToken(tokenId, expiresAt) {
    const blacklistKey = `blacklist:${tokenId}`;
    const ttl = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    
    if (redisClient) {
      await redisClient.setEx(blacklistKey, ttl, 'true');
    } else {
      sessionStore.set(blacklistKey, { blacklisted: true, expiresAt });
      
      // Clean up expired tokens from memory store
      setTimeout(() => {
        sessionStore.delete(blacklistKey);
      }, ttl * 1000);
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(tokenId) {
    const blacklistKey = `blacklist:${tokenId}`;
    
    if (redisClient) {
      const result = await redisClient.get(blacklistKey);
      return result === 'true';
    } else {
      const entry = sessionStore.get(blacklistKey);
      if (entry && entry.expiresAt > Date.now()) {
        return true;
      }
      return false;
    }
  }

  /**
   * Revoke all user sessions
   */
  static async revokeAllUserSessions(userId) {
    try {
      // Update user's password changed timestamp to invalidate all tokens
      await User.findByIdAndUpdate(userId, {
        passwordChangedAt: new Date()
      });

      // If using Redis, we could also scan and delete specific sessions
      if (redisClient) {
        const keys = await redisClient.keys(`session:*`);
        for (const key of keys) {
          const sessionData = await redisClient.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.userId === userId.toString()) {
              await redisClient.del(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to revoke user sessions:', error);
      throw new AppError('Failed to revoke sessions', 500);
    }
  }

  /**
   * Get user active sessions
   */
  static async getUserSessions(userId) {
    const sessions = [];
    
    if (redisClient) {
      const keys = await redisClient.keys(`session:*`);
      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId.toString()) {
            sessions.push({
              tokenId: session.tokenId,
              createdAt: session.createdAt,
              lastActivity: session.lastActivity,
              deviceInfo: session.deviceInfo
            });
          }
        }
      }
    } else {
      for (const [key, session] of sessionStore.entries()) {
        if (key.startsWith('session:') && session.userId === userId.toString()) {
          sessions.push({
            tokenId: session.tokenId,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            deviceInfo: session.deviceInfo
          });
        }
      }
    }
    
    return sessions;
  }

  /**
   * API Key authentication
   */
  static async authenticateApiKey(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return next(new AppError('API key required', 401));
      }

      // Validate API key format
      if (!apiKey.startsWith('ak_')) {
        return next(new AppError('Invalid API key format', 401));
      }

      // Find user by API key (you'll need to add apiKey field to User model)
      const user = await User.findOne({ apiKey, isActive: true }).select('-password');
      
      if (!user) {
        return next(new AppError('Invalid API key', 401));
      }

      req.user = user;
      req.authMethod = 'apiKey';
      
      next();
    } catch (error) {
      next(new AppError('API key authentication failed', 401));
    }
  }

  /**
   * Clear all sessions on server startup
   */
  static async clearAllSessions() {
    try {
      if (redisClient) {
        // Clear all session keys from Redis
        const keys = await redisClient.keys('session:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log(`Cleared ${keys.length} sessions from Redis`);
        }
        
        // Clear all blacklisted tokens
        const blacklistKeys = await redisClient.keys('blacklist:*');
        if (blacklistKeys.length > 0) {
          await redisClient.del(blacklistKeys);
          console.log(`Cleared ${blacklistKeys.length} blacklisted tokens from Redis`);
        }
      } else {
        // Clear memory-based session store
        const sessionCount = sessionStore.size;
        sessionStore.clear();
        console.log(`Cleared ${sessionCount} sessions from memory store`);
      }
      
      console.log('✅ All sessions cleared on server startup');
    } catch (error) {
      console.error('Failed to clear sessions on startup:', error);
    }
  }

  /**
   * Two-factor authentication check
   */
  static requireTwoFactor(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (req.user.twoFactorEnabled && !req.tokenPayload?.twoFactorVerified) {
      return next(new AppError('Two-factor authentication required', 403));
    }

    next();
  }

  /**
   * Device fingerprinting middleware
   */
  static deviceFingerprint(req, res, next) {
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      acceptLanguage: req.headers['accept-language'] || 'Unknown',
      acceptEncoding: req.headers['accept-encoding'] || 'Unknown'
    };

    // Create device fingerprint
    const fingerprintData = JSON.stringify(deviceInfo);
    const deviceFingerprint = require('crypto')
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    req.deviceInfo = deviceInfo;
    req.deviceFingerprint = deviceFingerprint;
    
    next();
  }

  /**
   * Suspicious activity detection
   */
  static async detectSuspiciousActivity(req, res, next) {
    try {
      if (!req.user) {
        return next();
      }

      const currentIP = req.ip || req.connection.remoteAddress;
      const user = req.user;

      // Check for IP changes
      if (user.lastKnownIP && user.lastKnownIP !== currentIP) {
        // Log suspicious activity
        console.warn(`Suspicious activity: User ${user._id} logged in from new IP: ${currentIP}`);
        
        // You could implement additional security measures here:
        // - Send email notification
        // - Require additional verification
        // - Log security event
      }

      // Update user's last known IP
      await User.findByIdAndUpdate(user._id, {
        lastKnownIP: currentIP
      });

      next();
    } catch (error) {
      // Don't fail the request for suspicious activity detection errors
      console.error('Suspicious activity detection error:', error);
      next();
    }
  }
}

/**
 * Middleware factory for common auth patterns
 */
class AuthFactory {
  /**
   * Create middleware chain for protected routes
   */
  static protected(...roles) {
    const middleware = [AuthMiddleware.authenticate];
    
    if (roles.length > 0) {
      middleware.push(AuthMiddleware.authorize(...roles));
    }
    
    return middleware;
  }

  /**
   * Create middleware chain for admin routes
   */
  static admin() {
    return [
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize('admin'),
      AuthMiddleware.requireTwoFactor
    ];
  }

  /**
   * Create middleware chain for API routes
   */
  static api() {
    return [
      AuthMiddleware.authenticateApiKey
    ];
  }

  /**
   * Create middleware chain with device tracking
   */
  static withDeviceTracking() {
    return [
      AuthMiddleware.deviceFingerprint,
      AuthMiddleware.authenticate,
      AuthMiddleware.detectSuspiciousActivity
    ];
  }
}

module.exports = {
  AuthMiddleware,
  AuthFactory
};