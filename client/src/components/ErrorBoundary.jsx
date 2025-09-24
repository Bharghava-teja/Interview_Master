/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling with fallback UI and error reporting
 */

import React, { Component, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS, INTERACTIONS } from '../utils/animationUtils';

// Error Context for global error handling
const ErrorContext = createContext();

// Error Provider Component
export const ErrorProvider = ({ children, onError }) => {
  const [errors, setErrors] = React.useState([]);

  const addError = React.useCallback((error, errorInfo = {}) => {
    const errorId = Date.now() + Math.random();
    const newError = {
      id: errorId,
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    setErrors(prev => [newError, ...prev.slice(0, 9)]); // Keep last 10 errors
    
    // Call external error handler if provided
    if (onError) {
      onError(newError);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorProvider:', error, errorInfo);
    }

    return errorId;
  }, [onError]);

  const removeError = React.useCallback((errorId) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const value = {
    errors,
    addError,
    removeError,
    clearAllErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Main Error Boundary Class Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now() + Math.random();
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Report error to external service or context
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details
    console.error('Error Boundary caught an error:', {
      error,
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create error report
    const errorReport = {
      errorId,
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      props: this.props.reportProps || {}
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard!');
      })
      .catch(() => {
        console.log('Error Report:', errorReport);
        alert('Error report logged to console');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReport={this.handleReportError}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback UI Component
const ErrorFallbackUI = ({ 
  error, 
  errorInfo, 
  onRetry, 
  onReport, 
  level = 'component' 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isAnimated, setIsAnimated] = React.useState(true);

  // Check for reduced motion preference
  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsAnimated(!prefersReducedMotion);
  }, []);

  const getErrorIcon = () => {
    switch (level) {
      case 'app':
        return (
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'page':
        return (
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getContainerStyles = () => {
    const baseStyles = 'text-center';
    
    switch (level) {
      case 'app':
        return `${baseStyles} min-h-screen flex items-center justify-center bg-gray-50 px-4`;
      case 'page':
        return `${baseStyles} min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg p-8`;
      default:
        return `${baseStyles} p-6 bg-red-50 border border-red-200 rounded-lg`;
    }
  };

  const errorVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className={getContainerStyles()}>
      <motion.div
        className="max-w-md mx-auto"
        variants={isAnimated ? errorVariants : {}}
        initial={isAnimated ? 'initial' : false}
        animate={isAnimated ? 'animate' : false}
        exit={isAnimated ? 'exit' : false}
      >
        {getErrorIcon()}
        
        <h2 className={`font-bold text-gray-900 mb-2 ${
          level === 'app' ? 'text-2xl' : 
          level === 'page' ? 'text-xl' : 'text-lg'
        }`}>
          {level === 'app' ? 'Application Error' :
           level === 'page' ? 'Page Error' : 'Something went wrong'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {level === 'app' 
            ? 'The application encountered an unexpected error. Please try refreshing the page.'
            : level === 'page'
            ? 'This page encountered an error. You can try reloading or go back to the previous page.'
            : 'This component encountered an error. You can try again or report the issue.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <motion.button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            onClick={onRetry}
            whileHover={isAnimated ? { scale: 1.02 } : {}}
            whileTap={isAnimated ? { scale: 0.98 } : {}}
          >
            Try Again
          </motion.button>
          
          {level === 'app' && (
            <motion.button
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              onClick={() => window.location.reload()}
              whileHover={isAnimated ? { scale: 1.02 } : {}}
              whileTap={isAnimated ? { scale: 0.98 } : {}}
            >
              Reload Page
            </motion.button>
          )}
          
          <motion.button
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            onClick={onReport}
            whileHover={isAnimated ? { scale: 1.02 } : {}}
            whileTap={isAnimated ? { scale: 0.98 } : {}}
          >
            Report Error
          </motion.button>
        </div>

        {/* Error Details Toggle */}
        <motion.button
          className="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none"
          onClick={() => setShowDetails(!showDetails)}
          whileHover={isAnimated ? { scale: 1.02 } : {}}
        >
          {showDetails ? 'Hide' : 'Show'} Error Details
        </motion.button>

        {/* Error Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs overflow-auto max-h-40"
              initial={isAnimated ? { opacity: 0, height: 0 } : false}
              animate={isAnimated ? { opacity: 1, height: 'auto' } : false}
              exit={isAnimated ? { opacity: 0, height: 0 } : false}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-2">
                <strong className="text-gray-700">Error:</strong>
                <pre className="mt-1 text-red-600 whitespace-pre-wrap">
                  {error?.message || 'Unknown error'}
                </pre>
              </div>
              
              {error?.stack && (
                <div className="mb-2">
                  <strong className="text-gray-700">Stack Trace:</strong>
                  <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
              
              {errorInfo?.componentStack && (
                <div>
                  <strong className="text-gray-700">Component Stack:</strong>
                  <pre className="mt-1 text-gray-600 whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for handling async errors
export const useAsyncError = () => {
  const { addError } = useError();
  
  return React.useCallback((error) => {
    addError(error, { type: 'async' });
  }, [addError]);
};

// Error boundary for specific error types
export const AsyncErrorBoundary = ({ children, onError }) => {
  return (
    <ErrorBoundary
      level="component"
      onError={onError}
      fallback={(error, retry) => (
        <ErrorFallbackUI
          error={error}
          onRetry={retry}
          onReport={() => console.error('Async Error:', error)}
          level="component"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;