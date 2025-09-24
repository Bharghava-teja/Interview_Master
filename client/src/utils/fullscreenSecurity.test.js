/**
 * Tests for FullscreenSecurity utility
 * Validates client-side fullscreen monitoring and server integration
 */

import { FullscreenSecurity } from './fullscreenSecurity';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock document and window objects
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'webkitFullscreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'mozFullScreenElement', {
  writable: true,
  value: null
});

Object.defineProperty(document, 'msFullscreenElement', {
  writable: true,
  value: null
});

// Mock fullscreen API methods
document.documentElement.requestFullscreen = jest.fn().mockResolvedValue();
document.documentElement.webkitRequestFullscreen = jest.fn().mockResolvedValue();
document.documentElement.mozRequestFullScreen = jest.fn().mockResolvedValue();
document.documentElement.msRequestFullscreen = jest.fn().mockResolvedValue();

document.exitFullscreen = jest.fn().mockResolvedValue();
document.webkitExitFullscreen = jest.fn().mockResolvedValue();
document.mozCancelFullScreen = jest.fn().mockResolvedValue();
document.msExitFullscreen = jest.fn().mockResolvedValue();

// Mock console methods
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

describe('FullscreenSecurity', () => {
  let fullscreenSecurity;
  let mockOnWarning;
  let mockOnViolation;
  let mockOnForceExit;

  beforeEach(() => {
    fullscreenSecurity = new FullscreenSecurity();
    mockOnWarning = jest.fn();
    mockOnViolation = jest.fn();
    mockOnForceExit = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Mock successful API responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    if (fullscreenSecurity.isExamModeActive) {
      fullscreenSecurity.disableExamMode();
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default values', () => {
      expect(fullscreenSecurity.isExamModeActive).toBe(false);
      expect(fullscreenSecurity.violationCount).toBe(0);
      expect(fullscreenSecurity.maxViolations).toBe(3);
      expect(fullscreenSecurity.examId).toBe(null);
      expect(fullscreenSecurity.apiBaseUrl).toBe('http://localhost:5000/api/v1');
    });

    it('should use environment API URL when available', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com/v1';
      
      const fs = new FullscreenSecurity();
      expect(fs.apiBaseUrl).toBe('https://api.example.com/v1');
      
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Fullscreen Detection', () => {
    it('should detect fullscreen mode correctly', () => {
      document.fullscreenElement = document.documentElement;
      expect(fullscreenSecurity.isFullscreen()).toBe(true);
      
      document.fullscreenElement = null;
      expect(fullscreenSecurity.isFullscreen()).toBe(false);
    });

    it('should handle webkit fullscreen detection', () => {
      document.webkitFullscreenElement = document.documentElement;
      expect(fullscreenSecurity.isFullscreen()).toBe(true);
      
      document.webkitFullscreenElement = null;
      expect(fullscreenSecurity.isFullscreen()).toBe(false);
    });

    it('should handle mozilla fullscreen detection', () => {
      document.mozFullScreenElement = document.documentElement;
      expect(fullscreenSecurity.isFullscreen()).toBe(true);
      
      document.mozFullScreenElement = null;
      expect(fullscreenSecurity.isFullscreen()).toBe(false);
    });

    it('should handle IE fullscreen detection', () => {
      document.msFullscreenElement = document.documentElement;
      expect(fullscreenSecurity.isFullscreen()).toBe(true);
      
      document.msFullscreenElement = null;
      expect(fullscreenSecurity.isFullscreen()).toBe(false);
    });
  });

  describe('Exam Mode Management', () => {
    it('should enable exam mode with callbacks', async () => {
      await fullscreenSecurity.enableExamMode(
        'test-exam-123',
        mockOnWarning,
        mockOnViolation,
        mockOnForceExit
      );

      expect(fullscreenSecurity.isExamModeActive).toBe(true);
      expect(fullscreenSecurity.examId).toBe('test-exam-123');
      expect(fullscreenSecurity.onWarning).toBe(mockOnWarning);
      expect(fullscreenSecurity.onViolation).toBe(mockOnViolation);
      expect(fullscreenSecurity.onForceExit).toBe(mockOnForceExit);
    });

    it('should sync fullscreen status on enable', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exams/test-exam-123/fullscreen-status'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer null',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should disable exam mode and clean up', () => {
      fullscreenSecurity.enableExamMode('test-exam-123');
      fullscreenSecurity.disableExamMode();

      expect(fullscreenSecurity.isExamModeActive).toBe(false);
      expect(fullscreenSecurity.examId).toBe(null);
      expect(fullscreenSecurity.violationCount).toBe(0);
    });
  });

  describe('Violation Handling', () => {
    beforeEach(async () => {
      await fullscreenSecurity.enableExamMode(
        'test-exam-123',
        mockOnWarning,
        mockOnViolation,
        mockOnForceExit
      );
    });

    it('should record violations correctly', () => {
      fullscreenSecurity.recordViolation('fullscreen_exit', 'User exited fullscreen');
      
      expect(fullscreenSecurity.violationCount).toBe(1);
      expect(fullscreenSecurity.violations).toHaveLength(1);
      expect(fullscreenSecurity.violations[0]).toMatchObject({
        type: 'fullscreen_exit',
        reason: 'User exited fullscreen',
        timestamp: expect.any(Date)
      });
    });

    it('should trigger warning callback on first violation', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123', { onWarning: mockOnWarning });
      fullscreenSecurity.recordViolation('fullscreen_exit', 'Test violation');
      
      expect(mockOnWarning).toHaveBeenCalledWith({
        violationCount: 1,
        maxViolations: 3,
        lastViolation: expect.objectContaining({
          type: 'fullscreen_exit',
          reason: 'Test violation'
        })
      });
    });

    it('should trigger violation callback on each violation', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123', { onViolation: mockOnViolation });
      fullscreenSecurity.recordViolation('fullscreen_exit', 'Test violation');
      
      expect(mockOnViolation).toHaveBeenCalledWith(expect.objectContaining({
        type: 'fullscreen_exit',
        count: 1
      }));
    });

    it('should trigger force exit on max violations', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123', { onForceExit: mockOnForceExit });
      
      // Record violations up to the limit
      for (let i = 0; i < 3; i++) {
        fullscreenSecurity.recordViolation('fullscreen_exit', `Violation ${i + 1}`);
      }
      
      expect(mockOnForceExit).toHaveBeenCalledWith({
        reason: 'max_violations_exceeded',
        violationCount: 3,
        message: 'Too many security violations. Exam will be terminated.'
      });
    });

    it('should set custom max violations', () => {
      fullscreenSecurity.setMaxViolations(5);
      expect(fullscreenSecurity.maxViolations).toBe(5);
    });
  });

  describe('Server Integration', () => {
    beforeEach(async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123');
    });

    it('should sync fullscreen status with server', async () => {
      await fullscreenSecurity.syncFullscreenStatus();
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exams/test-exam-123/fullscreen-status'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer null',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should log violations to server', async () => {
      await fullscreenSecurity.logViolationToServer('fullscreen_exit', 'Test violation');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exams/test-exam-123/violations'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"violationType":"fullscreen_exit"')
        })
      );
    });

    it('should update fullscreen status on server', async () => {
      await fullscreenSecurity.updateFullscreenStatusOnServer(true);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/exams/test-exam-123/fullscreen-status'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-fullscreen-status': 'true'
          })
        })
      );
    });

    it('should get correct fullscreen headers', () => {
      document.fullscreenElement = document.documentElement;
      const headers = fullscreenSecurity.getFullscreenHeaders();
      
      expect(headers).toMatchObject({
        'Content-Type': 'application/json',
        'x-fullscreen-status': 'true',
        'x-exam-id': 'test-exam-123'
      });
    });

    it('should handle server errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(fullscreenSecurity.syncFullscreenStatus()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to sync fullscreen status:',
        expect.any(Error)
      );
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await fullscreenSecurity.enableExamMode(
        'test-exam-123',
        mockOnWarning,
        mockOnViolation,
        mockOnForceExit
      );
    });

    it('should handle fullscreen change events', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123', {
        onViolation: mockOnViolation
      });
      
      // Simulate fullscreen exit
      document.fullscreenElement = null;
      
      // Trigger fullscreen change event
      const event = new Event('fullscreenchange');
      document.dispatchEvent(event);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(fullscreenSecurity.violationCount).toBe(1);
      expect(mockOnViolation).toHaveBeenCalled();
    });

    it('should handle key down events', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123');
      const event = new KeyboardEvent('keydown', { key: 'F11', cancelable: true });
      document.dispatchEvent(event);
      
      expect(event.defaultPrevented).toBe(true);
    });

    it('should prevent context menu during exam', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123');
      const event = new Event('contextmenu', { cancelable: true });
      document.dispatchEvent(event);
      
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('Fullscreen Control', () => {
    it('should request fullscreen successfully', async () => {
      await fullscreenSecurity.requestFullscreen();
      
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should exit fullscreen successfully', async () => {
      await fullscreenSecurity.exitFullscreen();
      
      expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it('should handle fullscreen request errors', async () => {
      document.documentElement.requestFullscreen.mockRejectedValueOnce(
        new Error('Fullscreen not allowed')
      );
      
      await expect(fullscreenSecurity.requestFullscreen()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to request fullscreen:',
        expect.any(Error)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing exam ID gracefully', async () => {
      await fullscreenSecurity.syncFullscreenStatus();
      
      expect(fetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        'Cannot sync fullscreen status: No active exam'
      );
    });

    it('should handle disabled exam mode gracefully', () => {
      fullscreenSecurity.recordViolation('test', 'Test violation');
      
      expect(fullscreenSecurity.violationCount).toBe(0);
      expect(mockOnViolation).not.toHaveBeenCalled();
    });

    it('should handle missing callbacks gracefully', async () => {
      await fullscreenSecurity.enableExamMode('test-exam-123');
      fullscreenSecurity.recordViolation('test', 'Test violation');
      
      expect(fullscreenSecurity.violationCount).toBe(1);
      // Should not throw errors even without callbacks
    });
  });
});