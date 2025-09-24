/**
 * Advanced Page Transitions Component
 * Provides sophisticated page transitions, stagger animations, and morphing effects
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

// Transition Context
const TransitionContext = createContext();

export const TransitionProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('fade');
  const location = useLocation();
  
  const startTransition = (type = 'fade') => {
    setTransitionType(type);
    setIsTransitioning(true);
  };
  
  const endTransition = () => {
    setIsTransitioning(false);
  };
  
  return (
    <TransitionContext.Provider value={{
      isTransitioning,
      transitionType,
      startTransition,
      endTransition,
      currentPath: location.pathname
    }}>
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};

// Page transition variants
const pageVariants = {
  // Fade transitions
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Slide transitions
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  
  // Scale transitions
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },
  
  scaleRotate: {
    initial: { scale: 0.8, rotate: -10, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    exit: { scale: 0.8, rotate: 10, opacity: 0 }
  },
  
  // Flip transitions
  flipX: {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 }
  },
  
  flipY: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 }
  },
  
  // Morphing transitions
  morph: {
    initial: { 
      scale: 0.5, 
      borderRadius: '50%', 
      opacity: 0,
      filter: 'blur(10px)'
    },
    animate: { 
      scale: 1, 
      borderRadius: '0%', 
      opacity: 1,
      filter: 'blur(0px)'
    },
    exit: { 
      scale: 0.5, 
      borderRadius: '50%', 
      opacity: 0,
      filter: 'blur(10px)'
    }
  },
  
  // Curtain effect
  curtain: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' }
  },
  
  // Zoom transitions
  zoomIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 2, opacity: 0 }
  },
  
  zoomOut: {
    initial: { scale: 2, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 }
  }
};

// Main page transition wrapper
export const PageTransition = ({ 
  children, 
  variant = 'fade',
  duration = 0.5,
  className = '',
  style = {}
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const location = useLocation();
  
  const transitionConfig = {
    duration: shouldAnimate ? duration : 0,
    ease: [0.25, 0.46, 0.45, 0.94]
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={`w-full h-full ${className}`}
        style={style}
        variants={pageVariants[variant] || pageVariants.fade}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transitionConfig}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Stagger animation container
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = '',
  variant = 'fadeUp'
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldAnimate ? staggerDelay : 0,
        delayChildren: shouldAnimate ? 0.1 : 0
      }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};

// Stagger animation item
export const StaggerItem = ({ 
  children, 
  className = '',
  variant = 'fadeUp',
  delay = 0
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const itemVariants = {
    fadeUp: {
      hidden: { y: 20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.5 : 0,
          delay: shouldAnimate ? delay : 0
        }
      }
    },
    fadeDown: {
      hidden: { y: -20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.5 : 0,
          delay: shouldAnimate ? delay : 0
        }
      }
    },
    fadeLeft: {
      hidden: { x: -20, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.5 : 0,
          delay: shouldAnimate ? delay : 0
        }
      }
    },
    fadeRight: {
      hidden: { x: 20, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.5 : 0,
          delay: shouldAnimate ? delay : 0
        }
      }
    },
    scale: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.5 : 0,
          delay: shouldAnimate ? delay : 0
        }
      }
    }
  };
  
  return (
    <motion.div
      className={className}
      variants={itemVariants[variant] || itemVariants.fadeUp}
    >
      {children}
    </motion.div>
  );
};

// Morphing shape component
export const MorphingShape = ({ 
  shapes = ['circle', 'square', 'triangle'],
  duration = 2,
  size = 100,
  color = '#3B82F6',
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [currentShape, setCurrentShape] = useState(0);
  
  useEffect(() => {
    if (!shouldAnimate) return;
    
    const interval = setInterval(() => {
      setCurrentShape((prev) => (prev + 1) % shapes.length);
    }, duration * 1000);
    
    return () => clearInterval(interval);
  }, [shapes.length, duration, shouldAnimate]);
  
  const shapeVariants = {
    circle: {
      borderRadius: '50%',
      rotate: 0
    },
    square: {
      borderRadius: '0%',
      rotate: 45
    },
    triangle: {
      borderRadius: '0%',
      rotate: 0,
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
    },
    diamond: {
      borderRadius: '0%',
      rotate: 45,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    },
    hexagon: {
      borderRadius: '0%',
      rotate: 0,
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
    }
  };
  
  return (
    <motion.div
      className={`${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color
      }}
      animate={shapeVariants[shapes[currentShape]] || shapeVariants.circle}
      transition={{
        duration: shouldAnimate ? 1 : 0,
        ease: 'easeInOut'
      }}
    />
  );
};

// Liquid morphing background
export const LiquidMorph = ({ 
  colors = ['#3B82F6', '#8B5CF6', '#EF4444'],
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M0,200 Q100,100 200,200 T400,200 L400,400 L0,400 Z"
          fill="url(#liquidGradient)"
          animate={shouldAnimate ? {
            d: [
              "M0,200 Q100,100 200,200 T400,200 L400,400 L0,400 Z",
              "M0,250 Q100,150 200,250 T400,150 L400,400 L0,400 Z",
              "M0,150 Q100,250 200,150 T400,250 L400,400 L0,400 Z",
              "M0,200 Q100,100 200,200 T400,200 L400,400 L0,400 Z"
            ]
          } : {}}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </div>
  );
};

// Parallax scroll effect
export const ParallaxScroll = ({ 
  children, 
  speed = 0.5,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const ref = useRef(null);
  const y = useMotionValue(0);
  const yRange = [-200, 200];
  const pathRange = [0, 1];
  const opacity = useTransform(y, yRange, [0.2, 1]);
  const scale = useTransform(y, yRange, [0.8, 1]);
  
  useEffect(() => {
    if (!shouldAnimate) return;
    
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * speed;
        y.set(rate);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, y, shouldAnimate]);
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={shouldAnimate ? {
        y,
        opacity,
        scale
      } : {}}
    >
      {children}
    </motion.div>
  );
};

// Route transition wrapper
export const RouteTransition = ({ children, className = '' }) => {
  const location = useLocation();
  const { shouldAnimate } = useOptimizedAnimation();
  
  // Determine transition type based on route
  const getTransitionVariant = (pathname) => {
    if (pathname.includes('/dashboard')) return 'slideLeft';
    if (pathname.includes('/profile')) return 'slideUp';
    if (pathname.includes('/settings')) return 'scale';
    if (pathname.includes('/login') || pathname.includes('/register')) return 'morph';
    return 'fade';
  };
  
  const variant = getTransitionVariant(location.pathname);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className={`w-full min-h-screen ${className}`}
        variants={pageVariants[variant]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: shouldAnimate ? 0.6 : 0,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Magnetic hover effect
export const MagneticHover = ({ 
  children, 
  strength = 0.3,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (e) => {
    if (!shouldAnimate || !ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    x.set(deltaX);
    y.set(deltaY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={ref}
      className={className}
      style={shouldAnimate ? { x, y } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
};

// Text reveal animation
export const TextReveal = ({ 
  text, 
  className = '',
  variant = 'slideUp',
  staggerDelay = 0.05
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const words = text.split(' ');
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldAnimate ? staggerDelay : 0
      }
    }
  };
  
  const wordVariants = {
    slideUp: {
      hidden: { y: 100, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.8 : 0,
          ease: [0.25, 0.46, 0.45, 0.94]
        }
      }
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.6 : 0
        }
      }
    },
    scale: {
      hidden: { scale: 0, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: {
          duration: shouldAnimate ? 0.6 : 0,
          ease: 'easeOut'
        }
      }
    }
  };
  
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          variants={wordVariants[variant] || wordVariants.slideUp}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default {
  TransitionProvider,
  useTransition,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  MorphingShape,
  LiquidMorph,
  ParallaxScroll,
  RouteTransition,
  MagneticHover,
  TextReveal
};