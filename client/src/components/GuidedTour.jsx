/**
 * Guided tour component for managing multi-step onboarding experiences
 * Orchestrates tutorial overlays and provides contextual guidance
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import TutorialOverlay from './TutorialOverlay';
import { useOnboarding } from '../hooks/useOnboarding';
import {
  enhancedScreenReader,
  liveRegions
} from '../utils/accessibilityEnhancements';
import {
  KEYS,
  ScreenReaderOnly
} from '../utils/accessibility';
import {
  isMobileDevice,
  getResponsiveTextClasses,
  triggerHapticFeedback
} from '../utils/mobileOptimization';

// Tour step definitions
const TOUR_STEPS = {
  dashboard: [
    {
      id: 'welcome',
      target: '[data-tour="dashboard-header"]',
      title: 'Welcome to Your Dashboard!',
      content: 'This is your personal dashboard where you can track your interview progress, view results, and access all features.',
      position: 'bottom',
      actions: ['next'],
      waitForElement: true
    },
    {
      id: 'navigation',
      target: '[data-tour="main-navigation"]',
      title: 'Navigation Menu',
      content: 'Use this navigation to access different sections: Dashboard, Interview Selection, Profile, and more.',
      position: 'bottom',
      actions: ['previous', 'next']
    },
    {
      id: 'interview-history',
      target: '[data-tour="interview-history"]',
      title: 'Interview History',
      content: 'Here you\'ll see your completed interviews, scores, and detailed feedback. Start your first interview to see results here!',
      position: 'top',
      actions: ['previous', 'next']
    },
    {
      id: 'start-interview',
      target: '[data-tour="start-interview-btn"]',
      title: 'Start Your First Interview',
      content: 'Ready to begin? Click here to choose from different interview types: MCQ, Coding, or Resume-based interviews.',
      position: 'top',
      actions: ['previous', 'next'],
      highlightPadding: 12,
      allowInteraction: true
    }
  ],
  
  interviewSelection: [
    {
      id: 'interview-types',
      target: '[data-tour="interview-options"]',
      title: 'Choose Your Interview Type',
      content: 'We offer three types of interviews. Each is designed to test different skills and provide comprehensive feedback.',
      position: 'bottom',
      actions: ['previous', 'next']
    },
    {
      id: 'mcq-interview',
      target: '[data-tour="mcq-option"]',
      title: 'MCQ Interviews',
      content: 'Multiple choice questions covering technical concepts, algorithms, and system design. Great for quick skill assessment.',
      position: 'right',
      actions: ['previous', 'next']
    },
    {
      id: 'coding-interview',
      target: '[data-tour="coding-option"]',
      title: 'Coding Interviews',
      content: 'Live coding challenges with an integrated editor. Practice algorithms, data structures, and problem-solving.',
      position: 'right',
      actions: ['previous', 'next']
    },
    {
      id: 'resume-interview',
      target: '[data-tour="resume-option"]',
      title: 'Resume-Based Interviews',
      content: 'Personalized questions based on your experience and projects. Upload your resume for tailored interview questions.',
      position: 'right',
      actions: ['previous', 'next']
    },
    {
      id: 'difficulty-selection',
      target: '[data-tour="difficulty-selector"]',
      title: 'Choose Difficulty Level',
      content: 'Select the appropriate difficulty level. Start with Beginner if you\'re new to technical interviews.',
      position: 'top',
      actions: ['previous', 'next']
    }
  ],
  
  interview: [
    {
      id: 'interview-interface',
      target: '[data-tour="interview-container"]',
      title: 'Interview Interface',
      content: 'This is your interview environment. Take your time to read questions carefully and provide thoughtful answers.',
      position: 'top',
      actions: ['next']
    },
    {
      id: 'question-navigation',
      target: '[data-tour="question-nav"]',
      title: 'Question Navigation',
      content: 'Navigate between questions using these controls. You can review and change answers before submitting.',
      position: 'bottom',
      actions: ['previous', 'next']
    },
    {
      id: 'timer',
      target: '[data-tour="timer"]',
      title: 'Interview Timer',
      content: 'Keep track of your remaining time. Don\'t worry if you don\'t finish - partial submissions are saved automatically.',
      position: 'bottom',
      actions: ['previous', 'next']
    },
    {
      id: 'help-features',
      target: '[data-tour="help-button"]',
      title: 'Need Help?',
      content: 'Access hints, documentation, or report issues using the help menu. We\'re here to support your learning journey.',
      position: 'left',
      actions: ['previous', 'next']
    }
  ]
};

const GuidedTour = ({ 
  tourType = 'dashboard',
  autoStart = false,
  onComplete,
  onSkip,
  customSteps = null
}) => {
  const { 
    updatePreferences
  } = useOnboarding();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isWaitingForElement, setIsWaitingForElement] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const elementWaitTimeoutRef = useRef(null);
  const tourStartTimeRef = useRef(null);

  // Initialize tour steps
  useEffect(() => {
    const steps = customSteps || TOUR_STEPS[tourType] || [];
    setTourSteps(steps);
    setCurrentStepIndex(0);
  }, [tourType, customSteps]);

  // Auto-start tour
  useEffect(() => {
    if (autoStart && tourSteps.length > 0 && !isActive) {
      startTour();
    }
  }, [autoStart, tourSteps, isActive]);

  // Wait for target elements
  useEffect(() => {
    if (!isActive || !tourSteps[currentStepIndex]) return;

    const currentStep = tourSteps[currentStepIndex];
    if (currentStep.waitForElement) {
      waitForElement(currentStep.target);
    }
  }, [isActive, currentStepIndex, tourSteps]);

  // Start the tour
  const startTour = useCallback(() => {
    if (tourSteps.length === 0) return;
    
    setIsActive(true);
    setCurrentStepIndex(0);
    tourStartTimeRef.current = Date.now();
    
    // Announce tour start
    enhancedScreenReader.announcePolite(
      `Starting guided tour: ${tourType}. ${tourSteps.length} steps total.`
    );
    
    // Add to live region for persistent announcement
    liveRegions.announce(
      `Guided tour started. Use arrow keys to navigate or press Escape to exit.`,
      'polite'
    );
    
    if (isMobileDevice()) {
      triggerHapticFeedback('success');
    }
  }, [tourSteps, tourType]);

  // Wait for element to appear
  const waitForElement = useCallback((selector) => {
    setIsWaitingForElement(true);
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        setIsWaitingForElement(false);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkElement()) return;

    // Set up polling
    const pollInterval = setInterval(() => {
      if (checkElement()) {
        clearInterval(pollInterval);
      }
    }, 100);

    // Timeout after 10 seconds
    elementWaitTimeoutRef.current = setTimeout(() => {
      clearInterval(pollInterval);
      setIsWaitingForElement(false);
      
      enhancedScreenReader.announcePolite(
        'Tutorial element not found. Continuing to next step.'
      );
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (elementWaitTimeoutRef.current) {
        clearTimeout(elementWaitTimeoutRef.current);
      }
    };
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      
      enhancedScreenReader.announcePolite(
        `Step ${currentStepIndex + 2} of ${tourSteps.length}`
      );
      
      if (isMobileDevice()) {
        triggerHapticFeedback('light');
      }
    } else {
      completeTour();
    }
  }, [currentStepIndex, tourSteps.length]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      
      enhancedScreenReader.announcePolite(
        `Step ${currentStepIndex} of ${tourSteps.length}`
      );
      
      if (isMobileDevice()) {
        triggerHapticFeedback('light');
      }
    }
  }, [currentStepIndex, tourSteps.length]);

  // Complete the tour
  const completeTour = useCallback(() => {
    const tourDuration = Date.now() - (tourStartTimeRef.current || Date.now());
    
    setIsActive(false);
    setCurrentStepIndex(0);
    
    // Track completion
    updatePreferences({
      [`${tourType}TourCompleted`]: true,
      [`${tourType}TourCompletedAt`]: new Date().toISOString(),
      [`${tourType}TourDuration`]: tourDuration
    });
    
    // Announce completion
    enhancedScreenReader.announcePolite(
      'Guided tour completed successfully! You can now explore the features on your own.'
    );
    
    liveRegions.announce(
      'Tour completed. All features are now available for interaction.',
      'polite'
    );
    
    if (isMobileDevice()) {
      triggerHapticFeedback('success');
    }
    
    onComplete?.({
      tourType,
      stepsCompleted: tourSteps.length,
      duration: tourDuration
    });
  }, [tourType, tourSteps.length, updatePreferences, onComplete]);

  // Skip the tour
  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    
    // Track skip
    updatePreferences({
      [`${tourType}TourSkipped`]: true,
      [`${tourType}TourSkippedAt`]: new Date().toISOString()
    });
    
    enhancedScreenReader.announcePolite('Tour skipped. You can restart it anytime from the help menu.');
    
    if (isMobileDevice()) {
      triggerHapticFeedback('warning');
    }
    
    onSkip?.({
      tourType,
      stepsCompleted: currentStepIndex,
      totalSteps: tourSteps.length
    });
  }, [tourType, currentStepIndex, tourSteps.length, updatePreferences, onSkip]);

  // Close tour
  const closeTour = useCallback(() => {
    skipTour();
  }, [skipTour]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      // Don't interfere with form inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case KEYS.ESCAPE:
          event.preventDefault();
          closeTour();
          break;
        case KEYS.ARROW_RIGHT:
        case KEYS.SPACE:
          event.preventDefault();
          nextStep();
          break;
        case KEYS.ARROW_LEFT:
          event.preventDefault();
          previousStep();
          break;
        case 'h':
        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Show help
            enhancedScreenReader.announcePolite(
              'Tour help: Use arrow keys or space to navigate, Escape to exit, Enter to interact with highlighted elements.'
            );
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, previousStep, closeTour]);

  // Don't render if no steps or not active
  if (!isActive || tourSteps.length === 0 || isWaitingForElement) {
    return isWaitingForElement ? (
      <div className="fixed top-4 right-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          <span className={getResponsiveTextClasses('sm', 'xs')}>Loading tour step...</span>
        </div>
      </div>
    ) : null;
  }

  const currentStep = tourSteps[currentStepIndex];
  if (!currentStep) return null;

  return (
    <>
      <TutorialOverlay
        isVisible={isActive}
        targetSelector={currentStep.target}
        title={currentStep.title}
        content={currentStep.content}
        position={currentStep.position || 'auto'}
        showArrow={currentStep.showArrow !== false}
        onNext={currentStepIndex < tourSteps.length - 1 ? nextStep : completeTour}
        onPrevious={currentStepIndex > 0 ? previousStep : null}
        onSkip={skipTour}
        onClose={closeTour}
        currentStep={currentStepIndex + 1}
        totalSteps={tourSteps.length}
        actions={currentStep.actions || ['next']}
        highlightPadding={currentStep.highlightPadding}
        spotlightRadius={currentStep.spotlightRadius}
        allowInteraction={currentStep.allowInteraction}
      />
      
      {/* Tour progress indicator */}
      <motion.div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[999] bg-white rounded-full shadow-lg px-4 py-2 border border-gray-200"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        <div className="flex items-center gap-2">
          <span className={`text-gray-600 ${getResponsiveTextClasses('sm', 'xs')}`}>
            Tour Progress:
          </span>
          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className={`text-gray-500 ${getResponsiveTextClasses('xs', 'xs')}`}>
            {currentStepIndex + 1}/{tourSteps.length}
          </span>
        </div>
      </motion.div>

      {/* Screen reader live region */}
      <ScreenReaderOnly>
        <div aria-live="polite" aria-atomic="false">
          {isActive && `Guided tour active. Step ${currentStepIndex + 1} of ${tourSteps.length}.`}
        </div>
      </ScreenReaderOnly>
    </>
  );
};

export default GuidedTour;