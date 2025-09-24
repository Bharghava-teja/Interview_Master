/**
 * Custom hook for optimized animations with performance monitoring
 * Provides intelligent animation management based on device capabilities and user preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, useAnimation } from 'framer-motion';
import { VARIANTS, SPRING, DURATION, prefersReducedMotion } from '../utils/animationUtils';

// Performance monitoring utilities
const usePerformanceMonitor = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fps = useRef(60);
  
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      fps.current = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      frameCount.current = 0;
      lastTime.current = now;
    }
    
    requestAnimationFrame(measureFPS);
  }, []);
  
  useEffect(() => {
    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, [measureFPS]);
  
  return fps.current;
};

// Device capability detection
const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    supportsHardwareAcceleration: true,
    isLowEndDevice: false,
    batteryLevel: 1,
    connectionSpeed: 'fast'
  });
  
  useEffect(() => {
    const detectCapabilities = async () => {
      const newCapabilities = { ...capabilities };
      
      // Check hardware acceleration
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      newCapabilities.supportsHardwareAcceleration = !!gl;
      
      // Check device memory (if available)
      if ('deviceMemory' in navigator) {
        newCapabilities.isLowEndDevice = navigator.deviceMemory < 4;
      }
      
      // Check battery status (if available)
      if ('getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          newCapabilities.batteryLevel = battery.level;
        } catch (error) {
          console.warn('Battery API not available');
        }
      }
      
      // Check connection speed (if available)
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        newCapabilities.connectionSpeed = ['slow-2g', '2g'].includes(effectiveType) ? 'slow' : 'fast';
      }
      
      setCapabilities(newCapabilities);
    };
    
    detectCapabilities();
  }, []);
  
  return capabilities;
};

// Main optimization hook
export const useOptimizedAnimation = (options = {}) => {
  const {
    enablePerformanceMonitoring = true,
    adaptToDeviceCapabilities = true,
    respectUserPreferences = true,
    fallbackToCSS = true
  } = options;
  
  // Always call hooks to avoid conditional hook issues
  const performanceData = usePerformanceMonitor();
  const deviceCapabilities = useDeviceCapabilities();
  
  // Use data based on options
  const fps = enablePerformanceMonitoring ? performanceData : 60;
  const capabilities = adaptToDeviceCapabilities ? deviceCapabilities : null;
  const [animationQuality, setAnimationQuality] = useState('high');
  const controls = useAnimation();
  
  // Determine optimal animation quality
  useEffect(() => {
    let quality = 'high';
    
    if (respectUserPreferences && prefersReducedMotion()) {
      quality = 'none';
    } else if (adaptToDeviceCapabilities && capabilities) {
      if (capabilities.isLowEndDevice || 
          capabilities.batteryLevel < 0.2 || 
          capabilities.connectionSpeed === 'slow' ||
          !capabilities.supportsHardwareAcceleration) {
        quality = 'low';
      } else if (fps < 30) {
        quality = 'medium';
      }
    }
    
    setAnimationQuality(quality);
  }, [fps, capabilities, respectUserPreferences, adaptToDeviceCapabilities]);
  
  // Create motion values outside of callbacks to avoid hook rule violations
  const motionValueCache = useRef(new Map());
  
  // Get optimized variants based on quality
  const getOptimizedVariants = useCallback((baseVariants) => {
    switch (animationQuality) {
      case 'none':
        return {
          initial: baseVariants.animate || {},
          animate: baseVariants.animate || {},
          exit: baseVariants.animate || {},
          transition: { duration: 0 }
        };
      
      case 'low':
        return {
          ...baseVariants,
          transition: {
            ...baseVariants.transition,
            duration: (baseVariants.transition?.duration || DURATION.normal) * 0.5,
            ease: 'easeOut'
          }
        };
      
      case 'medium':
        return {
          ...baseVariants,
          transition: {
            ...baseVariants.transition,
            duration: (baseVariants.transition?.duration || DURATION.normal) * 0.75
          }
        };
      
      default:
        return baseVariants;
    }
  }, [animationQuality]);
  
  // Get optimized spring configuration
  const getOptimizedSpring = useCallback((baseSpring = SPRING.gentle) => {
    switch (animationQuality) {
      case 'none':
        return { duration: 0 };
      
      case 'low':
        return {
          type: 'tween',
          duration: DURATION.fast,
          ease: 'easeOut'
        };
      
      case 'medium':
        return {
          ...baseSpring,
          stiffness: baseSpring.stiffness * 1.5,
          damping: baseSpring.damping * 1.2
        };
      
      default:
        return baseSpring;
    }
  }, [animationQuality]);
  
  // Create optimized motion values - fixed to avoid hook calls in callbacks
  const createOptimizedMotionValue = useCallback((key, initialValue = 0) => {
    if (!motionValueCache.current.has(key)) {
      motionValueCache.current.set(key, {
        get: () => initialValue,
        set: () => {},
        motionValue: { get: () => initialValue, set: () => {} }
      });
    }
    
    return motionValueCache.current.get(key);
  }, []);
  
  // Create optimized transforms - fixed to avoid hook calls in callbacks
  const createOptimizedTransform = useCallback((key, input, output, options = {}) => {
    if (!motionValueCache.current.has(key)) {
      motionValueCache.current.set(key, {
        get: () => input[0],
        set: () => {}
      });
    }
    
    return motionValueCache.current.get(key);
  }, []);
  
  // Batch animations for better performance
  const batchAnimations = useCallback(async (animations) => {
    if (animationQuality === 'none') {
      return Promise.resolve();
    }
    
    const promises = animations.map(({ target, variants, options = {} }) => {
      const optimizedVariants = getOptimizedVariants(variants);
      return controls.start(optimizedVariants.animate, {
        ...options,
        transition: optimizedVariants.transition
      });
    });
    
    return Promise.all(promises);
  }, [animationQuality, getOptimizedVariants, controls]);
  
  // Stagger animations with performance optimization
  const createOptimizedStagger = useCallback((children, staggerDelay = 0.1) => {
    if (animationQuality === 'none') {
      return { staggerChildren: 0, delayChildren: 0 };
    }
    
    const optimizedDelay = animationQuality === 'low' ? staggerDelay * 0.5 : staggerDelay;
    
    return {
      staggerChildren: optimizedDelay,
      delayChildren: optimizedDelay * 0.5
    };
  }, [animationQuality]);
  
  // CSS fallback for critical animations
  const getCSSFallback = useCallback((animationType) => {
    if (!fallbackToCSS || animationQuality !== 'none') {
      return {};
    }
    
    const cssAnimations = {
      fadeIn: 'animate-fade-in',
      slideUp: 'animate-slide-up',
      slideDown: 'animate-slide-down',
      scale: 'animate-scale-in',
      pulse: 'animate-pulse-soft'
    };
    
    return {
      className: cssAnimations[animationType] || ''
    };
  }, [animationQuality, fallbackToCSS]);
  
  return {
    // Animation quality and performance info
    animationQuality,
    fps,
    capabilities,
    
    // Optimized animation utilities
    getOptimizedVariants,
    getOptimizedSpring,
    createOptimizedMotionValue,
    createOptimizedTransform,
    createOptimizedStagger,
    
    // Animation controls
    controls,
    batchAnimations,
    
    // Fallback utilities
    getCSSFallback,
    
    // Convenience methods
    shouldAnimate: animationQuality !== 'none',
    isHighPerformance: animationQuality === 'high',
    isReducedMotion: animationQuality === 'none'
  };
};

// Specialized hooks for common use cases
export const useOptimizedStagger = (itemCount, baseDelay = 0.1) => {
  const { createOptimizedStagger, animationQuality } = useOptimizedAnimation();
  
  return createOptimizedStagger(itemCount, baseDelay);
};

export const useOptimizedSpring = (initialValue = 0, config = SPRING.gentle) => {
  const { getOptimizedSpring, createOptimizedMotionValue } = useOptimizedAnimation();
  
  const motionValue = createOptimizedMotionValue(initialValue);
  const springConfig = getOptimizedSpring(config);
  
  return {
    ...motionValue,
    config: springConfig
  };
};

export const useOptimizedVariants = (baseVariants) => {
  const { getOptimizedVariants } = useOptimizedAnimation();
  
  return getOptimizedVariants(baseVariants);
};

// Performance monitoring hook
export const useAnimationPerformance = () => {
  const [metrics, setMetrics] = useState({
    averageFPS: 60,
    frameDrops: 0,
    animationCount: 0,
    memoryUsage: 0
  });
  
  const frameDrops = useRef(0);
  const animationCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  
  const recordFrameDrop = useCallback(() => {
    frameDrops.current++;
  }, []);
  
  const recordAnimation = useCallback(() => {
    animationCount.current++;
  }, []);
  
  useEffect(() => {
    const updateMetrics = () => {
      const now = performance.now();
      const deltaTime = now - lastFrameTime.current;
      
      if (deltaTime > 16.67) { // More than 60fps threshold
        recordFrameDrop();
      }
      
      lastFrameTime.current = now;
      
      // Update metrics every second
      setTimeout(() => {
        setMetrics(prev => ({
          ...prev,
          frameDrops: frameDrops.current,
          animationCount: animationCount.current,
          memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
        }));
      }, 1000);
      
      requestAnimationFrame(updateMetrics);
    };
    
    const rafId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(rafId);
  }, [recordFrameDrop]);
  
  return {
    metrics,
    recordFrameDrop,
    recordAnimation
  };
};

export default useOptimizedAnimation;