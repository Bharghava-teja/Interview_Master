/**
 * Advanced Loading Animations Component
 * Provides sophisticated loading states with skeleton screens and smooth transitions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

// Skeleton components
export const SkeletonBox = ({ 
  width = '100%', 
  height = '20px', 
  className = '',
  variant = 'rounded',
  animate = true 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const variants = {
    rounded: 'rounded-md',
    circle: 'rounded-full',
    sharp: 'rounded-none',
    pill: 'rounded-full'
  };
  
  const pulseAnimation = {
    animate: shouldAnimate && animate ? {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.02, 1]
    } : {},
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };
  
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 ${variants[variant]} ${className}`}
      style={{ width, height }}
      {...pulseAnimation}
    />
  );
};

export const SkeletonText = ({ 
  lines = 3, 
  className = '',
  lastLineWidth = '75%',
  spacing = 'space-y-2'
}) => {
  return (
    <div className={`${spacing} ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          height="16px"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          variant="rounded"
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className = '', showAvatar = true, showButton = true }) => {
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with avatar */}
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <SkeletonBox width="48px" height="48px" variant="circle" />
          <div className="flex-1">
            <SkeletonBox height="16px" width="120px" className="mb-2" />
            <SkeletonBox height="12px" width="80px" />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="mb-4">
        <SkeletonBox height="20px" width="60%" className="mb-3" />
        <SkeletonText lines={3} lastLineWidth="85%" />
      </div>
      
      {/* Image placeholder */}
      <SkeletonBox height="200px" width="100%" className="mb-4" variant="rounded" />
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <SkeletonBox width="60px" height="24px" variant="pill" />
          <SkeletonBox width="80px" height="24px" variant="pill" />
        </div>
        {showButton && (
          <SkeletonBox width="100px" height="36px" variant="rounded" />
        )}
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <SkeletonBox key={index} height="16px" width="100px" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonBox 
                key={colIndex} 
                height="14px" 
                width={colIndex === 0 ? '120px' : '80px'} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Advanced loading spinners
export const SpinnerDots = ({ size = 'md', color = 'primary', className = '' }) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: { container: 'w-8 h-8', dot: 'w-1.5 h-1.5' },
    md: { container: 'w-12 h-12', dot: 'w-2 h-2' },
    lg: { container: 'w-16 h-16', dot: 'w-3 h-3' }
  };
  
  const colors = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };
  
  const dotVariants = {
    animate: shouldAnimate ? {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7]
    } : {},
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };
  
  return (
    <div className={`flex items-center justify-center ${sizes[size].container} ${className}`}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${sizes[size].dot} ${colors[color]} rounded-full`}
            {...dotVariants}
            transition={{
              ...dotVariants.transition,
              delay: index * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const SpinnerRing = ({ size = 'md', color = 'primary', thickness = 'normal', className = '' }) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const thicknesses = {
    thin: 'border-2',
    normal: 'border-4',
    thick: 'border-6'
  };
  
  const colors = {
    primary: 'border-blue-500',
    secondary: 'border-gray-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    danger: 'border-red-500'
  };
  
  return (
    <motion.div
      className={`${sizes[size]} ${thicknesses[thickness]} ${colors[color]} border-t-transparent rounded-full ${className}`}
      animate={shouldAnimate ? { rotate: 360 } : {}}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};

export const SpinnerPulse = ({ size = 'md', color = 'primary', className = '' }) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const colors = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };
  
  return (
    <motion.div
      className={`${sizes[size]} ${colors[color]} rounded-full ${className}`}
      animate={shouldAnimate ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// Progress indicators
export const ProgressBar = ({ 
  progress = 0, 
  showPercentage = true, 
  color = 'primary',
  size = 'md',
  animated = true,
  className = '' 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colors = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      <div className={`w-full ${sizes[size]} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <motion.div
          className={`${sizes[size]} ${colors[color]} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={shouldAnimate ? {
            duration: 0.5,
            ease: 'easeOut'
          } : { duration: 0 }}
        >
          {animated && shouldAnimate && (
            <motion.div
              className="absolute inset-0 bg-white opacity-30"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export const CircularProgress = ({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8,
  color = 'primary',
  showPercentage = true,
  className = '' 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const colors = {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={shouldAnimate ? {
            duration: 1,
            ease: 'easeOut'
          } : { duration: 0 }}
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Loading states manager
export const LoadingStateManager = ({ 
  isLoading, 
  error, 
  children, 
  loadingComponent,
  errorComponent,
  emptyComponent,
  isEmpty = false,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: shouldAnimate ? 0.2 : 0,
        ease: 'easeIn'
      }
    }
  };
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {loadingComponent || (
              <div className="flex flex-col items-center justify-center py-12">
                <SpinnerRing size="lg" className="mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            )}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {errorComponent || (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
              </div>
            )}
          </motion.div>
        ) : isEmpty ? (
          <motion.div
            key="empty"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {emptyComponent || (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No data available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There's nothing to show here yet.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Lazy loading wrapper with intersection observer
export const LazyLoadWrapper = ({ 
  children, 
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);
  
  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <SkeletonCard />)}
    </div>
  );
};

export default {
  SkeletonBox,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SpinnerDots,
  SpinnerRing,
  SpinnerPulse,
  ProgressBar,
  CircularProgress,
  LoadingStateManager,
  LazyLoadWrapper
};