/**
 * Accessibility utilities for the interview application
 * Provides helper functions for ARIA labels, keyboard navigation, and screen reader support
 */

import React from 'react';

// Enhanced ARIA roles and properties
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUBAR: 'menubar',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERTDIALOG: 'alertdialog',
  ALERT: 'alert',
  STATUS: 'status',
  LOG: 'log',
  MARQUEE: 'marquee',
  TIMER: 'timer',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  TEXTBOX: 'textbox',
  SEARCHBOX: 'searchbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  GROUP: 'group',
  RADIOGROUP: 'radiogroup',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  SWITCH: 'switch',
  GRID: 'grid',
  GRIDCELL: 'gridcell',
  ROW: 'row',
  ROWGROUP: 'rowgroup',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  TREE: 'tree',
  TREEITEM: 'treeitem',
  TREEGROUP: 'group',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo',
  COMPLEMENTARY: 'complementary',
  REGION: 'region',
  ARTICLE: 'article',
  SECTION: 'section',
  FORM: 'form',
  SEARCH: 'search',
  TOOLBAR: 'toolbar',
  TOOLTIP: 'tooltip',
  FEED: 'feed',
  FIGURE: 'figure',
  IMG: 'img',
  MATH: 'math',
  NOTE: 'note',
  PRESENTATION: 'presentation',
  NONE: 'none'
};

// ARIA states and properties
export const ARIA_STATES = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  PRESSED: 'aria-pressed',
  HIDDEN: 'aria-hidden',
  DISABLED: 'aria-disabled',
  READONLY: 'aria-readonly',
  REQUIRED: 'aria-required',
  INVALID: 'aria-invalid',
  BUSY: 'aria-busy',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  DROPEFFECT: 'aria-dropeffect',
  GRABBED: 'aria-grabbed',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  CONTROLS: 'aria-controls',
  DESCRIBEDBY: 'aria-describedby',
  LABELLEDBY: 'aria-labelledby',
  LABEL: 'aria-label',
  OWNS: 'aria-owns',
  HASPOPUP: 'aria-haspopup',
  LEVEL: 'aria-level',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  VALUEMIN: 'aria-valuemin',
  VALUEMAX: 'aria-valuemax',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
  ORIENTATION: 'aria-orientation',
  SORT: 'aria-sort',
  AUTOCOMPLETE: 'aria-autocomplete',
  MULTILINE: 'aria-multiline',
  MULTISELECTABLE: 'aria-multiselectable',
  PLACEHOLDER: 'aria-placeholder',
  ROWCOUNT: 'aria-rowcount',
  COLCOUNT: 'aria-colcount',
  ROWINDEX: 'aria-rowindex',
  COLINDEX: 'aria-colindex',
  ROWSPAN: 'aria-rowspan',
  COLSPAN: 'aria-colspan'
};

// Live region politeness levels
export const LIVE_REGIONS = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive'
}

// Keyboard key constants
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
};

/**
 * Generate unique IDs for ARIA relationships
 */
export const generateId = (prefix = 'element') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Handle keyboard navigation for button-like elements
 */
export const handleKeyboardActivation = (event, callback) => {
  if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
    event.preventDefault();
    callback(event);
  }
};

/**
 * Handle arrow key navigation for lists/grids
 */
export const handleArrowNavigation = (event, items, currentIndex, onIndexChange) => {
  let newIndex = currentIndex;
  
  switch (event.key) {
    case KEYS.ARROW_UP:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case KEYS.ARROW_DOWN:
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case KEYS.ARROW_LEFT:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case KEYS.ARROW_RIGHT:
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case KEYS.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case KEYS.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return;
  }
  
  onIndexChange(newIndex);
};

/**
 * Format time for screen readers
 */
