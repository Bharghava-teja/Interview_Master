import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  error,
  success,
  disabled = false,
  label,
  placeholder,
  helperText,
  required = false,
  id,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  
  return (
    <div className="w-full space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium',
            'text-gray-700 dark:text-gray-300',
            disabled && 'opacity-50 cursor-not-allowed',
            hasError && 'text-red-600 dark:text-red-400',
            hasSuccess && 'text-green-600 dark:text-green-400'
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <motion.input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            // Base styles
            'input w-full',
            'transition-all duration-200',
            
            // State styles
            hasError && [
              'border-red-500 focus:border-red-500 focus:ring-red-500',
              'text-red-900 placeholder-red-300',
              'dark:text-red-100 dark:placeholder-red-500'
            ],
            hasSuccess && [
              'border-green-500 focus:border-green-500 focus:ring-green-500',
              'text-green-900 placeholder-green-300',
              'dark:text-green-100 dark:placeholder-green-500'
            ],
            disabled && [
              'opacity-50 cursor-not-allowed',
              'bg-gray-50 dark:bg-gray-800'
            ],
            
            className
          )}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          aria-invalid={hasError}
          aria-describedby={cn(
            helperText && `${inputId}-helper`,
            hasError && `${inputId}-error`,
            hasSuccess && `${inputId}-success`
          )}
          {...props}
        />
        
        {/* Success Icon */}
        {hasSuccess && (
          <motion.div 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <svg 
              className="h-5 w-5 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </motion.div>
        )}
        
        {/* Error Icon */}
        {hasError && (
          <motion.div 
            className="absolute right-3 top-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <svg 
              className="h-5 w-5 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </motion.div>
        )}
      </div>
      
      {/* Helper Text */}
      {helperText && !hasError && !hasSuccess && (
        <p 
          id={`${inputId}-helper`}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
      
      {/* Error Message */}
      {hasError && (
        <motion.p 
          id={`${inputId}-error`}
          className="text-sm text-red-600 dark:text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          {error}
        </motion.p>
      )}
      
      {/* Success Message */}
      {hasSuccess && (
        <motion.p 
          id={`${inputId}-success`}
          className="text-sm text-green-600 dark:text-green-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
        >
          {success}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;