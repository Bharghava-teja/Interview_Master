class SecurityService {
  constructor() {
    this.violations = [];
    this.isMonitoring = false;
    this.callbacks = {
      onViolation: null,
      onAutoSubmit: null,
      onWarning: null
    };
    this.violationThresholds = {
      maxViolations: 3,
      autoSubmitDelay: 5000 // 5 seconds warning before auto-submit
    };
    this.monitoringIntervals = [];
    this.isFullscreen = false;
    this.keyListeners = [];
    this.mouseListeners = [];
    this.focusListeners = [];
    this.lastViolationTime = {}; // Track last violation time by type
    this.violationDebounceTime = 2000; // 2 seconds debounce
  }

  initialize(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this.setupEventListeners();
    return true;
  }

  setupEventListeners() {
    // Fullscreen change detection with debouncing
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
      
      if (this.isFullscreen && !isCurrentlyFullscreen) {
        // Only log if enough time has passed since last violation
        const now = Date.now();
        const lastTime = this.lastViolationTime['fullscreen_exit'] || 0;
        
        if (now - lastTime > this.violationDebounceTime) {
          this.lastViolationTime['fullscreen_exit'] = now;
          this.logViolation('fullscreen_exit', {
            message: 'Exited fullscreen mode during exam',
            severity: 'critical',
            timestamp: now
          });
        }
      }
      
      this.isFullscreen = isCurrentlyFullscreen;
    };

    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
    document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
    document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);

    // Window focus/blur detection
    const focusHandler = () => {
      if (this.isMonitoring) {
        this.logViolation('window_focus_lost', {
          message: 'Window lost focus during exam',
          severity: 'warning',
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('blur', focusHandler);
    this.focusListeners.push({ event: 'blur', handler: focusHandler });

    // Visibility change detection (tab switching)
    const visibilityChangeHandler = () => {
      if (document.hidden && this.isMonitoring) {
        this.logViolation('tab_switch', {
          message: 'Switched to another tab during exam',
          severity: 'critical',
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);

    // Right-click context menu prevention
    const contextMenuHandler = (e) => {
      if (this.isMonitoring) {
        e.preventDefault();
        this.logViolation('context_menu_attempt', {
          message: 'Attempted to open context menu',
          severity: 'warning',
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('contextmenu', contextMenuHandler);
    this.mouseListeners.push({ event: 'contextmenu', handler: contextMenuHandler });

    // Key combination detection
    const keyHandler = (e) => {
      if (!this.isMonitoring) return;

      const forbiddenKeys = [
        // Developer tools
        { key: 'F12' },
        { key: 'I', ctrl: true, shift: true }, // Chrome DevTools
        { key: 'J', ctrl: true, shift: true }, // Chrome Console
        { key: 'C', ctrl: true, shift: true }, // Chrome DevTools
        { key: 'U', ctrl: true }, // View Source
        
        // Navigation
        { key: 'R', ctrl: true }, // Refresh
        { key: 'F5' }, // Refresh
        { key: 'T', ctrl: true }, // New Tab
        { key: 'N', ctrl: true }, // New Window
        { key: 'W', ctrl: true }, // Close Tab
        
        // System
        { key: 'Tab', alt: true }, // Alt+Tab
        { key: 'Escape' }, // Escape
        { key: 'F11' }, // Fullscreen toggle
        
        // Copy/Paste
        { key: 'C', ctrl: true }, // Copy
        { key: 'V', ctrl: true }, // Paste
        { key: 'X', ctrl: true }, // Cut
        { key: 'A', ctrl: true }, // Select All
        
        // Print
        { key: 'P', ctrl: true }, // Print
      ];

      const currentKey = {
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey
      };

      const isForbidden = forbiddenKeys.some(forbidden => {
        return forbidden.key === currentKey.key &&
               (forbidden.ctrl === undefined || forbidden.ctrl === currentKey.ctrl) &&
               (forbidden.shift === undefined || forbidden.shift === currentKey.shift) &&
               (forbidden.alt === undefined || forbidden.alt === currentKey.alt);
      });

      if (isForbidden) {
        e.preventDefault();
        this.logViolation('forbidden_key_combination', {
          message: `Attempted to use forbidden key combination: ${this.getKeyDescription(currentKey)}`,
          severity: 'critical',
          keyDetails: currentKey,
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('keydown', keyHandler);
    this.keyListeners.push({ event: 'keydown', handler: keyHandler });
  }

  getKeyDescription(keyInfo) {
    let description = '';
    if (keyInfo.ctrl) description += 'Ctrl+';
    if (keyInfo.shift) description += 'Shift+';
    if (keyInfo.alt) description += 'Alt+';
    description += keyInfo.key;
    return description;
  }

  async requestFullscreen(element = document.documentElement) {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      this.isFullscreen = true;
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      this.logViolation('fullscreen_request_failed', {
        message: 'Failed to enter fullscreen mode',
        severity: 'critical',
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }

  exitFullscreen() {
    try {
      // Check if document is currently in fullscreen mode
      const isCurrentlyFullscreen = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
      
      if (!isCurrentlyFullscreen) {
        this.isFullscreen = false;
        return; // Already not in fullscreen, no need to exit
      }
      
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      
      this.isFullscreen = false;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      // Still update the internal state even if exit fails
      this.isFullscreen = false;
    }
  }

  startMonitoring() {
    this.isMonitoring = true;
    
    // Monitor mouse movements for suspicious activity
    const mouseMonitorInterval = setInterval(() => {
      this.checkMouseActivity();
    }, 5000);
    
    this.monitoringIntervals.push(mouseMonitorInterval);
    
    // Monitor system resources (basic check)
    const resourceMonitorInterval = setInterval(() => {
      this.checkSystemResources();
    }, 10000);
    
    this.monitoringIntervals.push(resourceMonitorInterval);
    
    console.log('Security monitoring started');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    // Clear all monitoring intervals
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals = [];
    
    console.log('Security monitoring stopped');
  }

  checkMouseActivity() {
    // Enhanced mouse activity monitoring
    const now = Date.now();
    
    // Track mouse position and movement patterns
    if (!this.mouseTracker) {
      this.mouseTracker = {
        positions: [],
        lastPosition: { x: 0, y: 0 },
        rapidMovements: 0,
        suspiciousPatterns: 0
      };
      
      // Add mouse move listener for tracking
      const mouseMoveHandler = (e) => {
        if (!this.isMonitoring) return;
        
        const currentPos = { x: e.clientX, y: e.clientY, timestamp: now };
        this.mouseTracker.positions.push(currentPos);
        
        // Keep only last 50 positions
        if (this.mouseTracker.positions.length > 50) {
          this.mouseTracker.positions.shift();
        }
        
        // Check for rapid movements (possible automation)
        const distance = Math.sqrt(
          Math.pow(currentPos.x - this.mouseTracker.lastPosition.x, 2) +
          Math.pow(currentPos.y - this.mouseTracker.lastPosition.y, 2)
        );
        
        if (distance > 200 && now - this.mouseTracker.lastPosition.timestamp < 100) {
          this.mouseTracker.rapidMovements++;
          
          if (this.mouseTracker.rapidMovements > 5) {
            this.logViolation('suspicious_mouse_activity', {
              message: 'Detected potentially automated mouse movements',
              severity: 'warning',
              details: { rapidMovements: this.mouseTracker.rapidMovements },
              timestamp: now
            });
            this.mouseTracker.rapidMovements = 0; // Reset counter
          }
        }
        
        this.mouseTracker.lastPosition = { ...currentPos, timestamp: now };
      };
      
      document.addEventListener('mousemove', mouseMoveHandler);
      this.mouseListeners.push({ event: 'mousemove', handler: mouseMoveHandler });
    }
    
    // Check for suspicious patterns (e.g., perfect geometric movements)
    if (this.mouseTracker.positions.length >= 10) {
      const recentPositions = this.mouseTracker.positions.slice(-10);
      const isLinearPattern = this.detectLinearMousePattern(recentPositions);
      
      if (isLinearPattern) {
        this.mouseTracker.suspiciousPatterns++;
        
        if (this.mouseTracker.suspiciousPatterns > 3) {
          this.logViolation('automated_mouse_pattern', {
            message: 'Detected potentially automated mouse movement patterns',
            severity: 'critical',
            timestamp: now
          });
          this.mouseTracker.suspiciousPatterns = 0;
        }
      }
    }
  }

  checkSystemResources() {
    const now = Date.now();
    
    // Enhanced system resource monitoring
    if ('memory' in performance) {
      const memInfo = performance.memory;
      if (memInfo.usedJSHeapSize > memInfo.totalJSHeapSize * 0.9) {
        this.logViolation('high_memory_usage', {
          message: 'Unusually high memory usage detected',
          severity: 'warning',
          memoryInfo: {
            used: memInfo.usedJSHeapSize,
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit
          },
          timestamp: now
        });
      }
    }
    
    // Monitor network activity (basic detection)
    this.monitorNetworkActivity();
    
    // Monitor clipboard activity
    this.monitorClipboardActivity();
    
    // Check for multiple browser instances or tabs
    this.checkBrowserInstances();
    
    // Monitor for external applications
    this.detectExternalApplications();
  }

  logViolation(type, details) {
    const now = Date.now();
    const lastTime = this.lastViolationTime[type] || 0;
    
    // Apply debouncing for all violation types
    if (now - lastTime < this.violationDebounceTime) {
      return; // Skip logging if within debounce period
    }
    
    this.lastViolationTime[type] = now;
    
    const violation = {
      id: `violation_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      ...details,
      timestamp: details.timestamp || now
    };

    this.violations.push(violation);
    
    // Trigger callback
    if (this.callbacks.onViolation) {
      this.callbacks.onViolation(violation);
    }

    // Check if auto-submit threshold is reached
    const criticalViolations = this.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length >= this.violationThresholds.maxViolations) {
      this.triggerAutoSubmit();
    }

    console.warn('Security violation logged:', violation);
  }

  triggerAutoSubmit() {
    if (this.callbacks.onWarning) {
      this.callbacks.onWarning({
        message: `Too many security violations detected. Exam will be automatically submitted in ${this.violationThresholds.autoSubmitDelay / 1000} seconds.`,
        type: 'auto_submit_warning',
        countdown: this.violationThresholds.autoSubmitDelay
      });
    }

    setTimeout(() => {
      if (this.callbacks.onAutoSubmit) {
        this.callbacks.onAutoSubmit({
          reason: 'security_violations',
          violationCount: this.violations.length,
          violations: this.violations
        });
      }
    }, this.violationThresholds.autoSubmitDelay);
  }

  getViolations() {
    return [...this.violations];
  }

  getViolationSummary() {
    const summary = {
      total: this.violations.length,
      critical: this.violations.filter(v => v.severity === 'critical').length,
      warning: this.violations.filter(v => v.severity === 'warning').length,
      types: {}
    };

    this.violations.forEach(violation => {
      summary.types[violation.type] = (summary.types[violation.type] || 0) + 1;
    });

    return summary;
  }

  // Advanced monitoring helper methods
  detectLinearMousePattern(positions) {
    if (positions.length < 5) return false;
    
    // Check if mouse movements follow a perfectly straight line
    const firstPos = positions[0];
    const lastPos = positions[positions.length - 1];
    
    const expectedSlope = (lastPos.y - firstPos.y) / (lastPos.x - firstPos.x);
    let linearCount = 0;
    
    for (let i = 1; i < positions.length - 1; i++) {
      const pos = positions[i];
      const actualSlope = (pos.y - firstPos.y) / (pos.x - firstPos.x);
      
      if (Math.abs(actualSlope - expectedSlope) < 0.1) {
        linearCount++;
      }
    }
    
    return linearCount / (positions.length - 2) > 0.8; // 80% of points are linear
  }
  
  monitorNetworkActivity() {
    // Monitor for unusual network requests that might indicate cheating tools
    if (!this.networkMonitor) {
      this.networkMonitor = {
        requestCount: 0,
        suspiciousRequests: 0,
        lastCheck: Date.now()
      };
      
      // Override fetch to monitor requests
      const originalFetch = window.fetch;
      window.fetch = (...args) => {
        if (this.isMonitoring) {
          this.networkMonitor.requestCount++;
          
          // Check for suspicious external requests
          const url = args[0];
          if (typeof url === 'string' && this.isSuspiciousUrl(url)) {
            this.networkMonitor.suspiciousRequests++;
            this.logViolation('suspicious_network_request', {
              message: 'Detected potentially suspicious network request',
              severity: 'critical',
              url: url,
              timestamp: Date.now()
            });
          }
        }
        return originalFetch.apply(this, args);
      };
    }
  }
  
  isSuspiciousUrl(url) {
    const suspiciousPatterns = [
      /chatgpt/i,
      /openai/i,
      /claude/i,
      /gemini/i,
      /stackoverflow/i,
      /github/i,
      /chegg/i,
      /coursehero/i,
      /quizlet/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
  
  monitorClipboardActivity() {
    if (!this.clipboardMonitor) {
      this.clipboardMonitor = {
        lastClipboardCheck: '',
        clipboardChanges: 0
      };
      
      // Monitor clipboard changes (when possible)
      const checkClipboard = async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText !== this.clipboardMonitor.lastClipboardCheck) {
              this.clipboardMonitor.clipboardChanges++;
              this.clipboardMonitor.lastClipboardCheck = clipboardText;
              
              // Log excessive clipboard activity
              if (this.clipboardMonitor.clipboardChanges > 10) {
                this.logViolation('excessive_clipboard_activity', {
                  message: 'Detected excessive clipboard activity',
                  severity: 'warning',
                  changes: this.clipboardMonitor.clipboardChanges,
                  timestamp: Date.now()
                });
                this.clipboardMonitor.clipboardChanges = 0;
              }
            }
          }
        } catch (error) {
          // Clipboard access denied or not supported
        }
      };
      
      setInterval(checkClipboard, 5000);
    }
  }
  
  checkBrowserInstances() {
    // Use localStorage to detect multiple browser instances
    if (!this.instanceMonitor) {
      this.instanceMonitor = {
        instanceId: `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastHeartbeat: Date.now()
      };
      
      // Set up instance tracking with proper context binding
      const self = this; // Store reference to maintain context
      const updateHeartbeat = () => {
        // Check if instanceMonitor still exists
        if (!self.instanceMonitor) {
          console.warn('Instance monitor not available, skipping heartbeat update');
          return;
        }
        
        const instances = JSON.parse(localStorage.getItem('exam_instances') || '[]');
        const now = Date.now();
        
        // Remove old instances (older than 30 seconds)
        const activeInstances = instances.filter(instance => now - instance.lastHeartbeat < 30000);
        
        // Add or update current instance
        const currentInstanceIndex = activeInstances.findIndex(instance => instance.id === self.instanceMonitor.instanceId);
        if (currentInstanceIndex >= 0) {
          activeInstances[currentInstanceIndex].lastHeartbeat = now;
        } else {
          activeInstances.push({
            id: self.instanceMonitor.instanceId,
            lastHeartbeat: now
          });
        }
        
        localStorage.setItem('exam_instances', JSON.stringify(activeInstances));
        
        // Check for multiple instances
        if (activeInstances.length > 1) {
          self.logViolation('multiple_browser_instances', {
            message: 'Multiple browser instances detected',
            severity: 'critical',
            instanceCount: activeInstances.length,
            timestamp: now
          });
        }
      };
      
      // Update heartbeat every 5 seconds
      setInterval(updateHeartbeat, 5000);
      updateHeartbeat(); // Initial call
    }
  }
  
  detectExternalApplications() {
    // Monitor for signs of external applications
    if (!this.appMonitor) {
      this.appMonitor = {
        focusLossCount: 0,
        lastFocusLoss: 0
      };
      
      // Enhanced focus monitoring
      const focusLossHandler = () => {
        const now = Date.now();
        this.appMonitor.focusLossCount++;
        
        // If focus is lost frequently, it might indicate external apps
        if (now - this.appMonitor.lastFocusLoss < 5000) {
          this.logViolation('frequent_focus_loss', {
            message: 'Frequent focus loss detected - possible external application usage',
            severity: 'warning',
            focusLossCount: this.appMonitor.focusLossCount,
            timestamp: now
          });
        }
        
        this.appMonitor.lastFocusLoss = now;
      };
      
      window.addEventListener('blur', focusLossHandler);
      this.focusListeners.push({ event: 'blur', handler: focusLossHandler });
    }
  }
  
  cleanup() {
    this.stopMonitoring();
    this.exitFullscreen();
    
    // Clean up instance tracking
    if (this.instanceMonitor) {
      const instances = JSON.parse(localStorage.getItem('exam_instances') || '[]');
      const filteredInstances = instances.filter(instance => instance.id !== this.instanceMonitor.instanceId);
      localStorage.setItem('exam_instances', JSON.stringify(filteredInstances));
    }
    
    // Remove all event listeners
    this.keyListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    
    this.mouseListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    
    this.focusListeners.forEach(({ event, handler }) => {
      window.removeEventListener(event, handler);
    });
    
    this.keyListeners = [];
    this.mouseListeners = [];
    this.focusListeners = [];
    this.violations = [];
    
    // Reset monitoring objects
    this.mouseTracker = null;
    this.networkMonitor = null;
    this.clipboardMonitor = null;
    this.instanceMonitor = null;
    this.appMonitor = null;
  }
}

const securityService = new SecurityService();
export default securityService;