export const formatTimeForScreenReader = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds} seconds remaining`;
  } else if (remainingSeconds === 0) {
    return `${minutes} minutes remaining`;
  } else {
    return `${minutes} minutes and ${remainingSeconds} seconds remaining`;
  }
};

/**
 * Generate progress announcement for screen readers
 */
export const formatProgressForScreenReader = (current, total, type = 'question') => {
  return `${type} ${current} of ${total}`;
};

/**
 * Generate score announcement for screen readers
 */
export const formatScoreForScreenReader = (score, total) => {
  const percentage = Math.round((score / total) * 100);
  return `You scored ${score} out of ${total} questions correctly, which is ${percentage} percent`;
};

/**
 * Enhanced focus management with better error handling and performance
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  const focusableSelectors = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]:not([tabindex="-1"])',
    'audio[controls]:not([tabindex="-1"])',
    'video[controls]:not([tabindex="-1"])',
    'details > summary:first-of-type',
    'details:not([tabindex="-1"])'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll(focusableSelectors));
  
  return elements.filter(element => {
    // Check if element is visible and not hidden
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0 &&
      !element.hasAttribute('inert')
    );
  });
};

export const focusFirst = (container) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return focusableElements[0];
  }
  return null;
};

export const focusLast = (container) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    const lastElement = focusableElements[focusableElements.length - 1];
    lastElement.focus();
    return lastElement;
  }
  return null;
};

export const focusNext = (container, currentElement) => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1].focus();
    return focusableElements[currentIndex + 1];
  }
  return null;
};

export const focusPrevious = (container, currentElement) => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex > 0) {
    focusableElements[currentIndex - 1].focus();
    return focusableElements[currentIndex - 1];
  }
  return null;
};

export const trapFocus = (container, options = {}) => {
  const {
    initialFocus = null,
    returnFocus = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = true
  } = options;
  
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const previousActiveElement = document.activeElement;

  const handleKeyDown = (e) => {
    if (e.key === KEYS.TAB) {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    } else if (e.key === KEYS.ESCAPE && escapeDeactivates) {
      deactivate();
    }
  };
  
  const handleClickOutside = (e) => {
    if (clickOutsideDeactivates && !container.contains(e.target)) {
      deactivate();
    }
  };
  
  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (clickOutsideDeactivates) {
      document.removeEventListener('click', handleClickOutside);
    }
    
    if (returnFocus && previousActiveElement && previousActiveElement.focus) {
      previousActiveElement.focus();
    }
  };

  // Set up event listeners
  document.addEventListener('keydown', handleKeyDown);
  if (clickOutsideDeactivates) {
    // Use setTimeout to avoid immediate triggering
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }
  
  // Set initial focus
  if (initialFocus && focusableElements.includes(initialFocus)) {
    initialFocus.focus();
  } else {
    firstElement.focus();
  }

  return deactivate;
};

// Focus restoration utility
export const createFocusManager = () => {
  let focusStack = [];
  
  return {
    save: (element = document.activeElement) => {
      if (element && element !== document.body) {
        focusStack.push(element);
      }
    },
    
    restore: () => {
      const element = focusStack.pop();
      if (element && element.focus) {
        element.focus();
        return element;
      }
      return null;
    },
    
    clear: () => {
      focusStack = [];
    },
    
    get stack() {
      return [...focusStack];
    }
  };
};

// Global focus manager instance
export const focusManager = createFocusManager();

/**
 * Focus management utilities (legacy object for backward compatibility)
 */
export const focusManagement = {
  focusFirst,
  focusLast,
  trapFocus: (container, event) => {
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.key === KEYS.TAB) {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
};

/**
 * Enhanced screen reader utilities
 */
export const announceToScreenReader = (message, priority = 'polite', delay = 100) => {
  if (!message || typeof message !== 'string') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(announcement);
  
  // Delay to ensure screen readers pick up the change
  setTimeout(() => {
    announcement.textContent = message;
  }, delay);
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, Math.max(1000, message.length * 50)); // Longer messages need more time
};

export const formatForScreenReader = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces before capital letters
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2') // Add spaces between numbers and letters
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2') // Add spaces between letters and numbers
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim()
    .toLowerCase();
};

// ARIA attribute management
export const setAriaAttributes = (element, attributes) => {
  if (!element || !attributes) return;
  
  Object.entries(attributes).forEach(([key, value]) => {
    const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
    if (value === null || value === undefined) {
      element.removeAttribute(ariaKey);
    } else {
      element.setAttribute(ariaKey, String(value));
    }
  });
};

export const getAriaAttributes = (element) => {
  if (!element) return {};
  
  const attributes = {};
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-')) {
      attributes[attr.name] = attr.value;
    }
  });
  
  return attributes;
};

// Live region management
export const createLiveRegion = (type = 'polite', label = null) => {
  const region = document.createElement('div');
  region.setAttribute('aria-live', type);
  region.setAttribute('aria-atomic', 'true');
  if (label) {
    region.setAttribute('aria-label', label);
  }
  region.className = 'sr-only';
  region.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(region);
  
  return {
    announce: (message, delay = 100) => {
      if (!message) return;
      
      setTimeout(() => {
        region.textContent = message;
      }, delay);
    },
    
    clear: () => {
      region.textContent = '';
    },
    
    destroy: () => {
      if (document.body.contains(region)) {
        document.body.removeChild(region);
      }
    },
    
    element: region
  };
};

// Global live regions for common use cases
export const liveRegions = {
  polite: null,
  assertive: null,
  status: null,
  
  init() {
    if (!this.polite) {
      this.polite = createLiveRegion('polite', 'Polite announcements');
    }
    if (!this.assertive) {
      this.assertive = createLiveRegion('assertive', 'Important announcements');
    }
    if (!this.status) {
      this.status = createLiveRegion('polite', 'Status updates');
    }
  },
  
  announce(message, type = 'polite', delay = 100) {
    this.init();
    if (this[type]) {
      this[type].announce(message, delay);
    }
  },
  
  clear(type = null) {
    if (type && this[type]) {
      this[type].clear();
    } else {
      // Clear all regions
      Object.values(this).forEach(region => {
        if (region && typeof region.clear === 'function') {
          region.clear();
        }
      });
    }
  },
  
  destroy() {
    Object.keys(this).forEach(key => {
      if (this[key] && typeof this[key].destroy === 'function') {
        this[key].destroy();
        this[key] = null;
      }
    });
  }
};

// Initialize live regions on module load
if (typeof window !== 'undefined') {
  liveRegions.init();
}

/**
 * Enhanced screen reader only text utility
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => {
  return (
    <Component
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Enhanced skip link component for keyboard navigation
 */
export const SkipLink = ({ href = '#main', children = 'Skip to main content', className = '', ...props }) => {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: 'var(--color-primary)',
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: '9999',
        transition: 'top 0.3s ease'
      }}
      onFocus={(e) => {
        e.target.style.top = '6px';
      }}
      onBlur={(e) => {
        e.target.style.top = '-40px';
      }}
      {...props}
    >
      {children}
    </a>
  );
};

/**
 * Enhanced accessible button with proper ARIA attributes
 */
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  ariaControls,
  ariaHaspopup,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === KEYS.ENTER || e.key === KEYS.SPACE) {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-controls={ariaControls}
      aria-haspopup={ariaHaspopup}
      aria-busy={loading}
      className={`accessible-button accessible-button--${variant} accessible-button--${size} ${className}`}
      {...props}
    >
      {loading && (
        <ScreenReaderOnly>Loading...</ScreenReaderOnly>
      )}
      {children}
    </button>
  );
};

/**
 * Enhanced accessible timer component with announcements
 */
export const AccessibleTimer = ({ 
  duration, 
  onComplete, 
  announceInterval = 30,
  announceWarnings = [60, 30, 10, 5],
  autoStart = false
}) => {
  const [timeLeft, setTimeLeft] = React.useState(duration);
  const [isRunning, setIsRunning] = React.useState(autoStart);
  const [hasWarned, setHasWarned] = React.useState(new Set());

  React.useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Announce time remaining at intervals
          if (newTime % announceInterval === 0 && newTime > 0) {
            liveRegions.announce(`${newTime} seconds remaining`, 'polite');
          }
          
          // Announce warnings
          if (announceWarnings.includes(newTime) && !hasWarned.has(newTime)) {
            setHasWarned(prev => new Set([...prev, newTime]));
            liveRegions.announce(`Warning: ${newTime} seconds remaining`, 'assertive');
          }
          
          if (newTime === 0) {
            liveRegions.announce('Timer completed', 'assertive');
            onComplete?.();
            setIsRunning(false);
            setHasWarned(new Set());
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, announceInterval, announceWarnings, hasWarned, onComplete]);

  const start = () => {
    setIsRunning(true);
    liveRegions.announce('Timer started', 'polite');
  };

  const pause = () => {
    setIsRunning(false);
    liveRegions.announce('Timer paused', 'polite');
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setHasWarned(new Set());
    liveRegions.announce('Timer reset', 'polite');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(timeLeft),
    percentage: ((duration - timeLeft) / duration) * 100
  };
};

/**
 * Enhanced accessible progress indicator
 */
export const AccessibleProgress = ({
  value,
  max = 100,
  min = 0,
  label,
  description,
  showPercentage = true,
  announceChanges = true,
  announceThreshold = 10,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const percentage = Math.round(((value - min) / (max - min)) * 100);
  const prevPercentageRef = React.useRef(percentage);
  const progressId = React.useId();
  const labelId = `${progressId}-label`;
  const descId = `${progressId}-desc`;

  React.useEffect(() => {
    if (announceChanges && percentage !== prevPercentageRef.current) {
      const diff = Math.abs(percentage - prevPercentageRef.current);
      if (diff >= announceThreshold) {
        liveRegions.announce(`Progress: ${percentage}%`, 'polite');
      }
      prevPercentageRef.current = percentage;
    }
  }, [percentage, announceChanges, announceThreshold]);

  return (
    <div className={`progress-container progress-container--${variant} progress-container--${size} ${className}`}>
      {label && (
        <div id={labelId} className="progress-label">
          {label}
          {showPercentage && (
            <span className="progress-percentage" aria-hidden="true">
              {percentage}%
            </span>
          )}
        </div>
      )}
      {description && (
        <div id={descId} className="progress-description">
          {description}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${percentage}% complete`}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descId : undefined}
        className="progress-bar"
        tabIndex="0"
      >
        <div
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>
      <ScreenReaderOnly>
        {`Progress: ${value} of ${max} (${percentage}% complete)`}
      </ScreenReaderOnly>
    </div>
  );
};

// Accessibility validation utilities
export const validateAccessibility = {
  /**
   * Check if element has proper ARIA labels
   */
  hasAriaLabel: (element) => {
    return element.hasAttribute('aria-label') || 
           element.hasAttribute('aria-labelledby') ||
           (element.tagName === 'INPUT' && element.labels && element.labels.length > 0);
  },
  
  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element) => {
    const tabIndex = element.getAttribute('tabindex');
    return tabIndex !== '-1' && 
           (element.tabIndex >= 0 || 
            ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName));
  },
  
  /**
   * Check color contrast (simplified)
   */
  hasGoodContrast: (foreground, background) => {
    // This is a simplified check - in production, use a proper contrast calculation library
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    return contrast >= 4.5; // WCAG AA standard
  }
};

// Helper function for contrast calculation
function getLuminance(color) {
  // Simplified luminance calculation
  // In production, use a proper color library
  const rgb = color.match(/\d+/g);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(c => {
    c = parseInt(c) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}