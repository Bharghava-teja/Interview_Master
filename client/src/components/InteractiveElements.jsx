/**
 * Interactive Elements Component Library
 * Provides accessible, animated UI components with consistent styling
 */

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, INTERACTIONS, PRESETS } from '../utils/animationUtils';

// Enhanced Button Component
export const Button = forwardRef(({ 
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  loadingText = 'Loading...',
  className = '',
  ...props 
}, ref) => {
  const { shouldAnimate, getOptimizedVariants } = useOptimizedAnimation();
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      ref={ref}
      className={`
        relative inline-flex items-center justify-center font-medium rounded-lg
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={isDisabled}
      {...(shouldAnimate && !isDisabled ? INTERACTIONS.button : {})}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="flex items-center"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            exit={shouldAnimate ? { opacity: 0 } : false}
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
              animate={shouldAnimate ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {loadingText}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex items-center"
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            exit={shouldAnimate ? { opacity: 0 } : false}
          >
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

Button.displayName = 'Button';

// Enhanced Input Component
export const Input = forwardRef(({ 
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  type = 'text',
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { shouldAnimate } = useOptimizedAnimation();
  const inputId = useRef(`input-${Math.random().toString(36).substr(2, 9)}`);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const inputVariants = {
    initial: { scale: 1 },
    focus: { scale: 1.02 },
    error: { x: [-2, 2, -2, 2, 0] }
  };

  const inputTransition = {
    initial: { type: 'spring', stiffness: 500, damping: 30 },
    focus: { type: 'spring', stiffness: 500, damping: 30 },
    error: { type: 'tween', duration: 0.4, ease: 'easeInOut' }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <motion.label
          htmlFor={inputId.current}
          className={`block text-sm font-medium transition-colors ${
            error ? 'text-red-700' : isFocused ? 'text-blue-700' : 'text-gray-700'
          }`}
          animate={shouldAnimate && isFocused ? { scale: 1.02 } : {}}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`text-gray-400 ${error ? 'text-red-400' : ''}`}>
              {leftIcon}
            </span>
          </div>
        )}
        
        <motion.input
          ref={ref}
          id={inputId.current}
          type={type}
          className={`
            block w-full rounded-lg border transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${sizes[size]}
            ${error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
          variants={shouldAnimate ? inputVariants : {}}
          animate={shouldAnimate ? (
            error ? 'error' : isFocused ? 'focus' : 'initial'
          ) : false}
          transition={shouldAnimate ? (
            error ? inputTransition.error : isFocused ? inputTransition.focus : inputTransition.initial
          ) : {}}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className={`text-gray-400 ${error ? 'text-red-400' : ''}`}>
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {(error || helperText) && (
          <motion.p
            className={`text-sm ${
              error ? 'text-red-600' : 'text-gray-500'
            }`}
            initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : false}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// Enhanced Checkbox Component
export const Checkbox = forwardRef(({ 
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const checkboxId = useRef(`checkbox-${Math.random().toString(36).substr(2, 9)}`);

  const checkVariants = {
    checked: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    unchecked: {
      pathLength: 0,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <motion.div
          className="relative"
          whileHover={shouldAnimate && !disabled ? { scale: 1.05 } : {}}
          whileTap={shouldAnimate && !disabled ? { scale: 0.95 } : {}}
        >
          <input
            ref={ref}
            id={checkboxId.current}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
              focus:ring-blue-500 focus:ring-2 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            {...props}
          />
          
          {shouldAnimate && (
            <motion.svg
              className="absolute inset-0 w-4 h-4 text-white pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                variants={checkVariants}
                animate={checked ? 'checked' : 'unchecked'}
              />
            </motion.svg>
          )}
        </motion.div>
      </div>
      
      {(label || description) && (
        <div className="ml-3 text-sm">
          {label && (
            <label
              htmlFor={checkboxId.current}
              className={`font-medium cursor-pointer ${
                disabled ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={disabled ? 'text-gray-300' : 'text-gray-500'}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Enhanced Select Component
export const Select = forwardRef(({ 
  label,
  options = [],
  error,
  helperText,
  placeholder = 'Select an option',
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(props.value || '');
  const { shouldAnimate } = useOptimizedAnimation();
  const selectRef = useRef(null);
  const selectId = useRef(`select-${Math.random().toString(36).substr(2, 9)}`);

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedValue(option.value);
    setIsOpen(false);
    props.onChange?.(option);
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className={`space-y-1 ${className}`} ref={selectRef}>
      {label && (
        <label
          htmlFor={selectId.current}
          className={`block text-sm font-medium ${
            error ? 'text-red-700' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <motion.button
          id={selectId.current}
          type="button"
          className={`
            relative w-full cursor-pointer rounded-lg border bg-white text-left
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${sizes[size]}
            ${error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={shouldAnimate ? { scale: 1.01 } : {}}
          whileTap={shouldAnimate ? { scale: 0.99 } : {}}
        >
          <span className={`block truncate ${
            selectedOption ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <motion.span
            className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
            animate={shouldAnimate ? { rotate: isOpen ? 180 : 0 } : {}}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
              variants={shouldAnimate ? dropdownVariants : {}}
              initial={shouldAnimate ? 'closed' : false}
              animate={shouldAnimate ? 'open' : false}
              exit={shouldAnimate ? 'closed' : false}
            >
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  className={`
                    w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors
                    ${selectedValue === option.value 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => handleSelect(option)}
                  initial={shouldAnimate ? { opacity: 0, x: -10 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={shouldAnimate ? { delay: index * 0.05 } : {}}
                  whileHover={shouldAnimate ? { backgroundColor: selectedValue === option.value ? undefined : '#f3f4f6' } : {}}
                >
                  {option.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {(error || helperText) && (
          <motion.p
            className={`text-sm ${
              error ? 'text-red-600' : 'text-gray-500'
            }`}
            initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : false}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = 'Select';

// Enhanced Toggle Switch Component
export const Toggle = ({ 
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const toggleId = useRef(`toggle-${Math.random().toString(36).substr(2, 9)}`);

  const sizes = {
    sm: { switch: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { switch: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { switch: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${className}`}>
      <motion.button
        id={toggleId.current}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full
          cursor-pointer transition-colors ease-in-out duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${currentSize.switch}
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        `}
        onClick={() => !disabled && onChange?.(!checked)}
        whileHover={shouldAnimate && !disabled ? { scale: 1.05 } : {}}
        whileTap={shouldAnimate && !disabled ? { scale: 0.95 } : {}}
        {...props}
      >
        <motion.span
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow transform ring-0
            transition ease-in-out duration-200
            ${currentSize.thumb}
            ${checked ? currentSize.translate : 'translate-x-0'}
          `}
          animate={shouldAnimate ? {
            x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 28) : 0
          } : {}}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={toggleId.current}
              className={`text-sm font-medium cursor-pointer ${
                disabled ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={`text-sm ${
              disabled ? 'text-gray-300' : 'text-gray-500'
            }`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default {
  Button,
  Input,
  Checkbox,
  Select,
  Toggle
};