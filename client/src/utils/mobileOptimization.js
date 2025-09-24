/**
 * Mobile optimization utilities for interview interfaces
 * Provides touch-friendly interactions and responsive design helpers
 */

import React from 'react';

// Enhanced touch event constants
export const TOUCH_EVENTS = {
  START: 'touchstart',
  MOVE: 'touchmove',
  END: 'touchend',
  CANCEL: 'touchcancel',
  POINTER_DOWN: 'pointerdown',
  POINTER_MOVE: 'pointermove',
  POINTER_UP: 'pointerup',
  POINTER_CANCEL: 'pointercancel'
};

// Enhanced breakpoint constants with container queries support
export const BREAKPOINTS = {
  XS: 320,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
  '3XL': 1920,
  '4XL': 2560
};

// Container query breakpoints
export const CONTAINER_BREAKPOINTS = {
  xs: '20rem',    // 320px
  sm: '24rem',    // 384px
  md: '28rem',    // 448px
  lg: '32rem',    // 512px
  xl: '36rem',    // 576px
  '2xl': '42rem', // 672px
  '3xl': '48rem', // 768px
  '4xl': '56rem', // 896px
  '5xl': '64rem', // 1024px
  '6xl': '72rem', // 1152px
  '7xl': '80rem'  // 1280px
};

// Viewport size categories
export const VIEWPORT_SIZES = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop',
  LARGE_DESKTOP: 'large-desktop'
};

// Touch interaction constants
export const TOUCH_CONSTANTS = {
  MIN_TOUCH_TARGET: 44, // Minimum touch target size in pixels
  SWIPE_THRESHOLD: 50,  // Minimum distance for swipe detection
  SWIPE_VELOCITY: 0.3,  // Minimum velocity for swipe
  TAP_TIMEOUT: 300,     // Maximum time for tap detection
  DOUBLE_TAP_TIMEOUT: 300, // Maximum time between taps for double tap
  LONG_PRESS_TIMEOUT: 500  // Minimum time for long press
};

// Enhanced device detection utilities
export const isMobileDevice = () => {
  // Check user agent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const userAgentMatch = mobileRegex.test(navigator.userAgent);
  
  // Check for touch capability and screen size
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= BREAKPOINTS.MD;
  
  return userAgentMatch || (hasTouchScreen && isSmallScreen);
};

export const isTabletDevice = () => {
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;
  const userAgentMatch = tabletRegex.test(navigator.userAgent);
  
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isTabletSize = window.innerWidth >= BREAKPOINTS.SM && window.innerWidth <= BREAKPOINTS.LG;
  
  return userAgentMatch || (hasTouchScreen && isTabletSize);
};

export const isDesktopDevice = () => {
  return !isMobileDevice() && !isTabletDevice();
};

// Get current screen size category
export const getScreenSize = () => {
  const width = window.innerWidth;
  if (width < BREAKPOINTS.SM) return VIEWPORT_SIZES.MOBILE;
  if (width < BREAKPOINTS.LG) return VIEWPORT_SIZES.TABLET;
  if (width < BREAKPOINTS['3XL']) return VIEWPORT_SIZES.DESKTOP;
  return VIEWPORT_SIZES.LARGE_DESKTOP;
};

export const getViewportInfo = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  const orientation = width > height ? 'landscape' : 'portrait';
  const screenSize = getScreenSize();
  const pixelRatio = window.devicePixelRatio || 1;
  
  return {
    width,
    height,
    aspectRatio,
    orientation,
    screenSize,
    pixelRatio,
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: isDesktopDevice(),
    isHighDPI: pixelRatio > 1.5,
    isRetina: pixelRatio >= 2
  };
};

// Responsive breakpoint utilities
export const useBreakpoint = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
};

export const useBreakpointRange = (minBreakpoint, maxBreakpoint) => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  const min = BREAKPOINTS[minBreakpoint] || 0;
  const max = BREAKPOINTS[maxBreakpoint] || Infinity;
  return width >= min && width < max;
};

