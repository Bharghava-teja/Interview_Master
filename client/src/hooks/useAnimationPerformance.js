/**
 * Animation Performance Optimization Hook
 * Monitors and optimizes animation performance with adaptive quality settings
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsHistory = [];
    this.maxHistoryLength = 60; // 1 second at 60fps
    this.isMonitoring = false;
    this.callbacks = new Set();
  }
  
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measure();
  }
  
  stop() {
    this.isMonitoring = false;
  }
  
  measure = () => {
    if (!this.isMonitoring) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.fpsHistory.push(this.fps);
      
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Notify callbacks
      this.callbacks.forEach(callback => callback(this.getMetrics()));
    }
    
    this.frameCount++;
    requestAnimationFrame(this.measure);
  };
  
  getMetrics() {
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
      : 60;
    
    const minFps = this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 60;
    const maxFps = this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 60;
    
    return {
      currentFps: this.fps,
      averageFps: Math.round(avgFps),
      minFps,
      maxFps,
      isStable: minFps >= 50, // Consider stable if min FPS is above 50
      performanceLevel: this.getPerformanceLevel(avgFps)
    };
  }
  
  getPerformanceLevel(fps) {
    if (fps >= 55) return 'high';
    if (fps >= 45) return 'medium';
    if (fps >= 30) return 'low';
    return 'critical';
  }
  
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}

// Global performance monitor instance
const globalPerformanceMonitor = new PerformanceMonitor();

// Device capability detection
const detectDeviceCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  const capabilities = {
    // Hardware acceleration
    hasWebGL: !!gl,
    hasWebGL2: !!canvas.getContext('webgl2'),
    
    // Memory
    deviceMemory: navigator.deviceMemory || 4, // GB, fallback to 4GB
    
    // CPU cores
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    
    // Connection
    connectionType: navigator.connection?.effectiveType || '4g',
    
    // Reduced motion preference
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // Battery status (if available)
    batteryLevel: 1, // Will be updated if battery API is available
    isCharging: true
  };
  
  // Get battery info if available
  if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
      capabilities.batteryLevel = battery.level;
      capabilities.isCharging = battery.charging;
    });
  }
  
  // Calculate performance score (0-100)
  let score = 50; // Base score
  
  if (capabilities.hasWebGL2) score += 20;
  else if (capabilities.hasWebGL) score += 10;
  
  if (capabilities.deviceMemory >= 8) score += 15;
  else if (capabilities.deviceMemory >= 4) score += 10;
  else if (capabilities.deviceMemory >= 2) score += 5;
  
  if (capabilities.hardwareConcurrency >= 8) score += 10;
  else if (capabilities.hardwareConcurrency >= 4) score += 5;
  
  if (capabilities.connectionType === '4g') score += 5;
  else if (capabilities.connectionType === '3g') score -= 5;
  else if (capabilities.connectionType === 'slow-2g') score -= 15;
  
  capabilities.performanceScore = Math.max(0, Math.min(100, score));
  
  return capabilities;
};

// Animation quality levels
const QUALITY_LEVELS = {
  critical: {
    enableAnimations: false,
    maxConcurrentAnimations: 0,
    useTransform3d: false,
    enableBlur: false,
    enableShadows: false,
    enableGradients: false,
    frameRate: 30
  },
  low: {
    enableAnimations: true,
    maxConcurrentAnimations: 3,
    useTransform3d: false,
    enableBlur: false,
    enableShadows: false,
    enableGradients: true,
    frameRate: 30
  },
  medium: {
    enableAnimations: true,
    maxConcurrentAnimations: 8,
    useTransform3d: true,
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    frameRate: 60
  },
  high: {
    enableAnimations: true,
    maxConcurrentAnimations: 15,
    useTransform3d: true,
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    frameRate: 60
  }
};

// Main performance hook
export const useAnimationPerformance = (options = {}) => {
  const {
    enableMonitoring = true,
    adaptiveQuality = true,
    initialQuality = 'auto',
    onPerformanceChange
  } = options;
  
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [qualityLevel, setQualityLevel] = useState(initialQuality);
  const [deviceCapabilities] = useState(() => detectDeviceCapabilities());
  const [activeAnimations, setActiveAnimations] = useState(0);
  const isMonitoringRef = useRef(false);
  
  // Determine initial quality based on device capabilities
  const autoQuality = useMemo(() => {
    if (deviceCapabilities.prefersReducedMotion) return 'critical';
    
    const score = deviceCapabilities.performanceScore;
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'critical';
  }, [deviceCapabilities]);
  
  // Get current quality settings
  const currentQuality = useMemo(() => {
    const level = qualityLevel === 'auto' ? autoQuality : qualityLevel;
    return QUALITY_LEVELS[level] || QUALITY_LEVELS.medium;
  }, [qualityLevel, autoQuality]);
  
  // Performance monitoring callback
  const handlePerformanceUpdate = useCallback((metrics) => {
    setPerformanceMetrics(metrics);
    
    if (adaptiveQuality && !deviceCapabilities.prefersReducedMotion) {
      let newQuality = qualityLevel;
      
      // Adaptive quality adjustment based on performance
      if (metrics.averageFps < 30 && qualityLevel !== 'critical') {
        newQuality = 'critical';
      } else if (metrics.averageFps < 45 && qualityLevel === 'high') {
        newQuality = 'medium';
      } else if (metrics.averageFps < 50 && qualityLevel === 'high') {
        newQuality = 'medium';
      } else if (metrics.averageFps >= 55 && qualityLevel === 'low') {
        newQuality = 'medium';
      } else if (metrics.averageFps >= 58 && qualityLevel === 'medium') {
        newQuality = 'high';
      }
      
      // Consider active animations count
      if (activeAnimations > currentQuality.maxConcurrentAnimations) {
        if (qualityLevel === 'high') newQuality = 'medium';
        else if (qualityLevel === 'medium') newQuality = 'low';
        else if (qualityLevel === 'low') newQuality = 'critical';
      }
      
      if (newQuality !== qualityLevel) {
        setQualityLevel(newQuality);
        onPerformanceChange?.(newQuality, metrics);
      }
    }
  }, [adaptiveQuality, qualityLevel, activeAnimations, currentQuality.maxConcurrentAnimations, deviceCapabilities.prefersReducedMotion, onPerformanceChange]);
  
  // Start/stop monitoring
  useEffect(() => {
    if (enableMonitoring && !isMonitoringRef.current) {
      isMonitoringRef.current = true;
      globalPerformanceMonitor.start();
      const unsubscribe = globalPerformanceMonitor.subscribe(handlePerformanceUpdate);
      
      return () => {
        unsubscribe();
        isMonitoringRef.current = false;
      };
    }
  }, [enableMonitoring, handlePerformanceUpdate]);
  
  // Animation registration functions
  const registerAnimation = useCallback(() => {
    setActiveAnimations(prev => prev + 1);
  }, []);
  
  const unregisterAnimation = useCallback(() => {
    setActiveAnimations(prev => Math.max(0, prev - 1));
  }, []);
  
  // Utility functions
  const shouldAnimate = useCallback((animationType = 'default') => {
    if (!currentQuality.enableAnimations) return false;
    if (deviceCapabilities.prefersReducedMotion) return false;
    
    // Check specific animation type restrictions
    if (animationType === 'blur' && !currentQuality.enableBlur) return false;
    if (animationType === 'shadow' && !currentQuality.enableShadows) return false;
    if (animationType === 'gradient' && !currentQuality.enableGradients) return false;
    
    return activeAnimations < currentQuality.maxConcurrentAnimations;
  }, [currentQuality, deviceCapabilities.prefersReducedMotion, activeAnimations]);
  
  const getOptimizedTransition = useCallback((baseTransition = {}) => {
    const optimized = { ...baseTransition };
    
    // Adjust duration based on quality
    if (optimized.duration) {
      if (currentQuality.frameRate === 30) {
        optimized.duration *= 0.8; // Shorter animations for lower frame rates
      }
    }
    
    // Use transform3d for better performance if supported
    if (currentQuality.useTransform3d) {
      optimized.force3d = true;
    }
    
    // Simplify easing for lower quality
    if (qualityLevel === 'low' || qualityLevel === 'critical') {
      optimized.ease = 'easeOut'; // Simpler easing
    }
    
    return optimized;
  }, [currentQuality, qualityLevel]);
  
  const getOptimizedVariants = useCallback((variants) => {
    if (!currentQuality.enableAnimations) {
      // Return static variants for no animation
      const staticVariants = {};
      Object.keys(variants).forEach(key => {
        staticVariants[key] = variants[key].animate || variants[key];
      });
      return staticVariants;
    }
    
    const optimized = { ...variants };
    
    // Remove expensive properties for lower quality
    Object.keys(optimized).forEach(key => {
      const variant = optimized[key];
      if (typeof variant === 'object') {
        if (!currentQuality.enableBlur && variant.filter) {
          delete variant.filter;
        }
        if (!currentQuality.enableShadows && (variant.boxShadow || variant.textShadow)) {
          delete variant.boxShadow;
          delete variant.textShadow;
        }
      }
    });
    
    return optimized;
  }, [currentQuality]);
  
  // Battery-aware adjustments
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const handleBatteryChange = () => {
          if (battery.level < 0.2 && !battery.charging) {
            // Low battery, reduce quality
            setQualityLevel('low');
          }
        };
        
        battery.addEventListener('levelchange', handleBatteryChange);
        battery.addEventListener('chargingchange', handleBatteryChange);
        
        return () => {
          battery.removeEventListener('levelchange', handleBatteryChange);
          battery.removeEventListener('chargingchange', handleBatteryChange);
        };
      });
    }
  }, []);
  
  return {
    // Performance data
    performanceMetrics,
    deviceCapabilities,
    qualityLevel: qualityLevel === 'auto' ? autoQuality : qualityLevel,
    currentQuality,
    activeAnimations,
    
    // Control functions
    setQualityLevel,
    registerAnimation,
    unregisterAnimation,
    
    // Utility functions
    shouldAnimate,
    getOptimizedTransition,
    getOptimizedVariants,
    
    // Convenience flags
    canAnimate: currentQuality.enableAnimations && !deviceCapabilities.prefersReducedMotion,
    canUseBlur: currentQuality.enableBlur,
    canUseShadows: currentQuality.enableShadows,
    canUseGradients: currentQuality.enableGradients,
    preferredFrameRate: currentQuality.frameRate
  };
};

// Hook for individual animation components
export const useAnimationRegistration = (isActive = true) => {
  const { registerAnimation, unregisterAnimation } = useAnimationPerformance();
  
  useEffect(() => {
    if (isActive) {
      registerAnimation();
      return unregisterAnimation;
    }
  }, [isActive, registerAnimation, unregisterAnimation]);
};

// Performance-aware animation wrapper hook
export const usePerformantAnimation = (animationConfig, dependencies = []) => {
  const { 
    shouldAnimate, 
    getOptimizedTransition, 
    getOptimizedVariants,
    registerAnimation,
    unregisterAnimation
  } = useAnimationPerformance();
  
  const optimizedConfig = useMemo(() => {
    if (!shouldAnimate()) return null;
    
    return {
      ...animationConfig,
      transition: getOptimizedTransition(animationConfig.transition),
      variants: animationConfig.variants ? getOptimizedVariants(animationConfig.variants) : undefined
    };
  }, [animationConfig, shouldAnimate, getOptimizedTransition, getOptimizedVariants, ...dependencies]);
  
  useEffect(() => {
    if (optimizedConfig) {
      registerAnimation();
      return unregisterAnimation;
    }
  }, [optimizedConfig, registerAnimation, unregisterAnimation]);
  
  return optimizedConfig;
};

// Debug component for performance monitoring
export const PerformanceDebugger = ({ className = '' }) => {
  const { performanceMetrics, qualityLevel, activeAnimations, deviceCapabilities } = useAnimationPerformance();
  
  if (!performanceMetrics) return null;
  
  return (
    <div className={`fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono z-50 ${className}`}>
      <div className="space-y-1">
        <div>FPS: {performanceMetrics.currentFps} (avg: {performanceMetrics.averageFps})</div>
        <div>Quality: {qualityLevel}</div>
        <div>Active Animations: {activeAnimations}</div>
        <div>Performance Score: {deviceCapabilities.performanceScore}</div>
        <div className={`status ${performanceMetrics.isStable ? 'text-green-400' : 'text-red-400'}`}>
          {performanceMetrics.isStable ? 'Stable' : 'Unstable'}
        </div>
      </div>
    </div>
  );
};

export default {
  useAnimationPerformance,
  useAnimationRegistration,
  usePerformantAnimation,
  PerformanceDebugger
};