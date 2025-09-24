/**
 * Tutorial overlay component for highlighting specific page elements
 * Provides contextual guidance and interactive tutorials with spotlight effects
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  enhancedScreenReader,
  enhancedFocusManagement
} from '../utils/accessibilityEnhancements';
import {
  KEYS,
  AccessibleButton,
  ScreenReaderOnly
} from '../utils/accessibility';
import {
  isMobileDevice,
  getTouchButtonClasses,
  getResponsiveTextClasses,
  triggerHapticFeedback
} from '../utils/mobileOptimization';

const TutorialOverlay = ({
  isVisible,
  targetSelector,
  title,
  content,
  position = 'auto', // 'top', 'bottom', 'left', 'right', 'auto'
  showArrow = true,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  currentStep = 1,
  totalSteps = 1,
  actions = ['next'],
  highlightPadding = 8,
  spotlightRadius = 8,
  allowInteraction = false
}) => {
  const [targetElement, setTargetElement] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [calculatedPosition, setCalculatedPosition] = useState(position);
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);
  const focusTrapRef = useRef(null);

  // Find and track target element
  useEffect(() => {
    if (!isVisible || !targetSelector) return;

    const findTarget = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setTargetElement(element);
        updateTargetRect(element);
      }
    };

    // Initial find
    findTarget();

    // Set up observer for dynamic content
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Handle window resize
    const handleResize = () => {
      if (targetElement) {
        updateTargetRect(targetElement);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isVisible, targetSelector, targetElement]);

  // Update target element rectangle
  const updateTargetRect = useCallback((element) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const targetRect = {
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + scrollY,
      right: rect.right + scrollX,
      centerX: rect.left + scrollX + rect.width / 2,
      centerY: rect.top + scrollY + rect.height / 2
    };

    setTargetRect(targetRect);
  }, []);

  // Calculate tooltip position
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    const spacing = 16;
    let newPosition = position;
    let x = 0;
    let y = 0;

    // Auto-calculate position if needed
    if (position === 'auto') {
      const spaceTop = targetRect.top - scrollY;
      const spaceBottom = viewportHeight - (targetRect.bottom - scrollY);
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      // Choose position with most space
      if (spaceBottom >= tooltipRect.height + spacing) {
        newPosition = 'bottom';
      } else if (spaceTop >= tooltipRect.height + spacing) {
        newPosition = 'top';
      } else if (spaceRight >= tooltipRect.width + spacing) {
        newPosition = 'right';
      } else if (spaceLeft >= tooltipRect.width + spacing) {
        newPosition = 'left';
      } else {
        newPosition = 'bottom'; // Fallback
      }
    }

    // Calculate position based on determined placement
    switch (newPosition) {
      case 'top':
        x = targetRect.centerX - tooltipRect.width / 2;
        y = targetRect.top - tooltipRect.height - spacing;
        break;
      case 'bottom':
        x = targetRect.centerX - tooltipRect.width / 2;
        y = targetRect.bottom + spacing;
        break;
      case 'left':
        x = targetRect.left - tooltipRect.width - spacing;
        y = targetRect.centerY - tooltipRect.height / 2;
        break;
      case 'right':
        x = targetRect.right + spacing;
        y = targetRect.centerY - tooltipRect.height / 2;
        break;
      default:
        x = targetRect.centerX - tooltipRect.width / 2;
        y = targetRect.bottom + spacing;
    }

    // Keep tooltip within viewport bounds
    x = Math.max(spacing, Math.min(x, viewportWidth - tooltipRect.width - spacing));
    y = Math.max(spacing, Math.min(y, viewportHeight - tooltipRect.height - spacing));

    setTooltipPosition({ x, y });
    setCalculatedPosition(newPosition);
  }, [targetRect, position]);

  // Set up focus trap
  useEffect(() => {
    if (isVisible && overlayRef.current) {
      focusTrapRef.current = enhancedFocusManagement.createFocusTrap(
        overlayRef.current,
        {
          initialFocus: '[data-autofocus]',
          fallbackFocus: overlayRef.current,
          escapeDeactivates: true,
          onDeactivate: onClose
        }
      );
      focusTrapRef.current.activate();

      // Announce tutorial step
      enhancedScreenReader.announcePolite(
        `Tutorial step ${currentStep} of ${totalSteps}: ${title}`
      );
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, [isVisible, currentStep, totalSteps, title, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case KEYS.ESCAPE:
          event.preventDefault();
          onClose?.();
          break;
        case KEYS.ARROW_RIGHT:
        case KEYS.SPACE:
          if (onNext) {
            event.preventDefault();
            onNext();
          }
          break;
        case KEYS.ARROW_LEFT:
          if (onPrevious) {
            event.preventDefault();
            onPrevious();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onNext, onPrevious, onClose]);

  // Handle target element interaction
  const handleTargetClick = useCallback((event) => {
    if (!allowInteraction) {
      event.preventDefault();
      event.stopPropagation();
      
      // Provide feedback
      enhancedScreenReader.announcePolite(
        'This element is highlighted for tutorial purposes. Complete the tutorial step to interact with it.'
      );
      
      if (isMobileDevice()) {
        triggerHapticFeedback('warning');
      }
    }
  }, [allowInteraction]);

  // Add click handler to target element
  useEffect(() => {
    if (targetElement && !allowInteraction) {
      targetElement.addEventListener('click', handleTargetClick, true);
      return () => {
        targetElement.removeEventListener('click', handleTargetClick, true);
      };
    }
  }, [targetElement, allowInteraction, handleTargetClick]);

  if (!isVisible || !targetRect) return null;

  const spotlightStyle = {
    clipPath: `polygon(
      0% 0%,
      0% 100%,
      ${targetRect.left - highlightPadding}px 100%,
      ${targetRect.left - highlightPadding}px ${targetRect.top - highlightPadding}px,
      ${targetRect.right + highlightPadding}px ${targetRect.top - highlightPadding}px,
      ${targetRect.right + highlightPadding}px ${targetRect.bottom + highlightPadding}px,
      ${targetRect.left - highlightPadding}px ${targetRect.bottom + highlightPadding}px,
      ${targetRect.left - highlightPadding}px 100%,
      100% 100%,
      100% 0%
    )`
  };

  const highlightStyle = {
    position: 'absolute',
    top: targetRect.top - highlightPadding,
    left: targetRect.left - highlightPadding,
    width: targetRect.width + highlightPadding * 2,
    height: targetRect.height + highlightPadding * 2,
    borderRadius: spotlightRadius,
    border: '3px solid #3b82f6',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
    pointerEvents: allowInteraction ? 'none' : 'auto',
    zIndex: 1001
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0 border-solid';
    const arrowSize = 8;
    
    switch (calculatedPosition) {
      case 'top':
        return `${baseClasses} border-l-${arrowSize} border-r-${arrowSize} border-t-${arrowSize} border-l-transparent border-r-transparent border-t-white top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-${arrowSize} border-r-${arrowSize} border-b-${arrowSize} border-l-transparent border-r-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-${arrowSize} border-b-${arrowSize} border-l-${arrowSize} border-t-transparent border-b-transparent border-l-white left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-${arrowSize} border-b-${arrowSize} border-r-${arrowSize} border-t-transparent border-b-transparent border-r-white right-full top-1/2 transform -translate-y-1/2`;
      default:
        return '';
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[1000] pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-content"
      >
        {/* Backdrop with spotlight effect */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={spotlightStyle}
        />

        {/* Highlight border around target */}
        <motion.div
          style={highlightStyle}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Pulsing animation */}
          <motion.div
            className="absolute inset-0 border-2 border-blue-400 rounded-lg"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm z-[1002]"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Arrow */}
          {showArrow && (
            <div className={getArrowClasses()} />
          )}

          {/* Content */}
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 
                id="tutorial-title"
                className={`font-semibold text-gray-800 ${getResponsiveTextClasses('lg', 'base')}`}
              >
                {title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {currentStep}/{totalSteps}
                </span>
                <AccessibleButton
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  ariaLabel="Close tutorial"
                >
                  ✕
                </AccessibleButton>
              </div>
            </div>

            {/* Content */}
            <p 
              id="tutorial-content"
              className={`text-gray-600 mb-4 leading-relaxed ${getResponsiveTextClasses('base', 'sm')}`}
            >
              {content}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <div>
                {actions.includes('previous') && onPrevious && (
                  <AccessibleButton
                    onClick={onPrevious}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                    ariaLabel="Previous step"
                  >
                    ← Previous
                  </AccessibleButton>
                )}
              </div>
              
              <div className="flex gap-2">
                {actions.includes('skip') && onSkip && (
                  <AccessibleButton
                    onClick={onSkip}
                    className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Skip
                  </AccessibleButton>
                )}
                
                {actions.includes('next') && onNext && (
                  <AccessibleButton
                    onClick={onNext}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm ${
                      getTouchButtonClasses()
                    }`}
                    data-autofocus
                  >
                    {currentStep === totalSteps ? 'Finish' : 'Next →'}
                  </AccessibleButton>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Screen reader announcements */}
        <ScreenReaderOnly>
          <div aria-live="polite" aria-atomic="true">
            Tutorial step {currentStep} of {totalSteps}. {title}. {content}
            {!allowInteraction && ' The highlighted element is for demonstration only.'}
          </div>
        </ScreenReaderOnly>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default TutorialOverlay;