// Media query utilities
export const createMediaQuery = (breakpoint, direction = 'min') => {
  const size = BREAKPOINTS[breakpoint];
  if (!size) return '';
  
  return `(${direction}-width: ${size}px)`;
};

export const matchesMediaQuery = (query) => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

// Enhanced touch-friendly button classes
export const getTouchButtonClasses = (size = 'default', variant = 'default') => {
  const baseClasses = 'touch-manipulation select-none active:scale-95 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const sizeClasses = {
    xs: 'min-h-[36px] min-w-[36px] px-2 py-1 text-xs',
    sm: 'min-h-[40px] min-w-[40px] px-3 py-2 text-sm',
    default: 'min-h-[44px] min-w-[44px] px-4 py-2 text-base',
    lg: 'min-h-[48px] min-w-[48px] px-6 py-3 text-lg',
    xl: 'min-h-[52px] min-w-[52px] px-8 py-4 text-xl'
  };
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive'
  };
  
  return `${baseClasses} ${sizeClasses[size] || sizeClasses.default} ${variantClasses[variant] || variantClasses.default}`;
};

// Enhanced responsive text classes with fluid typography
export const getResponsiveTextClasses = (baseSize = 'base', fluidScaling = false) => {
  if (fluidScaling) {
    const fluidMap = {
      xs: 'text-[clamp(0.75rem,2vw,0.875rem)]',
      sm: 'text-[clamp(0.875rem,2.5vw,1rem)]',
      base: 'text-[clamp(1rem,3vw,1.125rem)]',
      lg: 'text-[clamp(1.125rem,3.5vw,1.25rem)]',
      xl: 'text-[clamp(1.25rem,4vw,1.5rem)]',
      '2xl': 'text-[clamp(1.5rem,5vw,1.875rem)]',
      '3xl': 'text-[clamp(1.875rem,6vw,2.25rem)]',
      '4xl': 'text-[clamp(2.25rem,7vw,3rem)]'
    };
    return fluidMap[baseSize] || fluidMap.base;
  }
  
  const responsiveMap = {
    xs: 'text-xs sm:text-sm md:text-base',
    sm: 'text-sm sm:text-base md:text-lg',
    base: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
    '2xl': 'text-2xl sm:text-3xl md:text-4xl',
    '3xl': 'text-3xl sm:text-4xl md:text-5xl',
    '4xl': 'text-4xl sm:text-5xl md:text-6xl'
  };
  
  return responsiveMap[baseSize] || responsiveMap.base;
};

// Enhanced responsive spacing classes
export const getResponsiveSpacing = (property, sizes = {}) => {
  const { xs, sm, md, lg, xl } = sizes;
  let classes = '';
  
  if (xs) classes += `${property}-${xs} `;
  if (sm) classes += `sm:${property}-${sm} `;
  if (md) classes += `md:${property}-${md} `;
  if (lg) classes += `lg:${property}-${lg} `;
  if (xl) classes += `xl:${property}-${xl} `;
  
  return classes.trim();
};

// Container query classes
export const getContainerClasses = (sizes = {}) => {
  const { xs, sm, md, lg, xl } = sizes;
  let classes = '';
  
  if (xs) classes += `@xs:${xs} `;
  if (sm) classes += `@sm:${sm} `;
  if (md) classes += `@md:${md} `;
  if (lg) classes += `@lg:${lg} `;
  if (xl) classes += `@xl:${xl} `;
  
  return classes.trim();
};

// Responsive grid classes
export const getResponsiveGridClasses = (columns = {}) => {
  const { xs = 1, sm, md, lg, xl } = columns;
  let classes = `grid-cols-${xs} `;
  
  if (sm) classes += `sm:grid-cols-${sm} `;
  if (md) classes += `md:grid-cols-${md} `;
  if (lg) classes += `lg:grid-cols-${lg} `;
  if (xl) classes += `xl:grid-cols-${xl} `;
  
  return classes.trim();
};

// Responsive flex classes
export const getResponsiveFlexClasses = (direction = {}) => {
  const { xs = 'col', sm, md, lg, xl } = direction;
  let classes = `flex-${xs} `;
  
  if (sm) classes += `sm:flex-${sm} `;
  if (md) classes += `md:flex-${md} `;
  if (lg) classes += `lg:flex-${lg} `;
  if (xl) classes += `xl:flex-${xl} `;
  
  return classes.trim();
};

