/**
 * Enhanced accessibility utilities to complement existing accessibility.js
 * Provides additional features for improved screen reader support and keyboard navigation
 */

import { KEYS, focusManagement, announceToScreenReader } from './accessibility';

/**
 * Enhanced focus management with better visual indicators
 */
export const enhancedFocusManagement = {
  /**
   * Create a focus trap with enhanced visual feedback
   */
  createFocusTrap: (container, options = {}) => {
    const {
      initialFocus = null,
      returnFocus = true,
      escapeDeactivates = true,
      clickOutsideDeactivates = false
    } = options;

    let previousActiveElement = document.activeElement;
    
    const activate = () => {
      if (initialFocus) {
        initialFocus.focus();
      } else {
        focusManagement.focusFirst(container);
      }
    };

    const deactivate = () => {
      if (returnFocus && previousActiveElement) {
        previousActiveElement.focus();
      }
    };

    const handleKeyDown = (event) => {
      if (escapeDeactivates && event.key === KEYS.ESCAPE) {
        event.preventDefault();
        deactivate();
        return;
      }
      
      focusManagement.trapFocus(container, event);
    };

    const handleClickOutside = (event) => {
      if (clickOutsideDeactivates && !container.contains(event.target)) {
        deactivate();
      }
    };

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown);
    if (clickOutsideDeactivates) {
      document.addEventListener('click', handleClickOutside);
    }

    // Activate immediately
    activate();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (clickOutsideDeactivates) {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  },

  /**
   * Add visible focus indicators for better accessibility
   */
  addFocusIndicators: (element, options = {}) => {
    const {
      ringColor = 'ring-blue-500',
      ringWidth = 'ring-2',
      ringOffset = 'ring-offset-2'
    } = options;

    const focusClasses = `focus:outline-none focus:${ringWidth} focus:${ringColor} focus:${ringOffset}`;
    
    if (!element.className.includes('focus:')) {
      element.className += ` ${focusClasses}`;
    }
  }
};

/**
 * Enhanced screen reader announcements with better timing
 */
export const enhancedScreenReader = {
  /**
   * Announce with delay to ensure screen reader picks it up
   */
  announceWithDelay: (message, priority = 'polite', delay = 100) => {
    setTimeout(() => {
      announceToScreenReader(message, priority);
    }, delay);
  },

  /**
   * Announce navigation changes
   */
  announceNavigation: (from, to) => {
    const message = `Navigated from ${from} to ${to}`;
    enhancedScreenReader.announceWithDelay(message, 'polite', 200);
  },

  /**
   * Announce form validation errors
   */
  announceFormError: (fieldName, errorMessage) => {
    const message = `Error in ${fieldName}: ${errorMessage}`;
    announceToScreenReader(message, 'assertive');
  },

  /**
   * Announce loading states
   */
  announceLoading: (isLoading, context = '') => {
    const message = isLoading 
      ? `Loading ${context}...` 
      : `${context} loaded successfully`;
    announceToScreenReader(message, 'polite');
  }
};

/**
 * Keyboard navigation enhancements
 */
export const keyboardNavigation = {
  /**
   * Handle roving tabindex for complex widgets
   */
  createRovingTabindex: (items, options = {}) => {
    const {
      orientation = 'horizontal', // 'horizontal' | 'vertical' | 'both'
      wrap = true,
      homeEndKeys = true
    } = options;

    let currentIndex = 0;

    const updateTabindex = (newIndex) => {
      items.forEach((item, index) => {
        item.tabIndex = index === newIndex ? 0 : -1;
      });
      currentIndex = newIndex;
      items[currentIndex].focus();
    };

    const handleKeyDown = (event) => {
      let newIndex = currentIndex;
      const maxIndex = items.length - 1;

      switch (event.key) {
        case KEYS.ARROW_RIGHT:
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            newIndex = wrap && currentIndex === maxIndex ? 0 : Math.min(currentIndex + 1, maxIndex);
          }
          break;
        case KEYS.ARROW_LEFT:
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            newIndex = wrap && currentIndex === 0 ? maxIndex : Math.max(currentIndex - 1, 0);
          }
          break;
        case KEYS.ARROW_DOWN:
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            newIndex = wrap && currentIndex === maxIndex ? 0 : Math.min(currentIndex + 1, maxIndex);
          }
          break;
        case KEYS.ARROW_UP:
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            newIndex = wrap && currentIndex === 0 ? maxIndex : Math.max(currentIndex - 1, 0);
          }
          break;
        case KEYS.HOME:
          if (homeEndKeys) {
            event.preventDefault();
            newIndex = 0;
          }
          break;
        case KEYS.END:
          if (homeEndKeys) {
            event.preventDefault();
            newIndex = maxIndex;
          }
          break;
      }

      if (newIndex !== currentIndex) {
        updateTabindex(newIndex);
      }
    };

    // Initialize
    updateTabindex(0);

    // Add event listeners
    items.forEach(item => {
      item.addEventListener('keydown', handleKeyDown);
      item.addEventListener('focus', () => {
        const index = Array.from(items).indexOf(item);
        if (index !== -1 && index !== currentIndex) {
          updateTabindex(index);
        }
      });
    });

    return {
      destroy: () => {
        items.forEach(item => {
          item.removeEventListener('keydown', handleKeyDown);
        });
      },
      setActiveIndex: updateTabindex
    };
  }
};

