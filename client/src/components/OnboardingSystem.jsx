/**
 * Comprehensive onboarding system with interactive tutorials and practice mode
 * Provides guided tours, feature introductions, and hands-on practice for first-time users
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  enhancedScreenReader,
  enhancedFocusManagement
} from '../utils/accessibilityEnhancements';
import {
  KEYS,
  AccessibleButton
} from '../utils/accessibility';
import {
  isMobileDevice,
  getTouchButtonClasses,
  getResponsiveTextClasses,
  getResponsiveSpacing,
  triggerHapticFeedback
} from '../utils/mobileOptimization';

const OnboardingSystem = ({ isVisible, onComplete, onSkip }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [userPreferences, setUserPreferences] = useState({
    showAnimations: true,
    autoAdvance: false,
    skipIntroduction: false
  });
  const modalRef = useRef(null);
  const focusTrapRef = useRef(null);

  // Onboarding steps configuration
  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Interview Master! 🎉',
      content: 'Get ready to ace your next interview with our comprehensive practice platform.',
      type: 'introduction',
      duration: 3000,
      actions: ['next'],
      highlight: null
    },
    {
      id: 'dashboard-overview',
      title: 'Your Dashboard',
      content: 'This is your command center. Here you can view your interview history, track progress, and start new practice sessions.',
      type: 'feature-tour',
      duration: 4000,
      actions: ['next', 'skip'],
      highlight: '.dashboard-container',
      position: 'bottom'
    },
    {
      id: 'interview-types',
      title: 'Three Interview Types',
      content: 'Choose from MCQ questions, coding challenges, or resume-based interviews. Each type offers unique practice opportunities.',
      type: 'feature-tour',
      duration: 5000,
      actions: ['next', 'practice'],
      highlight: '.interview-selection',
      position: 'top'
    },
    {
      id: 'mock-interview-practice',
      title: 'Mock Interviews',
      content: 'Practice with realistic interview scenarios tailored to your industry and experience level.',
      type: 'interactive-demo',
      duration: 6000,
      actions: ['try-now', 'next'],
      highlight: '.mock-interview-option',
      demoComponent: 'MockInterviewDemo'
    },
    {
      id: 'resume-review-practice',
      title: 'Resume Reviews',
      content: 'Get detailed feedback on your resume with industry-specific recommendations and improvements.',
      type: 'interactive-demo',
      duration: 6000,
      actions: ['try-now', 'next'],
      highlight: '.resume-option',
      demoComponent: 'ResumeReviewDemo'
    },
    {
      id: 'security-features',
      title: 'Anti-Cheating Security',
      content: 'Our platform includes fullscreen mode, clipboard monitoring, and other security features to simulate real interview conditions.',
      type: 'feature-explanation',
      duration: 4000,
      actions: ['understand', 'next'],
      highlight: null
    },
    {
      id: 'accessibility-features',
      title: 'Accessibility Support',
      content: 'We support screen readers, keyboard navigation, and other accessibility features to ensure everyone can practice effectively.',
      type: 'feature-explanation',
      duration: 4000,
      actions: ['next'],
      highlight: null
    },
    {
      id: 'practice-mode',
      title: 'Ready to Practice?',
      content: 'Start with our guided practice mode or jump straight into a full interview simulation.',
      type: 'call-to-action',
      duration: 0,
      actions: ['start-practice', 'start-interview', 'finish'],
      highlight: null
    }
  ];

  // Initialize focus trap and accessibility
  useEffect(() => {
    if (isVisible && modalRef.current) {
      focusTrapRef.current = enhancedFocusManagement.createFocusTrap(
        modalRef.current,
        {
          initialFocus: '[data-autofocus]',
          fallbackFocus: modalRef.current,
          escapeDeactivates: true,
          onDeactivate: onSkip
        }
      );
      focusTrapRef.current.activate();
      
      // Announce onboarding start
      enhancedScreenReader.announcePolite(
        `Welcome to Interview Master onboarding. Step ${currentStep + 1} of ${onboardingSteps.length}.`
      );
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, [isVisible, currentStep, onSkip, onboardingSteps.length]);

  // Auto-advance functionality
  useEffect(() => {
    if (isPlaying && userPreferences.autoAdvance && currentStep < onboardingSteps.length - 1) {
      const step = onboardingSteps[currentStep];
      if (step.duration > 0) {
        const timer = setTimeout(() => {
          handleNext();
        }, step.duration);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStep, isPlaying, userPreferences.autoAdvance]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible) return;

      switch (event.key) {
        case KEYS.ESCAPE:
          event.preventDefault();
          onSkip();
          break;
        case KEYS.ARROW_RIGHT:
        case KEYS.SPACE:
          event.preventDefault();
          handleNext();
          break;
        case KEYS.ARROW_LEFT:
          event.preventDefault();
          handlePrevious();
          break;
        case 'p':
        case 'P':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            togglePlayPause();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Announce step change
      enhancedScreenReader.announcePolite(
        `Step ${nextStep + 1} of ${onboardingSteps.length}: ${onboardingSteps[nextStep].title}`
      );
      
      // Haptic feedback for mobile
      if (isMobileDevice()) {
        triggerHapticFeedback('light');
      }
    } else {
      handleComplete();
    }
  }, [currentStep, onboardingSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Announce step change
      enhancedScreenReader.announcePolite(
        `Step ${prevStep + 1} of ${onboardingSteps.length}: ${onboardingSteps[prevStep].title}`
      );
      
      // Haptic feedback for mobile
      if (isMobileDevice()) {
        triggerHapticFeedback('light');
      }
    }
  }, [currentStep, onboardingSteps]);

  const handleComplete = useCallback(() => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completed_date', new Date().toISOString());
    
    // Announce completion
    enhancedScreenReader.announcePolite('Onboarding completed successfully!');
    
    onComplete();
  }, [onComplete]);

  const handleStartPractice = useCallback(() => {
    setShowPracticeMode(true);
    enhancedScreenReader.announcePolite('Starting practice mode');
  }, []);

  const handleStartInterview = useCallback(() => {
    handleComplete();
    navigate('/interview-selection');
  }, [handleComplete, navigate]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    enhancedScreenReader.announcePolite(isPlaying ? 'Onboarding paused' : 'Onboarding resumed');
  }, [isPlaying]);

  const currentStepData = onboardingSteps[currentStep];
  const progressPercentage = ((currentStep + 1) / onboardingSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <motion.div
          ref={modalRef}
          className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
            isMobileDevice() ? 'mx-2' : 'mx-4'
          }`}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 
                id="onboarding-title"
                className={`font-bold ${getResponsiveTextClasses('xl', 'lg')}`}
              >
                {currentStepData.title}
              </h1>
              <div className="flex items-center gap-2">
                <AccessibleButton
                  onClick={togglePlayPause}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  ariaLabel={isPlaying ? 'Pause onboarding' : 'Resume onboarding'}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </AccessibleButton>
                <AccessibleButton
                  onClick={onSkip}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  ariaLabel="Skip onboarding"
                >
                  ✕
                </AccessibleButton>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2 opacity-90">
              <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>

          {/* Content */}
          <div className={`p-6 ${getResponsiveSpacing('base')}`}>
            <p 
              id="onboarding-description"
              className={`text-gray-700 mb-6 leading-relaxed ${getResponsiveTextClasses('lg', 'base')}`}
            >
              {currentStepData.content}
            </p>

            {/* Interactive Demo Components */}
            {currentStepData.type === 'interactive-demo' && (
              <div className="mb-6">
                {currentStepData.demoComponent === 'MCQDemo' && <MCQDemo />}
                {currentStepData.demoComponent === 'CodingDemo' && <CodingDemo />}
              </div>
            )}

            {/* Feature Highlights */}
            {currentStepData.type === 'feature-tour' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Pro Tip</h3>
                <p className="text-blue-700 text-sm">
                  {currentStepData.id === 'dashboard-overview' && 
                    'Use keyboard shortcuts: Press Tab to navigate, Enter to select, and Escape to go back.'}
                  {currentStepData.id === 'interview-types' && 
                    'Start with MCQ questions if you\'re new to technical interviews, then progress to coding challenges.'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`p-6 bg-gray-50 border-t flex flex-wrap gap-3 justify-between ${getResponsiveSpacing('sm')}`}>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <AccessibleButton
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  ariaLabel="Go to previous step"
                >
                  ← Previous
                </AccessibleButton>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {currentStepData.actions.includes('start-practice') && (
                <AccessibleButton
                  onClick={handleStartPractice}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                    getTouchButtonClasses()
                  }`}
                  data-autofocus
                >
                  🎯 Start Practice
                </AccessibleButton>
              )}
              
              {currentStepData.actions.includes('start-interview') && (
                <AccessibleButton
                  onClick={handleStartInterview}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    getTouchButtonClasses()
                  }`}
                >
                  🚀 Start Interview
                </AccessibleButton>
              )}
              
              {currentStepData.actions.includes('try-now') && (
                <AccessibleButton
                  onClick={() => {
                    if (currentStepData.id === 'mcq-practice') {
                      navigate('/mcq-interview');
                    } else if (currentStepData.id === 'coding-practice') {
                      navigate('/coding-interview');
                    }
                  }}
                  className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                    getTouchButtonClasses()
                  }`}
                >
                  Try Now
                </AccessibleButton>
              )}
              
              {currentStepData.actions.includes('next') && (
                <AccessibleButton
                  onClick={handleNext}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    getTouchButtonClasses()
                  }`}
                  data-autofocus={currentStep === 0}
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Next →'}
                </AccessibleButton>
              )}
              
              {currentStepData.actions.includes('finish') && (
                <AccessibleButton
                  onClick={handleComplete}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                    getTouchButtonClasses()
                  }`}
                  data-autofocus
                >
                  🎉 Get Started!
                </AccessibleButton>
              )}
              
              {currentStepData.actions.includes('skip') && (
                <AccessibleButton
                  onClick={onSkip}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip Tour
                </AccessibleButton>
              )}
            </div>
          </div>
        </motion.div>

        {/* Practice Mode Modal */}
        <AnimatePresence>
          {showPracticeMode && (
            <PracticeModeModal
              onClose={() => setShowPracticeMode(false)}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

// Mini demo components for interactive tutorials
const MCQDemo = () => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <h4 className="font-semibold mb-3">Sample MCQ Question:</h4>
      <p className="mb-3">What is the time complexity of binary search?</p>
      <div className="space-y-2">
        {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((option, index) => (
          <label key={index} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="demo-mcq"
              value={index}
              checked={selectedAnswer === index}
              onChange={() => setSelectedAnswer(index)}
              className="text-blue-600"
            />
            <span className={selectedAnswer === index ? 'font-semibold' : ''}>
              {option}
            </span>
            {selectedAnswer === index && index === 1 && (
              <span className="text-green-600 text-sm">✓ Correct!</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

const CodingDemo = () => {
  const [code, setCode] = useState('function fibonacci(n) {\n  // Your code here\n}');
  
  return (
    <div className="border rounded-lg p-4 bg-green-50">
      <h4 className="font-semibold mb-3">Sample Coding Challenge:</h4>
      <p className="mb-3">Write a function to calculate the nth Fibonacci number:</p>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-20 p-2 border rounded font-mono text-sm"
        placeholder="Write your code here..."
      />
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
          ▶️ Run Code
        </button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          🧪 Test
        </button>
      </div>
    </div>
  );
};

// Practice Mode Modal Component
const PracticeModeModal = ({ onClose, onComplete }) => {
  const navigate = useNavigate();
  
  
  const practiceOptions = [
    {
      id: 'guided-mcq',
      title: '🎯 Guided MCQ Practice',
      description: 'Start with easy questions and get instant explanations',
      duration: '10-15 minutes',
      route: '/mcq-interview?mode=practice'
    },
    {
      id: 'coding-basics',
      title: '💻 Basic Coding Challenges',
      description: 'Simple programming problems with step-by-step hints',
      duration: '15-20 minutes',
      route: '/coding-interview?mode=practice'
    },
    {
      id: 'mock-interview',
      title: '🎭 Mini Mock Interview',
      description: 'Short 5-minute interview simulation',
      duration: '5-10 minutes',
      route: '/interview-selection?mode=mini'
    }
  ];
  
  const handleStartPractice = (option) => {
    onComplete();
    navigate(option.route);
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Practice Mode</h2>
        <div className="space-y-3 mb-6">
          {practiceOptions.map((option) => (
            <motion.button
              key={option.id}
              onClick={() => handleStartPractice(option)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="font-semibold text-lg mb-1">{option.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{option.description}</p>
              <span className="text-blue-600 text-xs font-medium">{option.duration}</span>
            </motion.button>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <AccessibleButton
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back to Tour
          </AccessibleButton>
          <AccessibleButton
            onClick={() => {
              onComplete();
              navigate('/interview-selection');
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Skip to Full Interview
          </AccessibleButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingSystem;