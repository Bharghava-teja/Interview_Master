/**
 * Fullscreen Security Utility for Exam Mode
 * Enforces strict fullscreen mode during exams with multiple security layers
 */

class FullscreenSecurity {
  constructor() {
    this.isExamMode = false;
    this.isExamModeActive = false;
    this.violationCount = 0;
    this.maxViolations = 3;
    this.violations = [];
    this.warningCallback = null;
    this.violationCallback = null;
    this.forceExitCallback = null;
    this.eventListeners = [];
    this.monitoringInterval = null;
    this.lastFullscreenCheck = Date.now();
    this.examId = null;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    
    // Bind methods to preserve context
    this.handleFullscreenChange = this.handleFullscreenChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleFocusChange = this.handleFocusChange.bind(this);
  }

  /**
   * Initialize exam mode with strict fullscreen enforcement
   */
  async enableExamMode(examId, onWarning, onViolation, onForceExit) {
    this.isExamMode = true;
    this.isExamModeActive = true;
    this.examId = examId;
    this.violationCount = 0;
    
    // Handle both callback object and individual parameters
    if (typeof onWarning === 'object' && onWarning !== null) {
      // Called with callbacks object as second parameter
      const callbacks = onWarning;
      if (callbacks.onWarning) this.warningCallback = callbacks.onWarning;
      if (callbacks.onViolation) this.violationCallback = callbacks.onViolation;
      if (callbacks.onForceExit) this.forceExitCallback = callbacks.onForceExit;
    } else {
      // Called with individual callback parameters
      if (onWarning) this.warningCallback = onWarning;
      if (onViolation) this.violationCallback = onViolation;
      if (onForceExit) this.forceExitCallback = onForceExit;
    }

    // Get current fullscreen status from server
    await this.syncFullscreenStatus();

    // Enter fullscreen immediately
    await this.enterFullscreen();
    
    // Set up all security event listeners
    this.setupEventListeners();
    
    // Start continuous monitoring
    this.startMonitoring();
    
    console.log('Exam mode activated with fullscreen security for exam:', examId);
  }

  // Getter properties for callback access
  get onWarning() {
    return this.warningCallback;
  }

  get onViolation() {
    return this.violationCallback;
  }

  get onForceExit() {
    return this.forceExitCallback;
  }

  /**
   * Disable exam mode and restore normal behavior
   */
  async disableExamMode() {
    this.isExamMode = false;
    this.isExamModeActive = false;
    this.examId = null;
    this.violationCount = 0;
    this.violations = [];
    this.removeEventListeners();
    this.stopMonitoring();
    
    // Allow normal fullscreen exit
    if (document.fullscreenElement) {
      try {
        const exitPromise = document.exitFullscreen();
        if (exitPromise && exitPromise.catch) {
          await exitPromise.catch(() => {});
        }
      } catch (error) {
        // Ignore fullscreen exit errors
      }
    }
    
    console.log('Exam mode deactivated');
  }

  /**
   * Force enter fullscreen mode
   */
  async enterFullscreen() {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  }

  /**
   * Check if currently in fullscreen mode
   */
  isFullscreen() {
    return !!(document.fullscreenElement || 
             document.webkitFullscreenElement || 
             document.msFullscreenElement || 
             document.mozFullScreenElement);
  }

  /**
   * Set up all security event listeners
   */
  setupEventListeners() {
    // Fullscreen change detection
    this.addEventListener(document, 'fullscreenchange', this.handleFullscreenChange);
    this.addEventListener(document, 'webkitfullscreenchange', this.handleFullscreenChange);
    this.addEventListener(document, 'msfullscreenchange', this.handleFullscreenChange);
    this.addEventListener(document, 'mozfullscreenchange', this.handleFullscreenChange);

    // Keyboard event blocking
    this.addEventListener(document, 'keydown', this.handleKeyDown, true);
    this.addEventListener(document, 'keyup', this.handleKeyDown, true);
    this.addEventListener(document, 'keypress', this.handleKeyDown, true);

    // Visibility and focus changes
    this.addEventListener(document, 'visibilitychange', this.handleVisibilityChange);
    this.addEventListener(window, 'blur', this.handleFocusChange);
    this.addEventListener(window, 'focus', this.handleFocusChange);

    // Prevent page unload
    this.addEventListener(window, 'beforeunload', this.handleBeforeUnload);
    this.addEventListener(window, 'unload', this.handleBeforeUnload);

    // Disable context menu
    this.addEventListener(document, 'contextmenu', this.handleContextMenu);

    // Prevent developer tools
    this.addEventListener(document, 'selectstart', (e) => e.preventDefault());
    this.addEventListener(document, 'dragstart', (e) => e.preventDefault());
  }

  /**
   * Add event listener and track for cleanup
   */
  addEventListener(element, event, handler, useCapture = false) {
    element.addEventListener(event, handler, useCapture);
    this.eventListeners.push({ element, event, handler, useCapture });
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.eventListeners.forEach(({ element, event, handler, useCapture }) => {
      element.removeEventListener(event, handler, useCapture);
    });
    this.eventListeners = [];
  }

  /**
   * Handle fullscreen change events
   */
  async handleFullscreenChange() {
    if (!this.isExamMode) return;

    const isCurrentlyFullscreen = this.isFullscreen();
    
    // Update server with current fullscreen status
    await this.updateFullscreenStatusOnServer(isCurrentlyFullscreen);

    if (!isCurrentlyFullscreen) {
      // Log violation to server
      await this.logViolationToServer('fullscreen_exit', 'high', {
        trigger: 'fullscreen_change_event',
        previousState: 'fullscreen',
        currentState: 'windowed'
      });
      
      this.recordViolation('fullscreen_exit');
      
      // Show warning
      if (this.warningCallback) {
        this.warningCallback({
          type: 'fullscreen_exit',
          message: 'You cannot exit fullscreen mode during the exam!',
          violationCount: this.violationCount
        });
      }

      // Force re-enter fullscreen after a short delay
      setTimeout(async () => {
        if (this.isExamMode && !this.isFullscreen()) {
          await this.enterFullscreen();
        }
      }, 100);
    }
  }

