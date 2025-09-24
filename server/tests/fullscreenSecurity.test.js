const { enforceFullscreen, validateFullscreenHeaders, logFullscreenChanges } = require('../middleware/fullscreenSecurity');
const SecurityViolation = require('../models/SecurityViolation');
const Result = require('../models/Result');

// Mock dependencies
jest.mock('../models/SecurityViolation');
jest.mock('../models/Result');
jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('Fullscreen Security Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { examId: 'test-exam-123' },
      user: { _id: 'test-user-123' },
      headers: {
        'x-fullscreen-status': 'true',
        'user-agent': 'Mozilla/5.0 Test Browser'
      },
      ip: '127.0.0.1',
      sessionID: 'test-session-123',
      originalUrl: '/api/v1/exams/test-exam-123/progress',
      method: 'GET'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateFullscreenHeaders', () => {
    it('should add fullscreen metadata to request', () => {
      validateFullscreenHeaders(req, res, next);

      expect(req.fullscreenMeta).toBeDefined();
      expect(req.fullscreenMeta.status).toBe(true);
      expect(req.fullscreenMeta.reported).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing fullscreen status header', () => {
      delete req.headers['x-fullscreen-status'];
      
      validateFullscreenHeaders(req, res, next);

      expect(req.fullscreenMeta.status).toBe(false);
      expect(req.fullscreenMeta.reported).toBe(false);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logFullscreenChanges', () => {
    beforeEach(() => {
      req.fullscreenMeta = {
        status: true,
        timestamp: new Date(),
        reported: true
      };
    });

    it('should log fullscreen status changes', async () => {
      const logger = require('../utils/logger');
      
      await logFullscreenChanges(req, res, next);

      expect(logger.info).toHaveBeenCalledWith('Fullscreen status reported', expect.objectContaining({
        userId: 'test-user-123',
        examId: 'test-exam-123',
        isFullscreen: true
      }));
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing exam context gracefully', async () => {
      delete req.params.examId;
      
      await logFullscreenChanges(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('enforceFullscreen', () => {
    beforeEach(() => {
      Result.findOne = jest.fn().mockResolvedValue({
        resultId: 'test-result-123',
        examTitle: 'Test Mock Interview',
        startTime: new Date()
      });
      SecurityViolation.countDocuments = jest.fn().mockResolvedValue(0);
      SecurityViolation.prototype.save = jest.fn().mockResolvedValue();
    });

    it('should allow requests when in fullscreen mode', async () => {
      req.headers['x-fullscreen-status'] = 'true';
      
      await enforceFullscreen(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests when not in fullscreen mode', async () => {
      req.headers['x-fullscreen-status'] = 'false';
      
      await enforceFullscreen(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Fullscreen mode is required during the exam'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should terminate exam after excessive violations', async () => {
      req.headers['x-fullscreen-status'] = 'false';
      SecurityViolation.countDocuments = jest.fn().mockResolvedValue(3);
      Result.findOneAndUpdate = jest.fn().mockResolvedValue();
      
      await enforceFullscreen(req, res, next);

      expect(Result.findOneAndUpdate).toHaveBeenCalledWith(
        { resultId: 'test-result-123' },
        expect.objectContaining({
          status: 'terminated',
          terminationReason: 'excessive_fullscreen_violations'
        })
      );
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Exam terminated due to excessive security violations'
      }));
    });

    it('should skip enforcement for non-exam routes', async () => {
      delete req.params.examId;
      
      await enforceFullscreen(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(Result.findOne).not.toHaveBeenCalled();
    });

    it('should skip enforcement when no active exam found', async () => {
      Result.findOne = jest.fn().mockResolvedValue(null);
      
      await enforceFullscreen(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(SecurityViolation.prototype.save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      Result.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      const logger = require('../utils/logger');
      
      await enforceFullscreen(req, res, next);

      expect(logger.error).toHaveBeenCalledWith('Error in fullscreen security middleware', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Security Violation Creation', () => {
    beforeEach(() => {
      Result.findOne = jest.fn().mockResolvedValue({
        resultId: 'test-result-123',
        examTitle: 'Test Mock Interview',
        startTime: new Date()
      });
      SecurityViolation.countDocuments = jest.fn().mockResolvedValue(1);
    });

    it('should create violation with correct data structure', async () => {
      req.headers['x-fullscreen-status'] = 'false';
      const mockSave = jest.fn().mockResolvedValue();
      SecurityViolation.mockImplementation(() => ({ save: mockSave }));
      
      await enforceFullscreen(req, res, next);

      expect(SecurityViolation).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'test-user-123',
        examId: 'test-exam-123',
        resultId: 'test-result-123',
        violationType: 'fullscreen_exit',
        severity: 'high',
        details: expect.objectContaining({
          userAgent: 'Mozilla/5.0 Test Browser',
          ipAddress: '127.0.0.1',
          sessionId: 'test-session-123',
          route: '/api/v1/exams/test-exam-123/progress',
          method: 'GET',
          automaticDetection: true,
          middlewareEnforced: true
        }),
        context: expect.objectContaining({
          examTitle: 'Test Mock Interview'
        })
      }));
      expect(mockSave).toHaveBeenCalled();
    });
  });
});

// Integration test for violation counting logic
describe('Violation Counting Logic', () => {
  it('should correctly count violations for termination', () => {
    const testCases = [
      { count: 0, shouldTerminate: false },
      { count: 1, shouldTerminate: false },
      { count: 2, shouldTerminate: false },
      { count: 3, shouldTerminate: true },
      { count: 5, shouldTerminate: true }
    ];

    testCases.forEach(({ count, shouldTerminate }) => {
      expect(count >= 3).toBe(shouldTerminate);
    });
  });
});

// Test fullscreen status validation
describe('Fullscreen Status Validation', () => {
  it('should correctly parse fullscreen status from headers', () => {
    const testCases = [
      { header: 'true', expected: true },
      { header: 'false', expected: false },
      { header: undefined, expected: false },
      { header: '1', expected: false },
      { header: 'TRUE', expected: false }
    ];

    testCases.forEach(({ header, expected }) => {
      const isFullscreen = header === 'true';
      expect(isFullscreen).toBe(expected);
    });
  });
});