// Enhanced mobile-optimized Monaco Editor options
export const getMobileEditorOptions = (customOptions = {}) => {
  const viewportInfo = getViewportInfo();
  const isMobile = viewportInfo.isMobile;
  const isTablet = viewportInfo.isTablet;
  const isHighDPI = viewportInfo.isHighDPI;
  
  const baseOptions = {
    fontSize: isMobile ? 16 : isTablet ? 14 : 12,
    lineHeight: isMobile ? 1.8 : isTablet ? 1.6 : 1.4,
    fontFamily: isMobile ? 'SF Mono, Monaco, Consolas, monospace' : 'Fira Code, SF Mono, Monaco, Consolas, monospace',
    wordWrap: isMobile ? 'on' : 'off',
    wordWrapColumn: isMobile ? 40 : 80,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: isMobile ? 'solid' : 'blink',
    cursorSmoothCaretAnimation: true,
    
    // Mobile-specific UI adjustments
    minimap: { 
      enabled: !isMobile && !isTablet,
      scale: isHighDPI ? 2 : 1
    },
    folding: !isMobile,
    lineNumbers: isMobile ? 'off' : 'on',
    lineNumbersMinChars: isMobile ? 0 : 3,
    glyphMargin: !isMobile,
    lineDecorationsWidth: isMobile ? 0 : 10,
    
    // Scrollbar configuration
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: isMobile ? 12 : isTablet ? 10 : 8,
      horizontalScrollbarSize: isMobile ? 12 : isTablet ? 10 : 8,
      verticalSliderSize: isMobile ? 12 : 8,
      horizontalSliderSize: isMobile ? 12 : 8,
      useShadows: !isMobile,
      verticalHasArrows: false,
      horizontalHasArrows: false
    },
    
    // Overview ruler
    overviewRulerLanes: isMobile ? 0 : isTablet ? 2 : 3,
    hideCursorInOverviewRuler: isMobile,
    overviewRulerBorder: !isMobile,
    
    // Layout and behavior
    automaticLayout: true,
    readOnly: false,
    contextmenu: !isMobile,
    selectOnLineNumbers: !isMobile,
    roundedSelection: true,
    renderWhitespace: isMobile ? 'none' : 'selection',
    renderControlCharacters: !isMobile,
    renderIndentGuides: !isMobile,
    
    // IntelliSense and suggestions
    quickSuggestions: {
      other: !isMobile,
      comments: false,
      strings: !isMobile
    },
    suggestOnTriggerCharacters: !isMobile,
    acceptSuggestionOnEnter: isMobile ? 'off' : 'on',
    acceptSuggestionOnCommitCharacter: !isMobile,
    tabCompletion: isMobile ? 'off' : 'on',
    wordBasedSuggestions: !isMobile,
    suggestSelection: isMobile ? 'first' : 'recentlyUsed',
    
    // Features
    parameterHints: { 
      enabled: !isMobile,
      cycle: true
    },
    hover: { 
      enabled: !isMobile,
      delay: isMobile ? 1000 : 300,
      sticky: !isMobile
    },
    links: !isMobile,
    colorDecorators: !isMobile,
    lightbulb: { enabled: !isMobile },
    codeActionsOnSave: !isMobile,
    
    // Find widget
    find: {
      addExtraSpaceOnTop: isMobile,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'never',
      globalFindClipboard: !isMobile
    },
    
    // Mobile-specific touch behavior
    mouseWheelZoom: !isMobile,
    multiCursorModifier: isMobile ? 'ctrlCmd' : 'alt',
    accessibilitySupport: 'auto',
    
    // Performance optimizations for mobile
    renderValidationDecorations: isMobile ? 'off' : 'on',
    renderLineHighlight: isMobile ? 'none' : 'line',
    occurrencesHighlight: !isMobile,
    selectionHighlight: !isMobile,
    codeLens: !isMobile,
    
    // Bracket matching
    matchBrackets: isMobile ? 'never' : 'always',
    renderWhitespace: isMobile ? 'none' : 'boundary'
  };
  
  return { ...baseOptions, ...customOptions };
};

