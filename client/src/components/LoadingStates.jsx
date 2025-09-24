/**
 * Loading States Component Library
 * Provides various loading animations and skeleton screens
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, LOADING, PRESETS } from '../utils/animationUtils';

// Spinner Component
export const Spinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  ...props 
}) => {
  const { shouldAnimate, getOptimizedVariants } = useOptimizedAnimation();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500',
    gray: 'border-gray-500'
  };

  if (!shouldAnimate) {
    return (
      <div 
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full ${className}`}
        {...props}
      />
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
      {...props}
    />
  );
};

// Dots Loading Animation
export const DotsLoader = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  ...props 
}) => {
  const { shouldAnimate, getOptimizedVariants } = useOptimizedAnimation();
  
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500'
  };

  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: { 
      scale: [0.8, 1.2, 0.8], 
      opacity: [0.5, 1, 0.5] 
    }
  };

  return (
    <div className={`flex space-x-1 ${className}`} {...props}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          variants={shouldAnimate ? dotVariants : {}}
          initial={shouldAnimate ? 'initial' : false}
          animate={shouldAnimate ? 'animate' : false}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Pulse Loading Animation
export const PulseLoader = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full ${className}`}
      animate={shouldAnimate ? {
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      {...props}
    />
  );
};

// Skeleton Components
export const SkeletonText = ({ 
  lines = 3, 
  className = '',
  animate = true,
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const showAnimation = animate && shouldAnimate;

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className={`h-4 bg-gray-200 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
          animate={showAnimation ? {
            opacity: [0.5, 1, 0.5]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ 
  showAvatar = true, 
  showImage = false,
  className = '',
  animate = true,
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const showAnimation = animate && shouldAnimate;

  const shimmerVariants = {
    animate: {
      x: ['-100%', '100%']
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`} {...props}>
      {/* Header with Avatar */}
      <div className="flex items-center space-x-3 mb-4">
        {showAvatar && (
          <motion.div
            className="w-10 h-10 bg-gray-200 rounded-full relative overflow-hidden"
            animate={showAnimation ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {showAnimation && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
          </motion.div>
        )}
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-4 bg-gray-200 rounded w-1/3 relative overflow-hidden"
            animate={showAnimation ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {showAnimation && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.2
                }}
              />
            )}
          </motion.div>
          <motion.div
            className="h-3 bg-gray-200 rounded w-1/4 relative overflow-hidden"
            animate={showAnimation ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          >
            {showAnimation && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                variants={shimmerVariants}
                animate="animate"
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: 0.3
                }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Image Placeholder */}
      {showImage && (
        <motion.div
          className="w-full h-48 bg-gray-200 rounded-lg mb-4 relative overflow-hidden"
          animate={showAnimation ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          {showAnimation && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              variants={shimmerVariants}
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.4
              }}
            />
          )}
        </motion.div>
      )}

      {/* Content */}
      <SkeletonText lines={3} animate={animate} />
    </div>
  );
};

// Progress Bar
export const ProgressBar = ({ 
  progress = 0, 
  color = 'blue', 
  size = 'md',
  showPercentage = false,
  className = '',
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={className} {...props}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={shouldAnimate ? {
            duration: 0.5,
            ease: 'easeOut'
          } : { duration: 0 }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ 
  isVisible = false,
  message = 'Loading...',
  type = 'spinner',
  backdrop = true,
  className = '',
  ...props 
}) => {
  const { shouldAnimate, getOptimizedVariants } = useOptimizedAnimation();

  if (!isVisible) return null;

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return <DotsLoader size="lg" />;
      case 'pulse':
        return <PulseLoader size="lg" />;
      case 'spinner':
      default:
        return <Spinner size="lg" />;
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        backdrop ? 'bg-black/50 backdrop-blur-sm' : ''
      } ${className}`}
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={shouldAnimate ? { opacity: 1 } : false}
      exit={shouldAnimate ? { opacity: 0 } : false}
      {...props}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4"
        initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : false}
        exit={shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : false}
      >
        {renderLoader()}
        {message && (
          <p className="text-gray-700 text-center font-medium">{message}</p>
        )}
      </motion.div>
    </motion.div>
  );
};

// Button Loading State
export const LoadingButton = ({ 
  children,
  isLoading = false,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  ...props 
}) => {
  const { shouldAnimate } = useOptimizedAnimation();

  return (
    <motion.button
      className={`relative px-4 py-2 rounded-lg font-medium transition-colors ${
        isLoading || disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } ${className}`}
      disabled={isLoading || disabled}
      whileHover={shouldAnimate && !isLoading && !disabled ? { scale: 1.02 } : {}}
      whileTap={shouldAnimate && !isLoading && !disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color="gray" className="mr-2" />
          <span>{loadingText}</span>
        </div>
      )}
    </motion.button>
  );
};

// Export all components
export default {
  Spinner,
  DotsLoader,
  PulseLoader,
  SkeletonText,
  SkeletonCard,
  ProgressBar,
  LoadingOverlay,
  LoadingButton
};