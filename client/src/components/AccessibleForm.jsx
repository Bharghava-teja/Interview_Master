/**
 * Enhanced accessible form components with comprehensive accessibility features
 * Provides better screen reader support, validation announcements, and keyboard navigation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  enhancedScreenReader, 
  formAccessibility,
  keyboardNavigation 
} from '../utils/accessibilityEnhancements';
import { generateId, KEYS } from '../utils/accessibility';

// Enhanced form field with comprehensive accessibility
export const AccessibleFormField = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
  labelClassName = '',
  errorClassName = '',
  hintClassName = '',
  ...props
}) => {
  const fieldId = useRef(generateId('field'));
  const errorId = useRef(generateId('error'));
  const hintId = useRef(generateId('hint'));
  const labelRef = useRef(null);
  const errorRef = useRef(null);
  const hintRef = useRef(null);
  const [previousError, setPreviousError] = useState(null);

  // Announce error changes to screen readers
  useEffect(() => {
    if (error && error !== previousError) {
      enhancedScreenReader.announceFormError(
        label || 'Field',
        error
      );
    }
    setPreviousError(error);
  }, [error, previousError, label]);

  // Clone children with accessibility props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const describedByIds = [];
      
      if (hint) describedByIds.push(hintId.current);
      if (error) describedByIds.push(errorId.current);
      
      return React.cloneElement(child, {
        id: fieldId.current,
        'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : undefined,
        ...child.props
      });
    }
    return child;
  });

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {label && (
        <label
          ref={labelRef}
          htmlFor={fieldId.current}
          className={`
            block text-sm font-medium text-gray-700 dark:text-gray-300
            ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
            ${labelClassName}
          `}
        >
          {label}
        </label>
      )}
      
      {hint && (
        <p
          ref={hintRef}
          id={hintId.current}
          className={`text-sm text-gray-500 dark:text-gray-400 ${hintClassName}`}
        >
          {hint}
        </p>
      )}
      
      {enhancedChildren}
      
      {error && (
        <p
          ref={errorRef}
          id={errorId.current}
          className={`
            text-sm text-red-600 dark:text-red-400 flex items-center
            ${errorClassName}
          `}
          role="alert"
          aria-live="polite"
        >
          <svg
            className="h-4 w-4 mr-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Enhanced input with accessibility features
export const AccessibleInput = React.forwardRef(({
  type = 'text',
  className = '',
  onFocus,
  onBlur,
  onChange,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handleChange = useCallback((event) => {
    onChange?.(event);
  }, [onChange]);

  return (
    <input
      ref={ref}
      type={type}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm transition-colors
        focus:border-blue-500 focus:ring-blue-500 focus:ring-1 focus:outline-none
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
        dark:focus:border-blue-400 dark:focus:ring-blue-400
        ${props['aria-invalid'] === 'true' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        ${isFocused ? 'ring-2' : 'ring-0'}
        ${className}
      `}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      {...props}
    />
  );
});

AccessibleInput.displayName = 'AccessibleInput';

// Enhanced textarea with accessibility features
export const AccessibleTextarea = React.forwardRef(({
  className = '',
  rows = 4,
  onFocus,
  onBlur,
  onChange,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handleChange = useCallback((event) => {
    onChange?.(event);
  }, [onChange]);

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm transition-colors resize-vertical
        focus:border-blue-500 focus:ring-blue-500 focus:ring-1 focus:outline-none
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
        dark:focus:border-blue-400 dark:focus:ring-blue-400
        ${props['aria-invalid'] === 'true' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        ${isFocused ? 'ring-2' : 'ring-0'}
        ${className}
      `}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      {...props}
    />
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Enhanced select with accessibility features
export const AccessibleSelect = React.forwardRef(({
  options = [],
  placeholder = 'Select an option',
  className = '',
  onFocus,
  onBlur,
  onChange,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handleChange = useCallback((event) => {
    onChange?.(event);
    
    // Announce selection to screen readers
    const selectedOption = options.find(opt => opt.value === event.target.value);
    if (selectedOption) {
      enhancedScreenReader.announceWithDelay(
        `Selected: ${selectedOption.label}`,
        'polite',
        100
      );
    }
  }, [onChange, options]);

  return (
    <select
      ref={ref}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm transition-colors
        focus:border-blue-500 focus:ring-blue-500 focus:ring-1 focus:outline-none
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
        dark:focus:border-blue-400 dark:focus:ring-blue-400
        ${props['aria-invalid'] === 'true' ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        ${isFocused ? 'ring-2' : 'ring-0'}
        ${className}
      `}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

AccessibleSelect.displayName = 'AccessibleSelect';

// Enhanced checkbox with accessibility features
export const AccessibleCheckbox = React.forwardRef(({
  label,
  description,
  className = '',
  labelClassName = '',
  onChange,
  ...props
}, ref) => {
  const checkboxId = useRef(generateId('checkbox'));
  const descriptionId = useRef(generateId('description'));

  const handleChange = useCallback((event) => {
    onChange?.(event);
    
    // Announce state change to screen readers
    const state = event.target.checked ? 'checked' : 'unchecked';
    enhancedScreenReader.announceWithDelay(
      `${label || 'Checkbox'} ${state}`,
      'polite',
      50
    );
  }, [onChange, label]);

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          ref={ref}
          id={checkboxId.current}
          type="checkbox"
          className="
            h-4 w-4 text-blue-600 border-gray-300 rounded transition-colors
            focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:outline-none
            disabled:bg-gray-50 disabled:border-gray-300 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400
          "
          aria-describedby={description ? descriptionId.current : undefined}
          onChange={handleChange}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3 text-sm">
          <label
            htmlFor={checkboxId.current}
            className={`font-medium text-gray-700 dark:text-gray-300 cursor-pointer ${labelClassName}`}
          >
            {label}
          </label>
          {description && (
            <p
              id={descriptionId.current}
              className="text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Enhanced radio group with accessibility features
export const AccessibleRadioGroup = ({
  name,
  options = [],
  value,
  onChange,
  orientation = 'vertical', // 'vertical' | 'horizontal'
  className = '',
  ...props
}) => {
  const radioRefs = useRef([]);
  const groupRef = useRef(null);
  const rovingTabindexRef = useRef(null);

  // Setup roving tabindex for keyboard navigation
  useEffect(() => {
    if (radioRefs.current.length > 0) {
      rovingTabindexRef.current = keyboardNavigation.createRovingTabindex(
        radioRefs.current,
        {
          orientation,
          wrap: true,
          homeEndKeys: true
        }
      );
    }

    return () => {
      if (rovingTabindexRef.current) {
        rovingTabindexRef.current.destroy();
      }
    };
  }, [options.length, orientation]);

  const handleChange = useCallback((optionValue, optionLabel) => {
    onChange?.(optionValue);
    
    // Announce selection to screen readers
    enhancedScreenReader.announceWithDelay(
      `Selected: ${optionLabel}`,
      'polite',
      100
    );
  }, [onChange]);

  const orientationClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex flex-wrap gap-4'
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      className={`${orientationClasses[orientation]} ${className}`}
      {...props}
    >
      {options.map((option, index) => {
        const radioId = generateId('radio');
        const isChecked = value === option.value;
        
        return (
          <div key={option.value} className="flex items-center">
            <input
              ref={(el) => {
                if (el) {
                  radioRefs.current[index] = el;
                }
              }}
              id={radioId}
              name={name}
              type="radio"
              value={option.value}
              checked={isChecked}
              className="
                h-4 w-4 text-blue-600 border-gray-300 transition-colors
                focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:outline-none
                disabled:bg-gray-50 disabled:border-gray-300 disabled:cursor-not-allowed
                dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400
              "
              onChange={() => handleChange(option.value, option.label)}
            />
            <label
              htmlFor={radioId}
              className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {option.label}
              {option.description && (
                <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal">
                  {option.description}
                </span>
              )}
            </label>
          </div>
        );
      })}
    </div>
  );
};

// Enhanced form with validation and accessibility features
export const AccessibleForm = ({
  onSubmit,
  children,
  className = '',
  noValidate = true,
  ...props
}) => {
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Announce form submission
      enhancedScreenReader.announceWithDelay(
        'Form submitted, processing...',
        'polite',
        100
      );
      
      await onSubmit?.(event);
      
      // Announce success
      enhancedScreenReader.announceWithDelay(
        'Form submitted successfully',
        'polite',
        200
      );
    } catch (error) {
      // Announce error
      enhancedScreenReader.announceWithDelay(
        'Form submission failed. Please check for errors and try again.',
        'assertive',
        100
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isSubmitting]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate={noValidate}
      className={className}
      {...props}
    >
      {children}
    </form>
  );
};

export default {
  AccessibleForm,
  AccessibleFormField,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup
};