/**
 * Form accessibility enhancements
 */
export const formAccessibility = {
  /**
   * Associate labels with form controls
   */
  associateLabel: (input, label, options = {}) => {
    const { generateId: shouldGenerateId = true } = options;
    
    if (shouldGenerateId && !input.id) {
      input.id = `input-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (input.id) {
      label.setAttribute('for', input.id);
    }
  },

  /**
   * Add error message association
   */
  associateError: (input, errorElement) => {
    if (!errorElement.id) {
      errorElement.id = `error-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const describedBy = input.getAttribute('aria-describedby');
    const newDescribedBy = describedBy 
      ? `${describedBy} ${errorElement.id}`
      : errorElement.id;
    
    input.setAttribute('aria-describedby', newDescribedBy);
    input.setAttribute('aria-invalid', 'true');
  },

  /**
   * Remove error association
   */
  removeErrorAssociation: (input, errorElement) => {
    const describedBy = input.getAttribute('aria-describedby');
    if (describedBy && errorElement.id) {
      const newDescribedBy = describedBy
        .split(' ')
        .filter(id => id !== errorElement.id)
        .join(' ');
      
      if (newDescribedBy) {
        input.setAttribute('aria-describedby', newDescribedBy);
      } else {
        input.removeAttribute('aria-describedby');
      }
    }
    
    input.setAttribute('aria-invalid', 'false');
  }
};

/**
 * Modal accessibility enhancements
 */
export const modalAccessibility = {
  /**
   * Create accessible modal with proper focus management
   */
  createAccessibleModal: (modalElement, options = {}) => {
    const {
      closeOnEscape = true,
      closeOnBackdropClick = true,
      restoreFocus = true,
      initialFocus = null
    } = options;

    let previousActiveElement = document.activeElement;
    let focusTrap = null;

    const open = () => {
      // Set modal attributes
      modalElement.setAttribute('role', 'dialog');
      modalElement.setAttribute('aria-modal', 'true');
      
      // Create focus trap
      focusTrap = enhancedFocusManagement.createFocusTrap(modalElement, {
        initialFocus,
        returnFocus: false, // We'll handle this manually
        escapeDeactivates: closeOnEscape
      });

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Announce modal opening
      enhancedScreenReader.announceWithDelay('Modal opened', 'polite', 100);
    };

    const close = () => {
      // Clean up focus trap
      if (focusTrap) {
        focusTrap();
        focusTrap = null;
      }

      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus
      if (restoreFocus && previousActiveElement) {
        previousActiveElement.focus();
      }
      
      // Announce modal closing
      enhancedScreenReader.announceWithDelay('Modal closed', 'polite', 100);
    };

    const handleBackdropClick = (event) => {
      if (closeOnBackdropClick && event.target === modalElement) {
        close();
      }
    };

    // Add event listeners
    if (closeOnBackdropClick) {
      modalElement.addEventListener('click', handleBackdropClick);
    }

    return {
      open,
      close,
      destroy: () => {
        if (focusTrap) {
          focusTrap();
        }
        modalElement.removeEventListener('click', handleBackdropClick);
      }
    };
  }
};

/**
 * Live region management
 */
export const liveRegions = {
  /**
   * Create persistent live regions for announcements
   */
  createLiveRegions: () => {
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    politeRegion.id = 'live-region-polite';
    
    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'live-region-assertive';
    
    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);
    
    return {
      polite: politeRegion,
      assertive: assertiveRegion
    };
  },

  /**
   * Announce to specific live region
   */
  announce: (message, priority = 'polite') => {
    const regionId = `live-region-${priority}`;
    let region = document.getElementById(regionId);
    
    if (!region) {
      const regions = liveRegions.createLiveRegions();
      region = regions[priority];
    }
    
    // Clear and set new message
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 10);
  }
};

/**
 * Accessibility testing utilities
 */
export const accessibilityTesting = {
  /**
   * Check for common accessibility issues
   */
  auditPage: () => {
    const issues = [];
    
    // Check for images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }
    
    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent.trim());
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} buttons without accessible names`);
    }
    
    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} form inputs without labels`);
    }
    
    // Check for missing skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const hasSkipToMain = Array.from(skipLinks).some(link => 
      link.textContent.toLowerCase().includes('skip') && 
      link.textContent.toLowerCase().includes('main')
    );
    if (!hasSkipToMain) {
      issues.push('Missing skip to main content link');
    }
    
    return issues;
  },

  /**
   * Log accessibility audit results
   */
  logAuditResults: () => {
    const issues = accessibilityTesting.auditPage();
    if (issues.length === 0) {
      console.log('✅ No accessibility issues found');
    } else {
      console.warn('⚠️ Accessibility issues found:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }
    return issues;
  }
};

// Initialize live regions on module load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    liveRegions.createLiveRegions();
  });
}