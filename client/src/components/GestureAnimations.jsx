/**
 * Gesture Animations Component
 * Provides swipe, drag, and gesture-based animations for mobile interactions
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useDragControls, PanInfo } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

// Gesture detection utilities
const detectGesture = (info, threshold = 50) => {
  const { offset, velocity } = info;
  const absOffsetX = Math.abs(offset.x);
  const absOffsetY = Math.abs(offset.y);
  const absVelocityX = Math.abs(velocity.x);
  const absVelocityY = Math.abs(velocity.y);
  
  // Determine primary direction
  if (absOffsetX > absOffsetY && absOffsetX > threshold) {
    return offset.x > 0 ? 'swipeRight' : 'swipeLeft';
  } else if (absOffsetY > absOffsetX && absOffsetY > threshold) {
    return offset.y > 0 ? 'swipeDown' : 'swipeUp';
  }
  
  // Check for quick gestures based on velocity
  if (absVelocityX > 500) {
    return velocity.x > 0 ? 'swipeRight' : 'swipeLeft';
  } else if (absVelocityY > 500) {
    return velocity.y > 0 ? 'swipeDown' : 'swipeUp';
  }
  
  return null;
};

// Swipeable card component
export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 100,
  snapBack = true,
  className = '',
  disabled = false
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 0.8, 1, 0.8, 0.5]
  );
  
  const handleDragStart = () => {
    setIsDragging(true);
  };
  
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    if (disabled) return;
    
    const gesture = detectGesture(info, swipeThreshold);
    setSwipeDirection(gesture);
    
    // Execute callback based on gesture
    switch (gesture) {
      case 'swipeLeft':
        onSwipeLeft?.(info);
        break;
      case 'swipeRight':
        onSwipeRight?.(info);
        break;
      case 'swipeUp':
        onSwipeUp?.(info);
        break;
      case 'swipeDown':
        onSwipeDown?.(info);
        break;
      default:
        // Snap back if no valid gesture
        if (snapBack) {
          x.set(0);
          y.set(0);
        }
    }
    
    // Clear direction after animation
    setTimeout(() => setSwipeDirection(null), 300);
  };
  
  const cardVariants = {
    initial: { scale: 1, rotate: 0 },
    dragging: {
      scale: 1.05,
      transition: {
        duration: shouldAnimate ? 0.2 : 0,
        ease: 'easeOut'
      }
    },
    swipeLeft: {
      x: -300,
      rotate: -30,
      opacity: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeOut'
      }
    },
    swipeRight: {
      x: 300,
      rotate: 30,
      opacity: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeOut'
      }
    },
    swipeUp: {
      y: -300,
      opacity: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeOut'
      }
    },
    swipeDown: {
      y: 300,
      opacity: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <div ref={constraintsRef} className="relative">
      <motion.div
        className={`cursor-grab active:cursor-grabbing ${className}`}
        style={shouldAnimate ? { x, y, rotate, opacity } : {}}
        variants={cardVariants}
        animate={isDragging ? 'dragging' : swipeDirection || 'initial'}
        drag={!disabled}
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Pull to refresh component
export const PullToRefresh = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className = '',
  disabled = false
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);
  
  const refreshProgress = useTransform(
    y,
    [0, refreshThreshold],
    [0, 1]
  );
  
  const handleDrag = (event, info) => {
    if (disabled || isRefreshing) return;
    
    const newY = Math.max(0, info.offset.y);
    setPullDistance(newY);
  };
  
  const handleDragEnd = async (event, info) => {
    if (disabled || isRefreshing) return;
    
    if (info.offset.y >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        y.set(0);
        setPullDistance(0);
      }
    } else {
      y.set(0);
      setPullDistance(0);
    }
  };
  
  const refreshIndicatorVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.2 : 0,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Refresh indicator */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-10"
        variants={refreshIndicatorVariants}
        animate={pullDistance > 20 ? 'visible' : 'hidden'}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full text-white">
          {isRefreshing ? (
            <motion.div
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              animate={shouldAnimate ? { rotate: 360 } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ) : (
            <motion.svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={shouldAnimate ? {
                rotate: useTransform(refreshProgress, [0, 1], [0, 180])
              } : {}}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </motion.svg>
          )}
        </div>
      </motion.div>
      
      {/* Content */}
      <motion.div
        style={shouldAnimate ? { y } : {}}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Draggable list item
export const DraggableListItem = ({
  children,
  onReorder,
  index,
  className = '',
  disabled = false
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  
  const itemVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      zIndex: 1
    },
    dragging: {
      scale: 1.05,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 10,
      transition: {
        duration: shouldAnimate ? 0.2 : 0,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <motion.div
      className={`relative ${className}`}
      variants={itemVariants}
      animate={isDragging ? 'dragging' : 'idle'}
      drag={!disabled}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false);
        onReorder?.(index);
      }}
    >
      <div className="flex items-center">
        {/* Drag handle */}
        <motion.div
          className="p-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </motion.div>
        
        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Pinch to zoom component
export const PinchToZoom = ({
  children,
  minZoom = 0.5,
  maxZoom = 3,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  const handleWheel = useCallback((e) => {
    if (!shouldAnimate) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(minZoom, Math.min(maxZoom, scale * delta));
    setScale(newScale);
  }, [scale, minZoom, maxZoom, shouldAnimate]);
  
  const handleDoubleClick = useCallback(() => {
    if (!shouldAnimate) return;
    
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  }, [scale, shouldAnimate]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div
        style={shouldAnimate ? {
          scale,
          x: position.x,
          y: position.y
        } : {}}
        drag={scale > 1}
        dragConstraints={containerRef}
        dragElastic={0.1}
        animate={{
          scale,
          x: position.x,
          y: position.y
        }}
        transition={{
          duration: shouldAnimate ? 0.3 : 0,
          ease: 'easeOut'
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Swipe navigation component
export const SwipeNavigation = ({
  pages,
  currentPage = 0,
  onPageChange,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [dragOffset, setDragOffset] = useState(0);
  const x = useMotionValue(0);
  
  const handleDrag = (event, info) => {
    setDragOffset(info.offset.x);
  };
  
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 && currentPage > 0) {
        onPageChange?.(currentPage - 1);
      } else if (info.offset.x < 0 && currentPage < pages.length - 1) {
        onPageChange?.(currentPage + 1);
      }
    }
    
    setDragOffset(0);
    x.set(0);
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex"
        style={shouldAnimate ? {
          x: useTransform(
            x,
            (value) => -currentPage * 100 + (value / window.innerWidth) * 100
          )
        } : {
          transform: `translateX(-${currentPage * 100}%)`
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{
          x: -currentPage * window.innerWidth
        }}
        transition={{
          duration: shouldAnimate ? 0.3 : 0,
          ease: 'easeOut'
        }}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            style={{ width: '100vw' }}
          >
            {page}
          </div>
        ))}
      </motion.div>
      
      {/* Page indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {pages.map((_, index) => (
          <motion.button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentPage ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            onClick={() => onPageChange?.(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Long press gesture component
export const LongPressGesture = ({
  children,
  onLongPress,
  longPressDuration = 500,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  const handlePressStart = () => {
    setIsPressed(true);
    setProgress(0);
    
    // Start progress animation
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / longPressDuration, 1);
      setProgress(newProgress);
      
      if (newProgress >= 1) {
        clearInterval(intervalRef.current);
      }
    }, 16);
    
    // Set timeout for long press
    timeoutRef.current = setTimeout(() => {
      onLongPress?.();
      setIsPressed(false);
      setProgress(0);
    }, longPressDuration);
  };
  
  const handlePressEnd = () => {
    setIsPressed(false);
    setProgress(0);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  return (
    <motion.div
      className={`relative ${className}`}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {/* Progress indicator */}
      {isPressed && shouldAnimate && (
        <motion.div
          className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `conic-gradient(from 0deg, transparent ${(1 - progress) * 360}deg, rgba(59, 130, 246, 0.2) ${(1 - progress) * 360}deg)`
          }}
        />
      )}
    </motion.div>
  );
};