// Enhanced swipe detection class with gesture support
export class SwipeDetector {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      threshold: TOUCH_CONSTANTS.SWIPE_THRESHOLD,
      velocity: TOUCH_CONSTANTS.SWIPE_VELOCITY,
      timeout: TOUCH_CONSTANTS.TAP_TIMEOUT,
      longPressTimeout: TOUCH_CONSTANTS.LONG_PRESS_TIMEOUT,
      doubleTapTimeout: TOUCH_CONSTANTS.DOUBLE_TAP_TIMEOUT,
      preventScroll: false,
      enableLongPress: true,
      enableDoubleTap: true,
      ...options
    };
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.lastTapTime = 0;
    this.longPressTimer = null;
    this.isLongPress = false;
    this.touchCount = 0;
    
    this.init();
  }
  
  init() {
    // Use pointer events for better cross-device support
    if ('PointerEvent' in window) {
      this.element.addEventListener('pointerdown', this.handlePointerStart.bind(this));
      this.element.addEventListener('pointermove', this.handlePointerMove.bind(this));
      this.element.addEventListener('pointerup', this.handlePointerEnd.bind(this));
      this.element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
    } else {
      // Fallback to touch events
      this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
      this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
  }
  
  handlePointerStart(e) {
    this.handleStart(e.clientX, e.clientY, e);
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.handleStart(touch.clientX, touch.clientY, e);
  }
  
  handleStart(x, y, originalEvent) {
    this.startX = x;
    this.startY = y;
    this.startTime = Date.now();
    this.isLongPress = false;
    this.touchCount++;
    
    if (this.options.preventScroll) {
      originalEvent.preventDefault();
    }
    
    // Start long press timer
    if (this.options.enableLongPress) {
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        this.onLongPress?.({
          x: this.startX,
          y: this.startY,
          originalEvent
        });
      }, this.options.longPressTimeout);
    }
    
    this.onTouchStart?.({
      x: this.startX,
      y: this.startY,
      originalEvent
    });
  }
  
  handlePointerMove(e) {
    this.handleMove(e.clientX, e.clientY, e);
  }
  
  handleTouchMove(e) {
    const touch = e.touches[0];
    this.handleMove(touch.clientX, touch.clientY, e);
  }
  
  handleMove(x, y, originalEvent) {
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Cancel long press if moved too much
    if (distance > 10 && this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (this.options.preventScroll) {
      originalEvent.preventDefault();
    }
    
    this.onTouchMove?.({
      x,
      y,
      deltaX,
      deltaY,
      distance,
      originalEvent
    });
  }
  
  handlePointerEnd(e) {
    this.handleEnd(e.clientX, e.clientY, e);
  }
  
  handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    this.handleEnd(touch.clientX, touch.clientY, e);
  }
  
  handleEnd(x, y, originalEvent) {
    const endTime = Date.now();
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;
    const deltaTime = endTime - this.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    // Don't process if it was a long press
    if (this.isLongPress) {
      return;
    }
    
    // Check for swipe
    if (distance > this.options.threshold && velocity > this.options.velocity) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      const direction = absX > absY 
        ? (deltaX > 0 ? 'right' : 'left')
        : (deltaY > 0 ? 'down' : 'up');
      
      this.onSwipe?.(direction, {
        deltaX,
        deltaY,
        deltaTime,
        distance,
        velocity,
        originalEvent
      });
    }
    // Check for tap
    else if (distance < 10 && deltaTime < this.options.timeout) {
      // Check for double tap
      if (this.options.enableDoubleTap && 
          endTime - this.lastTapTime < this.options.doubleTapTimeout) {
        this.onDoubleTap?.({
          x: this.startX,
          y: this.startY,
          originalEvent
        });
      } else {
        this.onTap?.({
          x: this.startX,
          y: this.startY,
          originalEvent
        });
      }
      
      this.lastTapTime = endTime;
    }
    
    this.onTouchEnd?.({
      x,
      y,
      deltaX,
      deltaY,
      deltaTime,
      distance,
      velocity,
      originalEvent
    });
  }
  
  handlePointerCancel(e) {
    this.handleCancel(e);
  }
  
  handleTouchCancel(e) {
    this.handleCancel(e);
  }
  
  handleCancel(originalEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    this.onTouchCancel?.({
      originalEvent
    });
  }
  
  // Event handlers (override these or pass callbacks in options)
  onSwipe(direction, details) {
    this.options.onSwipe?.(direction, details);
  }
  
  onTap(details) {
    this.options.onTap?.(details);
  }
  
  onDoubleTap(details) {
    this.options.onDoubleTap?.(details);
  }
  
  onLongPress(details) {
    this.options.onLongPress?.(details);
  }
  
  onTouchStart(details) {
    this.options.onTouchStart?.(details);
  }
  
  onTouchMove(details) {
    this.options.onTouchMove?.(details);
  }
  
  onTouchEnd(details) {
    this.options.onTouchEnd?.(details);
  }
  
  onTouchCancel(details) {
    this.options.onTouchCancel?.(details);
  }
  
  destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    if ('PointerEvent' in window) {
      this.element.removeEventListener('pointerdown', this.handlePointerStart);
      this.element.removeEventListener('pointermove', this.handlePointerMove);
      this.element.removeEventListener('pointerup', this.handlePointerEnd);
      this.element.removeEventListener('pointercancel', this.handlePointerCancel);
    } else {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchmove', this.handleTouchMove);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('touchcancel', this.handleTouchCancel);
    }
  }
}

