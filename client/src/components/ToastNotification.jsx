/**
 * Toast Notification System
 * Provides customizable toast notifications with animations and auto-dismiss
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, INTERACTIONS, PRESETS } from '../utils/animationUtils';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      dismissible: true,
      ...toast
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  return {
    ...context,
    success: (message, options = {}) => addToast({ ...options, type: 'success', message }),
    error: (message, options = {}) => addToast({ ...options, type: 'error', message }),
    warning: (message, options = {}) => addToast({ ...options, type: 'warning', message }),
    info: (message, options = {}) => addToast({ ...options, type: 'info', message }),
    loading: (message, options = {}) => addToast({ ...options, type: 'loading', message, duration: 0 })
  };
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const { shouldAnimate, getOptimizedVariants } = useOptimizedAnimation();
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(100);

  // Progress bar animation
  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, toast.duration - elapsed);
      const progressPercent = (remaining / toast.duration) * 100;
      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const handleRemove = () => {
    if (isRemoving) return;
    setIsRemoving(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const getToastStyles = () => {
    const baseStyles = 'relative overflow-hidden rounded-lg shadow-lg border-l-4 p-4 max-w-md w-full';
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'loading':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'loading':
        return (
          <motion.svg 
            className="w-5 h-5 text-blue-500" 
            fill="none" 
            viewBox="0 0 24 24"
            animate={shouldAnimate ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </motion.svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const slideVariants = {
    initial: { x: 400, opacity: 0, scale: 0.95 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: 400, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className={getToastStyles()}
      variants={shouldAnimate ? slideVariants : {}}
      initial={shouldAnimate ? 'initial' : false}
      animate={shouldAnimate ? 'animate' : false}
      exit={shouldAnimate ? 'exit' : false}
      layout={shouldAnimate}
      {...(shouldAnimate ? INTERACTIONS.card : {})}
    >
      {/* Progress Bar */}
      {toast.duration > 0 && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold mb-1">{toast.title}</h4>
          )}
          <p className="text-sm leading-relaxed">{toast.message}</p>
          
          {/* Action Button */}
          {toast.action && (
            <motion.button
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
              onClick={toast.action.onClick}
              {...(shouldAnimate ? INTERACTIONS.button : {})}
            >
              {toast.action.label}
            </motion.button>
          )}
        </div>

        {/* Close Button */}
        {toast.dismissible && (
          <motion.button
            className="flex-shrink-0 text-current opacity-60 hover:opacity-100 focus:outline-none focus:opacity-100 transition-opacity"
            onClick={handleRemove}
            {...(shouldAnimate ? INTERACTIONS.button : {})}
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Toast Container Component
const ToastContainer = ({ position = 'top-right' }) => {
  const { toasts, removeToast } = useToast();
  const { shouldAnimate } = useOptimizedAnimation();

  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 p-4 space-y-3 pointer-events-none';
    
    switch (position) {
      case 'top-left':
        return `${baseStyles} top-0 left-0`;
      case 'top-center':
        return `${baseStyles} top-0 left-1/2 transform -translate-x-1/2`;
      case 'top-right':
        return `${baseStyles} top-0 right-0`;
      case 'bottom-left':
        return `${baseStyles} bottom-0 left-0`;
      case 'bottom-center':
        return `${baseStyles} bottom-0 left-1/2 transform -translate-x-1/2`;
      case 'bottom-right':
        return `${baseStyles} bottom-0 right-0`;
      default:
        return `${baseStyles} top-0 right-0`;
    }
  };

  return (
    <div className={getPositionStyles()}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Custom hook for toast methods
export const useToastMethods = () => {
  const { addToast, removeToast } = useToast();

  return {
    success: (message, options) => addToast({ type: 'success', message, ...options }),
    error: (message, options) => addToast({ type: 'error', message, ...options }),
    warning: (message, options) => addToast({ type: 'warning', message, ...options }),
    info: (message, options) => addToast({ type: 'info', message, ...options }),
    loading: (message, options) => addToast({ type: 'loading', message, duration: 0, ...options }),
    promise: async (promise, messages) => {
      const loadingId = addToast({
        type: 'loading',
        message: messages.loading || 'Loading...',
        duration: 0
      });

      try {
        const result = await promise;
        removeToast(loadingId);
        addToast({
          type: 'success',
          message: messages.success || 'Success!'
        });
        return result;
      } catch (error) {
        removeToast(loadingId);
        addToast({
          type: 'error',
          message: messages.error || 'Something went wrong'
        });
        throw error;
      }
    }
  };
};

// Legacy function for backward compatibility
export const createToastMethods = () => {
  console.warn('createToastMethods is deprecated. Use useToastMethods hook instead.');
  return {
    success: (message, options) => console.log('Toast:', message),
    error: (message, options) => console.error('Toast:', message),
    warning: (message, options) => console.warn('Toast:', message),
    info: (message, options) => console.info('Toast:', message),
    loading: (message, options) => console.log('Loading Toast:', message),
    promise: async (promise, messages) => {
      try {
        const result = await promise;
        console.log('Promise success:', messages.success || 'Success!');
        return result;
      } catch (error) {
        console.error('Promise error:', messages.error || 'Something went wrong');
        throw error;
      }
    }
  };
};

// Simple ToastNotification component for backward compatibility
export const ToastNotification = ({ message, type = 'info', onClose }) => {
  const getToastStyles = () => {
    const baseStyles = 'fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 p-4';
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} border-yellow-500 text-yellow-800`;
      default:
        return `${baseStyles} border-blue-500 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {onClose && (
          <button
            className="flex-shrink-0 text-current opacity-60 hover:opacity-100 focus:outline-none focus:opacity-100 transition-opacity"
            onClick={onClose}
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default {
  ToastProvider,
  useToast,
  createToastMethods,
  ToastNotification
};