  /**
   * Handle keyboard events to block dangerous key combinations
   */
  handleKeyDown(event) {
    if (!this.isExamMode) return;

    const { key, ctrlKey, altKey, metaKey, shiftKey } = event;
    
    // Block dangerous key combinations
    const blockedCombinations = [
      // Fullscreen exit
      { key: 'F11' },
      { key: 'Escape' },
      
      // Developer tools
      { key: 'F12' },
      { ctrlKey: true, shiftKey: true, key: 'I' },
      { ctrlKey: true, shiftKey: true, key: 'J' },
      { ctrlKey: true, shiftKey: true, key: 'C' },
      { ctrlKey: true, key: 'U' },
      
      // Navigation
      { altKey: true, key: 'Tab' },
      { ctrlKey: true, key: 'Tab' },
      { metaKey: true, key: 'Tab' },
      { altKey: true, key: 'F4' },
      
      // Refresh/reload
      { key: 'F5' },
      { ctrlKey: true, key: 'R' },
      { ctrlKey: true, key: 'F5' },
      
      // Window management
      { metaKey: true, key: 'M' }, // Minimize on Mac
      { altKey: true, key: ' ' }, // System menu
    ];

    const isBlocked = blockedCombinations.some(combo => {
      return Object.keys(combo).every(prop => {
        if (prop === 'key') return combo[prop] === key;
        return combo[prop] === event[prop];
      });
    });

    if (isBlocked) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      this.recordViolation('blocked_key', { key, ctrlKey, altKey, metaKey, shiftKey });
      
      if (this.warningCallback) {
        this.warningCallback({
          type: 'blocked_key',
          message: `Key combination blocked during exam: ${this.formatKeyCombo(event)}`,
          violationCount: this.violationCount
        });
      }
      
      return false;
    }
  }

  /**
   * Handle visibility change (tab switching, window minimizing)
   */
  handleVisibilityChange() {
    if (!this.isExamMode) return;

    if (document.hidden) {
      this.recordViolation('visibility_hidden');
      
      if (this.warningCallback) {
        this.warningCallback({
          type: 'visibility_hidden',
          message: 'You cannot switch tabs or minimize the window during the exam!',
          violationCount: this.violationCount
        });
      }
    }
  }

  /**
   * Handle window focus changes
   */
  handleFocusChange(event) {
    if (!this.isExamMode) return;

    if (event.type === 'blur') {
      this.recordViolation('window_blur');
      
      if (this.warningCallback) {
        this.warningCallback({
          type: 'window_blur',
          message: 'You cannot switch to other applications during the exam!',
          violationCount: this.violationCount
        });
      }
    }
  }

  /**
   * Handle page unload attempts
   */
  handleBeforeUnload(event) {
    if (!this.isExamMode) return;

    event.preventDefault();
    event.returnValue = 'You cannot leave the exam page!';
    
    this.recordViolation('page_unload');
    
    return 'You cannot leave the exam page!';
  }

  /**
   * Handle context menu (right-click)
   */
  handleContextMenu(event) {
    if (!this.isExamMode) return;

    event.preventDefault();
    
    if (this.warningCallback) {
      this.warningCallback({
        type: 'context_menu',
        message: 'Right-click is disabled during the exam!',
        violationCount: this.violationCount
      });
    }
    
    return false;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      if (!this.isExamMode) return;

      // Check fullscreen status
      if (!this.isFullscreen()) {
        this.enterFullscreen();
      }

      // Check for suspicious activity
      this.detectSuspiciousActivity();
      
      this.lastFullscreenCheck = Date.now();
    }, 1000); // Check every second
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity() {
    // Check if developer tools might be open
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      this.recordViolation('dev_tools_suspected');
      
      if (this.warningCallback) {
        this.warningCallback({
          type: 'dev_tools_suspected',
          message: 'Developer tools are not allowed during the exam!',
          violationCount: this.violationCount
        });
      }
    }
  }

  /**
   * Request fullscreen mode (alias for enterFullscreen)
   */
  async requestFullscreen() {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to request fullscreen:', error);
      return false;
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      return false;
    }
  }

  /**
   * Record a security violation
   */
  recordViolation(type, details = {}) {
    // Only record violations when exam mode is active
    if (!this.isExamMode) {
      return;
    }
    
    this.violationCount++;
    
    const violation = {
      type,
      timestamp: new Date(),
      details,
      count: this.violationCount,
      reason: details.reason || details
    };

    // Store violation in array
    this.violations.push(violation);

    // Report to callback
    if (this.violationCallback) {
      this.violationCallback(violation);
    }

    // Trigger warning callback
    if (this.warningCallback) {
      this.warningCallback({
        violationCount: this.violationCount,
        maxViolations: this.maxViolations,
        lastViolation: violation
      });
    }

    // Check if max violations exceeded
    if (this.violationCount >= this.maxViolations) {
      this.handleMaxViolations();
    }

    console.warn('Security violation recorded:', violation);
  }

  /**
   * Handle maximum violations exceeded
   */
  handleMaxViolations() {
    if (this.forceExitCallback) {
      this.forceExitCallback({
        reason: 'max_violations_exceeded',
        violationCount: this.violationCount,
        message: 'Too many security violations. Exam will be terminated.'
      });
    }
  }

  /**
   * Format key combination for display
   */
  formatKeyCombo(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Cmd');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key);
    return parts.join('+');
  }

  /**
   * Get current security status
   */
  getStatus() {
    return {
      isExamMode: this.isExamMode,
      isFullscreen: this.isFullscreen(),
      violationCount: this.violationCount,
      maxViolations: this.maxViolations,
      isMonitoring: !!this.monitoringInterval
    };
  }

  /**
   * Reset violation count
   */
  resetViolations() {
    this.violationCount = 0;
  }

  /**
   * Set maximum allowed violations
   */
  setMaxViolations(max) {
    this.maxViolations = Math.max(1, max);
  }

  /**
   * Sync fullscreen status with server
   */
  async syncFullscreenStatus() {
    if (!this.examId) {
      console.warn('Cannot sync fullscreen status: No active exam');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.apiBaseUrl}/exams/${this.examId}/fullscreen-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.violationCount = data.data.totalViolations || 0;
        this.maxViolations = data.data.terminationThreshold || 3;
        console.log('Synced fullscreen status:', data.data);
      }
    } catch (error) {
      console.error('Failed to sync fullscreen status:', error);
    }
  }

  /**
   * Log security violation to server
   */
  async logViolationToServer(violationType, severity = 'high', details = {}) {
    if (!this.examId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.apiBaseUrl}/exams/${this.examId}/violations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          violationType,
          severity,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.violationCount = data.data.violationCount || this.violationCount + 1;
        
        if (data.data.shouldTerminate) {
          console.warn('Exam terminated due to excessive violations');
          if (this.forceExitCallback) {
            this.forceExitCallback({
              reason: 'excessive_violations',
              violationCount: this.violationCount,
              message: 'Exam has been terminated due to excessive security violations'
            });
          }
        }
        
        return data.data;
      } else {
        console.error('Failed to log violation:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging violation to server:', error);
    }
  }

  /**
   * Update fullscreen status on server
   */
  async updateFullscreenStatusOnServer(isFullscreen) {
    if (!this.examId) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.apiBaseUrl}/exams/${this.examId}/fullscreen-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-fullscreen-status': isFullscreen.toString(),
          'x-fullscreen-timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          isFullscreen,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Updated fullscreen status on server:', data.data);
        return data.data;
      } else {
        console.error('Failed to update fullscreen status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating fullscreen status:', error);
    }
  }

  /**
   * Add fullscreen headers to API requests
   */
  getFullscreenHeaders() {
    const isFullscreen = this.isFullscreen();
    const headers = {
      'Content-Type': 'application/json',
      'x-fullscreen-status': isFullscreen.toString(),
      'x-fullscreen-timestamp': new Date().toISOString()
    };
    
    if (this.examId) {
      headers['x-exam-id'] = this.examId;
    }
    
    return headers;
  }
}

// Create singleton instance
const fullscreenSecurity = new FullscreenSecurity();

export default fullscreenSecurity;
export { FullscreenSecurity };