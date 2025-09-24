import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import fullscreenSecurity from '../utils/fullscreenSecurity';

// Exam Context
const ExamContext = createContext();

// Action types
const EXAM_ACTIONS = {
  START_EXAM: 'START_EXAM',
  END_EXAM: 'END_EXAM',
  SET_FULLSCREEN_STATUS: 'SET_FULLSCREEN_STATUS',
  ADD_VIOLATION: 'ADD_VIOLATION',
  SHOW_WARNING: 'SHOW_WARNING',
  HIDE_WARNING: 'HIDE_WARNING',
  FORCE_EXIT: 'FORCE_EXIT',
  SET_EXAM_CONFIG: 'SET_EXAM_CONFIG',
  UPDATE_EXAM_TIME: 'UPDATE_EXAM_TIME'
};

// Initial state
const initialState = {
  isExamActive: false,
  isFullscreen: false,
  examConfig: {
    id: null,
    title: '',
    duration: 0,
    startTime: null,
    endTime: null,
    allowedViolations: 3,
    strictMode: true
  },
  violations: [],
  totalViolations: 0,
  warning: {
    show: false,
    type: '',
    message: '',
    timestamp: null
  },
  examStatus: 'idle', // idle, starting, active, paused, ended, terminated
  timeRemaining: 0,
  lastActivity: Date.now()
};

// Reducer
function examReducer(state, action) {
  switch (action.type) {
    case EXAM_ACTIONS.START_EXAM:
      return {
        ...state,
        isExamActive: true,
        examStatus: 'active',
        examConfig: { ...state.examConfig, ...action.payload },
        violations: [],
        totalViolations: 0,
        timeRemaining: action.payload.duration * 60, // Convert minutes to seconds
        lastActivity: Date.now()
      };

    case EXAM_ACTIONS.END_EXAM:
      return {
        ...state,
        isExamActive: false,
        examStatus: action.payload?.reason === 'terminated' ? 'terminated' : 'ended',
        isFullscreen: false
      };

    case EXAM_ACTIONS.SET_FULLSCREEN_STATUS:
      return {
        ...state,
        isFullscreen: action.payload
      };

    case EXAM_ACTIONS.ADD_VIOLATION:
      const newViolation = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };
      return {
        ...state,
        violations: [...state.violations, newViolation],
        totalViolations: state.totalViolations + 1,
        lastActivity: Date.now()
      };

    case EXAM_ACTIONS.SHOW_WARNING:
      return {
        ...state,
        warning: {
          show: true,
          type: action.payload.type,
          message: action.payload.message,
          timestamp: Date.now(),
          violationCount: action.payload.violationCount
        }
      };

    case EXAM_ACTIONS.HIDE_WARNING:
      return {
        ...state,
        warning: {
          ...state.warning,
          show: false
        }
      };

    case EXAM_ACTIONS.FORCE_EXIT:
      return {
        ...state,
        isExamActive: false,
        examStatus: 'terminated',
        isFullscreen: false,
        warning: {
          show: true,
          type: 'force_exit',
          message: action.payload.message,
          timestamp: Date.now()
        }
      };

    case EXAM_ACTIONS.SET_EXAM_CONFIG:
      return {
        ...state,
        examConfig: { ...state.examConfig, ...action.payload }
      };

    case EXAM_ACTIONS.UPDATE_EXAM_TIME:
      return {
        ...state,
        timeRemaining: Math.max(0, action.payload),
        lastActivity: Date.now()
      };

    default:
      return state;
  }
}

