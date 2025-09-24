/**
 * Enhanced Micro-Interactions Component Library
 * Provides sophisticated animations, haptic feedback, and visual effects
 */

import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, INTERACTIONS, PRESETS, SPRING, DURATION, EASING } from '../utils/animationUtils';

// Enhanced Button with sophisticated micro-interactions
export const EnhancedButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  loadingText = 'Loading...',
  className = '',
  hapticFeedback = true,
  soundEffect = false,
  glowEffect = false,
  magneticEffect = false,
  rippleEffect = true,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);
  const { shouldAnimate } = useOptimizedAnimation();
  
  // Magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback((e) => {
    if (!magneticEffect || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    
    x.set(deltaX);
    y.set(deltaY);
  }, [magneticEffect, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [hapticFeedback]);

  // Singleton AudioContext to prevent multiple instances
  const getAudioContext = useCallback(() => {
    if (!window.sharedAudioContext) {
      try {
        window.sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        return null;
      }
    }
    return window.sharedAudioContext;
  }, []);

  // Sound effect with proper error handling
  const playSound = useCallback(() => {
    if (!soundEffect) return;
    
    try {
      const audioContext = getAudioContext();
      if (!audioContext) return;
      
      // Resume context if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create a subtle click sound using Web Audio API
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      // Clean up oscillator after use
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Failed to play sound effect:', error);
    }
  }, [soundEffect, getAudioContext]);

  // Ripple effect
  const createRipple = useCallback((e) => {
    if (!rippleEffect || !buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  }, [rippleEffect]);

  const handleClick = useCallback((e) => {
    if (disabled || isLoading) return;
    
    triggerHaptic();
    playSound();
    createRipple(e);
    setIsPressed(true);
    
    setTimeout(() => setIsPressed(false), 150);
    
    if (props.onClick) {
      props.onClick(e);
    }
  }, [disabled, isLoading, triggerHaptic, playSound, createRipple, props]);

  const variants = {
    primary: `bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 ${glowEffect ? 'shadow-blue-500/25' : ''}`,
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 shadow-md hover:from-gray-200 hover:to-gray-300 border border-gray-300',
    success: `bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:from-green-700 hover:to-green-800 ${glowEffect ? 'shadow-green-500/25' : ''}`,
    danger: `bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 ${glowEffect ? 'shadow-red-500/25' : ''}`,
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300',
    glass: 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl'
  };

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      ref={(node) => {
        buttonRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      className={`
        relative inline-flex items-center justify-center font-semibold
        transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden
        transform-gpu will-change-transform
        ${variants[variant]}
        ${sizes[size]}
        ${glowEffect ? 'shadow-2xl' : ''}
        ${className}
      `}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseMove={magneticEffect ? handleMouseMove : undefined}
      onMouseLeave={magneticEffect ? handleMouseLeave : undefined}
      style={{
        x: magneticEffect ? springX : 0,
        y: magneticEffect ? springY : 0
      }}
      {...(shouldAnimate && !isDisabled ? {
        whileHover: {
          scale: 1.02,
          y: -2,
          boxShadow: glowEffect ? '0 20px 40px -10px rgba(0, 0, 0, 0.3)' : '0 10px 30px -5px rgba(0, 0, 0, 0.2)'
        },
        whileTap: {
          scale: 0.98,
          y: 0
        },
        transition: SPRING.quick
      } : {})}
      {...props}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size
            }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Glow effect */}
      {glowEffect && (
        <motion.div
          className="absolute inset-0 rounded-inherit bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'linear'
          }}
        />
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {loadingText}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {leftIcon && (
              <motion.span
                className="mr-2"
                animate={isPressed ? { scale: 0.9 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {leftIcon}
              </motion.span>
            )}
            <motion.span
              animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
              transition={{ duration: 0.1 }}
            >
              {children}
            </motion.span>
            {rightIcon && (
              <motion.span
                className="ml-2"
                animate={isPressed ? { scale: 0.9 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {rightIcon}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

// Enhanced Card with hover effects and interactions
export const EnhancedCard = forwardRef(({
  children,
  className = '',
  variant = 'default',
  hoverable = true,
  clickable = false,
  glowEffect = false,
  tiltEffect = false,
  onClick,
  ...props
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const { shouldAnimate } = useOptimizedAnimation();
  
  // Tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = useCallback((e) => {
    if (!tiltEffect || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((e.clientX - centerX) / 5);
    y.set((e.clientY - centerY) / 5);
  }, [tiltEffect, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);

  const variants = {
    default: 'bg-white border border-gray-200 shadow-md',
    glass: 'bg-white/20 backdrop-blur-md border border-white/30',
    elevated: 'bg-white shadow-xl border-0',
    outlined: 'bg-transparent border-2 border-gray-300'
  };

  return (
    <motion.div
      ref={(node) => {
        cardRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      className={`
        rounded-xl p-6 transition-all duration-300 transform-gpu will-change-transform
        ${variants[variant]}
        ${clickable ? 'cursor-pointer' : ''}
        ${glowEffect ? 'shadow-2xl' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={tiltEffect ? handleMouseMove : undefined}
      onMouseLeave={handleMouseLeave}
      onClick={clickable ? onClick : undefined}
      style={{
        rotateX: tiltEffect ? rotateX : 0,
        rotateY: tiltEffect ? rotateY : 0,
        transformStyle: 'preserve-3d'
      }}
      {...(shouldAnimate && hoverable ? {
        whileHover: {
          scale: 1.02,
          y: -8,
          boxShadow: glowEffect 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(59, 130, 246, 0.3)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        },
        transition: SPRING.gentle
      } : {})}
      {...props}
    >
      {/* Glow effect */}
      {glowEffect && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

// Enhanced Input with focus animations
export const EnhancedInput = forwardRef(({
  label,
  error,
  className = '',
  variant = 'default',
  icon,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const { shouldAnimate } = useOptimizedAnimation();

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    if (props.onBlur) props.onBlur(e);
  }, [props]);

  const variants = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20',
    glass: 'border-white/30 bg-white/10 backdrop-blur-md focus:border-white/50 focus:ring-white/20',
    minimal: 'border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 bg-transparent'
  };

  return (
    <div className="relative">
      {label && (
        <motion.label
          className={`
            absolute left-3 transition-all duration-200 pointer-events-none
            ${isFocused || hasValue 
              ? 'top-0 text-xs text-blue-600 bg-white px-1 -translate-y-1/2' 
              : 'top-1/2 text-gray-500 -translate-y-1/2'
            }
          `}
          animate={{
            scale: isFocused || hasValue ? 0.85 : 1,
            y: isFocused || hasValue ? -20 : 0
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            focus:outline-none focus:ring-4 transform-gpu will-change-transform
            ${icon ? 'pl-10' : ''}
            ${variants[variant]}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...(shouldAnimate ? {
            whileFocus: {
              scale: 1.02,
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
            },
            transition: SPRING.quick
          } : {})}
          {...props}
        />
        
        {/* Focus indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: isFocused ? '100%' : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

// Enhanced Toggle Switch
export const EnhancedToggle = ({ 
  checked = false, 
  onChange, 
  label, 
  size = 'md',
  variant = 'default',
  disabled = false,
  className = ''
}) => {
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: { switch: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { switch: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { switch: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  };
  
  const variants = {
    default: checked ? 'bg-blue-600' : 'bg-gray-300',
    success: checked ? 'bg-green-600' : 'bg-gray-300',
    warning: checked ? 'bg-yellow-600' : 'bg-gray-300'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-3 text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      
      <motion.button
        type="button"
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200
          focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizes[size].switch}
          ${variants[variant]}
        `}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        {...(shouldAnimate ? {
          whileTap: { scale: 0.95 },
          transition: SPRING.quick
        } : {})}
      >
        <motion.span
          className={`
            inline-block bg-white rounded-full shadow-lg transform transition-transform duration-200
            ${sizes[size].thumb}
          `}
          animate={{
            x: checked ? sizes[size].translate.replace('translate-x-', '') : 0
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
};

export default {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedToggle
};