// Mobile-optimized layout components
export const MobileContainer = ({ children, className = '' }) => {
  const containerClasses = `
    ${getResponsiveSpacing('px-6', 'px-4')}
    ${getResponsiveSpacing('py-8', 'py-4')}
    max-w-7xl mx-auto
    ${className}
  `.trim();
  
  return React.createElement('div', { className: containerClasses }, children);
};

// Mobile-optimized grid layout
export const getMobileGridClasses = (desktop = 'grid-cols-2', tablet = null, mobile = 'grid-cols-1') => {
  const tabletCols = tablet || (desktop.includes('4') ? 'grid-cols-2' : 'grid-cols-1');
  return `grid ${mobile} sm:${tabletCols} lg:${desktop}`;
};

// Prevent zoom on input focus (iOS Safari)
export const preventZoomOnFocus = (inputElement) => {
  if (!inputElement || !isMobileDevice()) return;
  
  const originalFontSize = inputElement.style.fontSize;
  
  inputElement.addEventListener('focus', () => {
    inputElement.style.fontSize = '16px'; // Prevents zoom on iOS
  });
  
  inputElement.addEventListener('blur', () => {
    inputElement.style.fontSize = originalFontSize;
  });
};

// Mobile-optimized modal/dialog positioning
export const getMobileModalClasses = () => {
  return isMobileDevice() 
    ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4';
};

// Haptic feedback (if supported)
export const triggerHapticFeedback = (type = 'light') => {
  if (navigator.vibrate && isMobileDevice()) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};

// Performance optimization utilities
export const optimizeForMobile = {
  // Reduce animations on low-end devices
  shouldReduceMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           (isMobileDevice() && navigator.hardwareConcurrency < 4);
  },
  
  // Optimize images for mobile
  getOptimizedImageSrc: (src, { width, quality = 80, format = 'webp' } = {}) => {
    if (!src || typeof window === 'undefined') return src;
    
    const viewportInfo = getViewportInfo();
    const devicePixelRatio = viewportInfo.devicePixelRatio;
    const optimalWidth = width ? Math.ceil(width * devicePixelRatio) : 
                       viewportInfo.isMobile ? 800 : 1200;
    
    // Return optimized image URL (placeholder for actual image optimization service)
    return `${src}?w=${optimalWidth}&q=${quality}&f=${format}`;
  },
  
  // Lazy loading configuration
  getLazyLoadConfig: () => ({
    rootMargin: isMobileDevice() ? '50px' : '100px',
    threshold: isMobileDevice() ? 0.1 : 0.25,
    loading: 'lazy'
  }),
  
  // Debounce utility for mobile performance
  debounce: (func, wait = 150) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle utility for scroll events
  throttle: (func, limit = 16) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Advanced responsive utilities
