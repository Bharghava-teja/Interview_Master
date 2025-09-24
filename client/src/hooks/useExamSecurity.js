import { useEffect, useRef, useState, useCallback } from 'react';

export const useExamSecurity = ({ 
  onFirstWarning, 
  onSecondInfraction, 
  onViolationLog,
  examId 
}) => {
  const infractionCountRef = useRef(0);
  const [warningVisible, setWarningVisible] = useState(false);
  const [violationHistory, setViolationHistory] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastViolationTimeRef = useRef({});
  const violationDebounceTime = 2000; // 2 seconds debounce

  // Log violation to backend and local state with debouncing
  const logViolation = useCallback((type, details = {}) => {
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[type] || 0;
    
    // Apply debouncing for violation logging
    if (now - lastTime < violationDebounceTime) {
      return; // Skip logging if within debounce period
    }
    
    lastViolationTimeRef.current[type] = now;
    
    const violation = {
      type,
      timestamp: new Date().toISOString(),
      examId,
      details,
      severity: infractionCountRef.current >= 2 ? 'critical' : 'warning'
    };

    setViolationHistory(prev => [...prev, violation]);

    // Log to backend if callback provided
    if (onViolationLog) {
      onViolationLog(violation);
    }

    // Log to console for debugging (less frequently)
    console.warn('Security violation detected:', violation);
  }, [onViolationLog, examId, violationDebounceTime]);

  // Handle violation with escalation
  const handleViolation = useCallback((type, details = {}) => {
    infractionCountRef.current += 1;
    
    logViolation(type, details);

    if (infractionCountRef.current === 1) {
      setWarningVisible(true);
      if (onFirstWarning) onFirstWarning(type, details);
    } else if (infractionCountRef.current >= 2) {
      if (onSecondInfraction) onSecondInfraction(type, details);
    }
  }, [logViolation, onFirstWarning, onSecondInfraction]);

  // Check fullscreen status
  const checkFullscreen = useCallback(() => {
    const fullscreenElement = document.fullscreenElement || 
                             document.webkitFullscreenElement || 
                             document.mozFullScreenElement || 
                             document.msFullscreenElement;
    setIsFullscreen(!!fullscreenElement);
    return !!fullscreenElement;
  }, []);

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    try {
      if (!checkFullscreen()) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      handleViolation('fullscreen_blocked', { error: error.message });
    }
  }, [checkFullscreen, handleViolation]);

  // Exit fullscreen (for admin purposes)
  const exitFullscreen = useCallback(async () => {
    try {
      if (checkFullscreen()) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, [checkFullscreen]);

  useEffect(() => {
    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isInFullscreen = checkFullscreen();
      if (!isInFullscreen && isFullscreen) {
        handleViolation('exited_fullscreen', { 
          previousState: 'fullscreen',
          currentState: 'normal'
        });
      }
      setIsFullscreen(isInFullscreen);
    };

    // Keyboard shortcuts detection
    const handleKeyDown = (e) => {
      // Prevent common shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        const blockedKeys = ['c', 'v', 'x', 'a', 'z', 'y', 'f', 's', 'p'];
        
        if (blockedKeys.includes(key)) {
          e.preventDefault();
          handleViolation('keyboard_shortcut', { 
            key: `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${key.toUpperCase()}`,
            action: 'prevented'
          });
        }
      }

      // Prevent F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
        handleViolation('function_key', { key: 'F11', action: 'prevented' });
      }

      // Prevent Escape key (could exit fullscreen)
      if (e.key === 'Escape' && checkFullscreen()) {
        e.preventDefault();
        handleViolation('escape_key', { action: 'prevented_in_fullscreen' });
      }
    };

    // Window focus/blur detection
    const handleWindowBlur = () => {
      handleViolation('window_blur', { 
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('tab_hidden', { 
          timestamp: Date.now(),
          visibilityState: document.visibilityState
        });
      }
    };

    // Right-click prevention
    const handleContextMenu = (e) => {
      e.preventDefault();
      handleViolation('right_click', { 
        target: e.target.tagName,
        coordinates: { x: e.clientX, y: e.clientY }
      });
    };

    // Text selection prevention
    const handleSelectStart = (e) => {
      e.preventDefault();
      handleViolation('text_selection', { 
        target: e.target.tagName,
        selection: window.getSelection().toString()
      });
    };

    // Drag and drop prevention
    const handleDragStart = (e) => {
      e.preventDefault();
      handleViolation('drag_drop', { 
        target: e.target.tagName,
        dataType: e.dataTransfer.types
      });
    };

    // Copy/paste prevention (additional layer)
    const handleCopy = (e) => {
      e.preventDefault();
      handleViolation('copy_attempt', { 
        target: e.target.tagName,
        method: 'context_menu'
      });
    };

    const handlePaste = (e) => {
      e.preventDefault();
      handleViolation('paste_attempt', { 
        target: e.target.tagName,
        method: 'context_menu'
      });
    };

    // DevTools detection (basic)
    const handleDevTools = () => {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        handleViolation('devtools_opened', { 
          method: 'window_size_detection',
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          innerWidth: window.innerWidth
        });
      }
    };

    // Periodic fullscreen check
    const fullscreenCheckInterval = setInterval(() => {
      if (!checkFullscreen()) {
        handleViolation('fullscreen_lost', { 
          method: 'periodic_check',
          timestamp: Date.now()
        });
      }
    }, 1000);

    // Event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, true);
    
    // DevTools detection
    window.addEventListener('resize', handleDevTools);
    
    // Initial fullscreen check
    checkFullscreen();

    return () => {
      clearInterval(fullscreenCheckInterval);
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);
      
      window.removeEventListener('resize', handleDevTools);
    };
  }, [checkFullscreen, handleViolation, isFullscreen]);

  return {
    warningVisible,
    hideWarning: () => setWarningVisible(false),
    showWarning: () => setWarningVisible(true),
    getViolationCount: () => infractionCountRef.current,
    getViolationHistory: () => violationHistory,
    isFullscreen,
    requestFullscreen,
    exitFullscreen,
    checkFullscreen,
    logViolation
  };
};