// Exam Provider Component
export function ExamProvider({ children }) {
  const [state, dispatch] = useReducer(examReducer, initialState);

  // Handle fullscreen security warnings
  const handleWarning = useCallback((warningData) => {
    dispatch({
      type: EXAM_ACTIONS.SHOW_WARNING,
      payload: warningData
    });

    // Auto-hide warning after 5 seconds
    setTimeout(() => {
      dispatch({ type: EXAM_ACTIONS.HIDE_WARNING });
    }, 5000);
  }, []);

  // Handle security violations
  const handleViolation = useCallback((violation) => {
    dispatch({
      type: EXAM_ACTIONS.ADD_VIOLATION,
      payload: violation
    });

    // Send violation to server for logging
    if (state.examConfig.id) {
      reportViolationToServer(state.examConfig.id, violation);
    }
  }, [state.examConfig.id]);

  // Handle force exit due to too many violations
  const handleForceExit = useCallback((exitData) => {
    dispatch({
      type: EXAM_ACTIONS.FORCE_EXIT,
      payload: exitData
    });

    // Report termination to server
    if (state.examConfig.id) {
      reportExamTermination(state.examConfig.id, exitData);
    }
  }, [state.examConfig.id]);

  // Start exam with fullscreen enforcement
  const startExam = useCallback(async (examConfig) => {
    try {
      // Update exam configuration
      dispatch({
        type: EXAM_ACTIONS.SET_EXAM_CONFIG,
        payload: {
          ...examConfig,
          startTime: new Date().toISOString()
        }
      });

      // Configure fullscreen security
      fullscreenSecurity.setMaxViolations(examConfig.allowedViolations || 3);

      // Enable exam mode with callbacks
      await fullscreenSecurity.enableExamMode(examConfig.examId || 'default-exam', {
        onWarning: handleWarning,
        onViolation: handleViolation,
        onForceExit: handleForceExit
      });

      // Start the exam
      dispatch({
        type: EXAM_ACTIONS.START_EXAM,
        payload: examConfig
      });

      // Update fullscreen status
      dispatch({
        type: EXAM_ACTIONS.SET_FULLSCREEN_STATUS,
        payload: fullscreenSecurity.isFullscreen()
      });

      console.log('Exam started with fullscreen security enabled');
      return { success: true };
    } catch (error) {
      console.error('Failed to start exam:', error);
      return { success: false, error: error.message };
    }
  }, [handleWarning, handleViolation, handleForceExit]);

  // End exam and disable fullscreen enforcement
  const endExam = useCallback(async (reason = 'completed') => {
    try {
      // Disable fullscreen security
      await fullscreenSecurity.disableExamMode();

      // End the exam
      dispatch({
        type: EXAM_ACTIONS.END_EXAM,
        payload: { reason }
      });

      // Report exam completion to server
      if (state.examConfig.id) {
        await reportExamCompletion(state.examConfig.id, {
          reason,
          violations: state.violations,
          totalViolations: state.totalViolations,
          endTime: new Date().toISOString()
        });
      }

      console.log('Exam ended:', reason);
      return { success: true };
    } catch (error) {
      console.error('Failed to end exam:', error);
      return { success: false, error: error.message };
    }
  }, [state.examConfig.id, state.violations, state.totalViolations]);

  // Pause exam (if allowed)
  const pauseExam = useCallback(() => {
    if (state.examConfig.strictMode) {
      handleWarning({
        type: 'pause_not_allowed',
        message: 'Pausing is not allowed in strict mode!',
        violationCount: state.totalViolations
      });
      return { success: false, error: 'Pause not allowed in strict mode' };
    }

    // Implementation for pause functionality
    console.log('Exam paused');
    return { success: true };
  }, [state.examConfig.strictMode, state.totalViolations, handleWarning]);

  // Get exam statistics
  const getExamStats = useCallback(() => {
    return {
      duration: state.examConfig.duration,
      timeRemaining: state.timeRemaining,
      timeElapsed: (state.examConfig.duration * 60) - state.timeRemaining,
      violations: state.violations,
      totalViolations: state.totalViolations,
      isFullscreen: state.isFullscreen,
      examStatus: state.examStatus
    };
  }, [state]);

  // Timer effect for exam countdown
  useEffect(() => {
    let timer;
    
    if (state.isExamActive && state.examStatus === 'active') {
      timer = setInterval(() => {
        dispatch({
          type: EXAM_ACTIONS.UPDATE_EXAM_TIME,
          payload: state.timeRemaining - 1
        });

        // Auto-end exam when time runs out
        if (state.timeRemaining <= 1) {
          endExam('time_expired');
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.isExamActive, state.examStatus, state.timeRemaining, endExam]);

  // Monitor fullscreen status
  useEffect(() => {
    let statusChecker;
    
    if (state.isExamActive) {
      statusChecker = setInterval(() => {
        const isCurrentlyFullscreen = fullscreenSecurity.isFullscreen();
        if (isCurrentlyFullscreen !== state.isFullscreen) {
          dispatch({
            type: EXAM_ACTIONS.SET_FULLSCREEN_STATUS,
            payload: isCurrentlyFullscreen
          });
        }
      }, 500);
    }

    return () => {
      if (statusChecker) clearInterval(statusChecker);
    };
  }, [state.isExamActive, state.isFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isExamActive) {
        fullscreenSecurity.disableExamMode();
      }
    };
  }, []);

  const contextValue = {
    // State
    ...state,
    
    // Actions
    startExam,
    endExam,
    pauseExam,
    getExamStats,
    
    // Utilities
    hideWarning: () => dispatch({ type: EXAM_ACTIONS.HIDE_WARNING }),
    resetViolations: () => fullscreenSecurity.resetViolations(),
    getSecurityStatus: () => fullscreenSecurity.getStatus()
  };

  return (
    <ExamContext.Provider value={contextValue}>
      {children}
    </ExamContext.Provider>
  );
}

// Custom hook to use exam context
export function useExam() {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}

// Helper functions for server communication
async function reportViolationToServer(examId, violation) {
  try {
    await fetch('/api/exams/violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId,
        violation,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to report violation:', error);
  }
}

async function reportExamTermination(examId, terminationData) {
  try {
    await fetch('/api/exams/terminate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId,
        ...terminationData,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to report termination:', error);
  }
}

async function reportExamCompletion(examId, completionData) {
  try {
    await fetch('/api/exams/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId,
        ...completionData,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to report completion:', error);
  }
}

export default ExamContext;