// Gesture recognition hook
export const useGestureRecognition = (element, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    threshold = 50
  } = options;
  
  const [gestureState, setGestureState] = useState({
    isGesturing: false,
    currentGesture: null,
    startPoint: null,
    endPoint: null
  });
  
  useEffect(() => {
    if (!element) return;
    
    let tapCount = 0;
    let tapTimeout = null;
    
    const handlePointerDown = (e) => {
      setGestureState(prev => ({
        ...prev,
        isGesturing: true,
        startPoint: { x: e.clientX, y: e.clientY }
      }));
    };
    
    const handlePointerUp = (e) => {
      const endPoint = { x: e.clientX, y: e.clientY };
      
      setGestureState(prev => {
        if (!prev.startPoint) return prev;
        
        const deltaX = endPoint.x - prev.startPoint.x;
        const deltaY = endPoint.y - prev.startPoint.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 10) {
          // Tap gesture
          tapCount++;
          
          if (tapTimeout) clearTimeout(tapTimeout);
          
          tapTimeout = setTimeout(() => {
            if (tapCount === 1) {
              onTap?.(e);
            } else if (tapCount === 2) {
              onDoubleTap?.(e);
            }
            tapCount = 0;
          }, 300);
        } else if (distance > threshold) {
          // Swipe gesture
          const gesture = detectGesture({
            offset: { x: deltaX, y: deltaY },
            velocity: { x: 0, y: 0 }
          }, threshold);
          
          switch (gesture) {
            case 'swipeLeft':
              onSwipeLeft?.(e);
              break;
            case 'swipeRight':
              onSwipeRight?.(e);
              break;
            case 'swipeUp':
              onSwipeUp?.(e);
              break;
            case 'swipeDown':
              onSwipeDown?.(e);
              break;
          }
        }
        
        return {
          ...prev,
          isGesturing: false,
          endPoint,
          currentGesture: null
        };
      });
    };
    
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointerup', handlePointerUp);
      if (tapTimeout) clearTimeout(tapTimeout);
    };
  }, [element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold]);
  
  return gestureState;
};

export default {
  SwipeableCard,
  PullToRefresh,
  DraggableListItem,
  PinchToZoom,
  SwipeNavigation,
  LongPressGesture,
  useGestureRecognition
};