export const responsiveUtils = {
  // Get responsive font size with fluid scaling
  getFluidFontSize: (minSize, maxSize, minViewport = 320, maxViewport = 1200) => {
    const slope = (maxSize - minSize) / (maxViewport - minViewport);
    const yAxisIntersection = -minViewport * slope + minSize;
    return `clamp(${minSize}px, ${yAxisIntersection}px + ${slope * 100}vw, ${maxSize}px)`;
  },
  
  // Get responsive spacing with fluid scaling
  getFluidSpacing: (minSpacing, maxSpacing, minViewport = 320, maxViewport = 1200) => {
    const slope = (maxSpacing - minSpacing) / (maxViewport - minViewport);
    const yAxisIntersection = -minViewport * slope + minSpacing;
    return `clamp(${minSpacing}rem, ${yAxisIntersection}rem + ${slope * 100}vw, ${maxSpacing}rem)`;
  },
  
  // Generate responsive aspect ratio classes
  getAspectRatioClasses: (ratio = '16/9', breakpoints = ['sm', 'md', 'lg']) => {
    const baseClass = `aspect-[${ratio}]`;
    const responsiveClasses = breakpoints.map(bp => `${bp}:aspect-[${ratio}]`);
    return [baseClass, ...responsiveClasses].join(' ');
  },
  
  // Generate responsive visibility classes
  getVisibilityClasses: (config) => {
    const classes = [];
    Object.entries(config).forEach(([breakpoint, visible]) => {
      if (breakpoint === 'base') {
        classes.push(visible ? 'block' : 'hidden');
      } else {
        classes.push(visible ? `${breakpoint}:block` : `${breakpoint}:hidden`);
      }
    });
    return classes.join(' ');
  },
  
  // Generate responsive layout classes
  getLayoutClasses: (layout) => {
    const {
      display = 'block',
      flexDirection,
      justifyContent,
      alignItems,
      gap,
      padding,
      margin
    } = layout;
    
    const classes = [`${display}`];
    
    if (flexDirection) classes.push(`flex-${flexDirection}`);
    if (justifyContent) classes.push(`justify-${justifyContent}`);
    if (alignItems) classes.push(`items-${alignItems}`);
    if (gap) classes.push(`gap-${gap}`);
    if (padding) classes.push(`p-${padding}`);
    if (margin) classes.push(`m-${margin}`);
    
    return classes.join(' ');
  }
};

// Touch and gesture utilities
export const touchUtils = {
  // Enhanced touch event handling
  addTouchListeners: (element, handlers) => {
    const {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      passive = true
    } = handlers;
    
    const options = { passive };
    
    if (onTouchStart) element.addEventListener('touchstart', onTouchStart, options);
    if (onTouchMove) element.addEventListener('touchmove', onTouchMove, options);
    if (onTouchEnd) element.addEventListener('touchend', onTouchEnd, options);
    if (onTouchCancel) element.addEventListener('touchcancel', onTouchCancel, options);
    
    return () => {
      if (onTouchStart) element.removeEventListener('touchstart', onTouchStart);
      if (onTouchMove) element.removeEventListener('touchmove', onTouchMove);
      if (onTouchEnd) element.removeEventListener('touchend', onTouchEnd);
      if (onTouchCancel) element.removeEventListener('touchcancel', onTouchCancel);
    };
  },
  
  // Prevent zoom on double tap
  preventZoom: (element) => {
    let lastTouchEnd = 0;
    element.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  },
  
  // Handle safe area insets
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
    
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  },
  
  // Apply safe area padding
  getSafeAreaClasses: (sides = ['top', 'right', 'bottom', 'left']) => {
    return sides.map(side => `supports-[padding:max(0px)]:p${side[0]}-[env(safe-area-inset-${side})]`).join(' ');
  }
};

// Export React for components
export { React };