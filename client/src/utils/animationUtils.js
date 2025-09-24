/**
 * Optimized animation utilities for Framer Motion
 * Provides performance-optimized animations with reduced motion support
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Base easing curves for consistent animations
export const EASING = {
  // Standard easing
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  
  // Custom easing for specific use cases
  spring: [0.68, -0.55, 0.265, 1.55],
  bounce: [0.68, -0.6, 0.32, 1.6],
  smooth: [0.25, 0.46, 0.45, 0.94],
  
  // Performance-optimized easing
  fastOut: [0.4, 0, 0.2, 1],
  slowIn: [0.8, 0, 0.6, 1]
};

// Duration constants for consistent timing
export const DURATION = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
  slowest: 1.2
};

// Spring configurations for different animation types
export const SPRING = {
  // Gentle spring for UI elements
  gentle: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8
  },
  
  // Bouncy spring for playful interactions
  bouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.6
  },
  
  // Smooth spring for large elements
  smooth: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1
  },
  
  // Quick spring for micro-interactions
  quick: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.5
  }
};

// Optimized animation variants
export const VARIANTS = {
  // Fade animations
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  },
  
  // Scale animations
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: prefersReducedMotion() ? 
      { duration: DURATION.instant } : 
      { ...SPRING.gentle, duration: DURATION.normal }
  },
  
  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  },
  
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  },
  
  // Stagger container
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: prefersReducedMotion() ? 0 : 0.1,
        delayChildren: prefersReducedMotion() ? 0 : 0.1
      }
    },
    exit: {
      transition: {
        staggerChildren: prefersReducedMotion() ? 0 : 0.05,
        staggerDirection: -1
      }
    }
  },
  
  // Stagger item
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  }
};

// Hover and tap animations for interactive elements
export const INTERACTIONS = {
  // Button interactions
  button: {
    whileHover: prefersReducedMotion() ? {} : { scale: 1.02, y: -1 },
    whileTap: prefersReducedMotion() ? {} : { scale: 0.98 },
    transition: SPRING.quick
  },
  
  // Card interactions
  card: {
    whileHover: prefersReducedMotion() ? {} : { 
      scale: 1.02, 
      y: -4,
      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)'
    },
    transition: SPRING.gentle
  },
  
  // Icon interactions
  icon: {
    whileHover: prefersReducedMotion() ? {} : { scale: 1.1, rotate: 5 },
    whileTap: prefersReducedMotion() ? {} : { scale: 0.95 },
    transition: SPRING.quick
  },
  
  // Floating action button
  fab: {
    whileHover: prefersReducedMotion() ? {} : { 
      scale: 1.1, 
      boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.3)'
    },
    whileTap: prefersReducedMotion() ? {} : { scale: 0.95 },
    transition: SPRING.bouncy
  }
};

// Layout animations for dynamic content
export const LAYOUT = {
  // Smooth layout transitions
  smooth: {
    layout: true,
    transition: prefersReducedMotion() ? 
      { duration: DURATION.instant } : 
      { ...SPRING.smooth, duration: DURATION.normal }
  },
  
  // Quick layout transitions
  quick: {
    layout: true,
    transition: prefersReducedMotion() ? 
      { duration: DURATION.instant } : 
      { ...SPRING.quick, duration: DURATION.fast }
  }
};

// Page transition animations
export const PAGE_TRANSITIONS = {
  // Fade transition
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.slow,
      ease: EASING.easeInOut
    }
  },
  
  // Slide transition
  slide: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.slow,
      ease: EASING.easeInOut
    }
  },
  
  // Scale transition
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: prefersReducedMotion() ? 
      { duration: DURATION.instant } : 
      { ...SPRING.smooth, duration: DURATION.slow }
  }
};

// Loading animations
export const LOADING = {
  // Pulse animation
  pulse: {
    animate: prefersReducedMotion() ? {} : {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASING.easeInOut
    }
  },
  
  // Spin animation
  spin: {
    animate: prefersReducedMotion() ? {} : { rotate: 360 },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  },
  
  // Bounce animation
  bounce: {
    animate: prefersReducedMotion() ? {} : {
      y: [0, -10, 0]
    },
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: EASING.easeInOut
    }
  }
};

// Utility functions
export const createStaggerVariants = (staggerDelay = 0.1, childDelay = 0.1) => ({
  container: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: prefersReducedMotion() ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion() ? 0 : childDelay
      }
    }
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  }
});

export const createSlideVariants = (direction = 'up', distance = 20) => {
  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const initialValue = direction === 'up' || direction === 'left' ? distance : -distance;
  
  return {
    initial: { opacity: 0, [axis]: initialValue },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: -initialValue },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  };
};

export const createScaleVariants = (initialScale = 0.95, animateScale = 1) => ({
  initial: { opacity: 0, scale: initialScale },
  animate: { opacity: 1, scale: animateScale },
  exit: { opacity: 0, scale: initialScale },
  transition: prefersReducedMotion() ? 
    { duration: DURATION.instant } : 
    { ...SPRING.gentle, duration: DURATION.normal }
});

// Performance optimization utilities
export const optimizeForPerformance = (variants) => {
  if (prefersReducedMotion()) {
    return {
      ...variants,
      transition: { duration: DURATION.instant }
    };
  }
  return variants;
};

export const createResponsiveVariants = (mobileVariants, desktopVariants) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobile ? mobileVariants : desktopVariants;
};

// Animation presets for common UI patterns
export const PRESETS = {
  // Modal animations
  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: {
        duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal
      }
    },
    content: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95, y: 20 },
      transition: prefersReducedMotion() ? 
        { duration: DURATION.instant } : 
        { ...SPRING.gentle, duration: DURATION.normal }
    }
  },
  
  // Dropdown animations
  dropdown: {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.fast,
      ease: EASING.easeOut
    }
  },
  
  // Toast notifications
  toast: {
    initial: { opacity: 0, x: 100, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 100, scale: 0.95 },
    transition: prefersReducedMotion() ? 
      { duration: DURATION.instant } : 
      { ...SPRING.bouncy, duration: DURATION.normal }
  },
  
  // List item animations
  listItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: {
      duration: prefersReducedMotion() ? DURATION.instant : DURATION.normal,
      ease: EASING.easeOut
    }
  }
};

// Export default configuration
export default {
  EASING,
  DURATION,
  SPRING,
  VARIANTS,
  INTERACTIONS,
  LAYOUT,
  PAGE_TRANSITIONS,
  LOADING,
  PRESETS,
  createStaggerVariants,
  createSlideVariants,
  createScaleVariants,
  optimizeForPerformance,
  createResponsiveVariants,
  prefersReducedMotion
};