/**
 * Enhanced accessible modal component with comprehensive accessibility features
 * Provides better screen reader support, keyboard navigation, and focus management
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  enhancedFocusManagement, 
  enhancedScreenReader, 
  modalAccessibility 
} from '../utils/accessibilityEnhancements';
import { KEYS } from '../utils/accessibility';

const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  restoreFocus = true,
  initialFocus = null,
  className = '',
  overlayClassName = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const modalControllerRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Handle escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === KEYS.ESCAPE && closeOnEscape) {
      event.preventDefault();
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Setup modal accessibility when opened
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Store previous active element
    previousActiveElementRef.current = document.activeElement;

    // Create modal controller
    modalControllerRef.current = modalAccessibility.createAccessibleModal(
      modalRef.current,
      {
        closeOnEscape,
        closeOnBackdropClick,
        restoreFocus,
        initialFocus: initialFocus || titleRef.current
      }
    );

    // Open modal
    modalControllerRef.current.open();

    // Add global event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Announce modal opening
    enhancedScreenReader.announceWithDelay(
      `Modal opened: ${title || 'Dialog'}`,
      'polite',
      200
    );

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      if (modalControllerRef.current) {
        modalControllerRef.current.close();
        modalControllerRef.current.destroy();
      }

      // Announce modal closing
      enhancedScreenReader.announceWithDelay(
        'Modal closed',
        'polite',
        100
      );
    };
  }, [isOpen, title, closeOnEscape, closeOnBackdropClick, restoreFocus, initialFocus, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${overlayClassName}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full ${sizeClasses[size]} transform rounded-lg bg-white 
            shadow-xl transition-all dark:bg-gray-800
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          {...props}
        >
          {/* Close button */}
          <button
            type="button"
            className="
              absolute right-4 top-4 z-10 rounded-md p-2 text-gray-400 
              hover:text-gray-600 focus:outline-none focus:ring-2 
              focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-300 
              dark:hover:text-gray-100
            "
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="p-6">
            {title && (
              <h2
                ref={titleRef}
                id="modal-title"
                className="
                  mb-4 text-xl font-semibold text-gray-900 
                  dark:text-white focus:outline-none
                "
                tabIndex={-1}
              >
                {title}
              </h2>
            )}
            
            <div className="modal-body">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Confirmation modal with enhanced accessibility
export const AccessibleConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default' | 'danger'
  ...props
}) => {
  const confirmButtonRef = useRef(null);

  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === KEYS.ENTER && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      handleConfirm();
    }
  }, [handleConfirm]);

  const variantClasses = {
    default: {
      confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500 text-gray-700'
    },
    danger: {
      confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      cancel: 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500 text-gray-700'
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocus={confirmButtonRef.current}
      {...props}
    >
      <div onKeyDown={handleKeyDown}>
        {message && (
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${variantClasses[variant].cancel}
            `}
            onClick={onClose}
            aria-label={`${cancelText} and close dialog`}
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            className={`
              px-4 py-2 rounded-md text-sm font-medium text-white transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${variantClasses[variant].confirm}
            `}
            onClick={handleConfirm}
            aria-label={`${confirmText} action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};

// Alert modal with enhanced accessibility
export const AccessibleAlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  variant = 'info', // 'info' | 'success' | 'warning' | 'error'
  actionText = 'OK',
  ...props
}) => {
  const actionButtonRef = useRef(null);

  const variantConfig = {
    info: {
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    success: {
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    warning: {
      icon: (
        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    error: {
      icon: (
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    }
  };

  const config = variantConfig[variant];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocus={actionButtonRef.current}
      {...props}
    >
      <div className={`rounded-md p-4 ${config.bgColor}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3 flex-1">
            {message && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          ref={actionButtonRef}
          type="button"
          className={`
            px-4 py-2 rounded-md text-sm font-medium text-white transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${config.buttonColor}
          `}
          onClick={onClose}
          aria-label={`${actionText} and close alert`}
        >
          {actionText}
        </button>
      </div>
    </AccessibleModal>
  );
};

export default AccessibleModal;