const SecurityViolation = require('../models/SecurityViolation');
const Result = require('../models/Result');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { HTTP_STATUS } = require('../constants/httpStatus');
const { AppError } = require('./errorHandler');

/**
 * Middleware to enforce fullscreen mode during exams
 * Checks if user is in fullscreen and logs violations
 */
const enforceFullscreen = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;
    const isFullscreen = req.headers['x-fullscreen-status'] === 'true';
    const userAgent = req.headers['user-agent'];

    // Skip fullscreen check for non-exam routes or if not in exam
    if (!examId) {
      return next();
    }

    // Find active exam result
    const result = await Result.findOne({
      examId,
      userId,
      status: 'in_progress'
    });

    // If no active exam, skip fullscreen enforcement
    if (!result) {
      return next();
    }

    // Check if fullscreen is required for this exam type
    const requiresFullscreen = true; // Default to true for security

    if (requiresFullscreen && !isFullscreen) {
      // Log fullscreen violation
      const violation = new SecurityViolation({
        violationId: uuidv4(),
        userId,
        examId,
        resultId: result.resultId,
        violationType: 'fullscreen_exit',
        severity: 'high',
        timestamp: new Date(),
        details: {
          userAgent,
          ipAddress: req.ip,
          sessionId: req.sessionID,
          route: req.originalUrl,
          method: req.method,
          automaticDetection: true,
          middlewareEnforced: true
        },
        context: {
          examTitle: result.examTitle || 'Mock Interview',
          timeElapsed: Date.now() - new Date(result.startTime).getTime()
        }
      });

      await violation.save();

      // Log security event
      logger.warn('Fullscreen violation detected by middleware', {
        violationId: violation.violationId,
        userId: userId.toString(),
        examId,
        route: req.originalUrl,
        timestamp: violation.timestamp
      });

      // Check violation count for potential exam termination
      const violationCount = await SecurityViolation.countDocuments({
        userId,
        examId,
        violationType: 'fullscreen_exit'
      });

      // Terminate exam if too many violations
      if (violationCount >= 3) {
        await Result.findOneAndUpdate(
          { resultId: result.resultId },
          { 
            status: 'terminated',
            endTime: new Date(),
            terminationReason: 'excessive_fullscreen_violations'
          }
        );

        logger.error('Exam terminated due to excessive fullscreen violations', {
          userId: userId.toString(),
          examId,
          violationCount
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Exam terminated due to excessive security violations',
          data: {
            examId,
            violationCount,
            terminated: true,
            reason: 'excessive_fullscreen_violations'
          }
        });
      }

      // Return warning for fullscreen violation
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Fullscreen mode is required during the exam',
        data: {
          examId,
          violationCount,
          requiresFullscreen: true,
          violationId: violation.violationId,
          warningThreshold: 2,
          terminationThreshold: 3
        }
      });
    }

    // Continue to next middleware if fullscreen check passes
    next();
  } catch (error) {
    logger.error('Error in fullscreen security middleware', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id?.toString(),
      examId: req.params?.examId
    });
    
    // Continue to next middleware even if error occurs
    // to avoid blocking legitimate exam operations
    next();
  }
};

/**
 * Middleware to validate fullscreen status headers
 * Ensures proper fullscreen status reporting from client
 */
const validateFullscreenHeaders = (req, res, next) => {
  const fullscreenStatus = req.headers['x-fullscreen-status'];
  const timestamp = req.headers['x-fullscreen-timestamp'];
  
  // Add fullscreen metadata to request for logging
  req.fullscreenMeta = {
    status: fullscreenStatus === 'true',
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    reported: fullscreenStatus !== undefined
  };
  
  next();
};

/**
 * Middleware to log fullscreen status changes
 * Tracks when users enter/exit fullscreen during exams
 */
const logFullscreenChanges = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user?._id;
    
    if (examId && userId && req.fullscreenMeta) {
      const { status, timestamp, reported } = req.fullscreenMeta;
      
      // Log fullscreen status change
      logger.info('Fullscreen status reported', {
        userId: userId.toString(),
        examId,
        isFullscreen: status,
        timestamp,
        reported,
        route: req.originalUrl,
        userAgent: req.headers['user-agent']
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error in fullscreen logging middleware', {
      error: error.message,
      userId: req.user?._id?.toString(),
      examId: req.params?.examId
    });
    
    next();
  }
};

module.exports = {
  enforceFullscreen,
  validateFullscreenHeaders,
  logFullscreenChanges
};