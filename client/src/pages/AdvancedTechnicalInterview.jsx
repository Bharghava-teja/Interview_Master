import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useExamProgress } from '../hooks/useExamProgress';
import { useExamSecurity } from '../hooks/useExamSecurity';
import AdvancedMCQSection from '../components/AdvancedMCQSection';
import AdvancedCodingSection from '../components/AdvancedCodingSection';
import AdvancedFeedbackSection from '../components/AdvancedFeedbackSection';
import SecurityWarningModal from '../components/SecurityWarningModal';
import ProgressHeader from '../components/ProgressHeader';
import {
  isMobileDevice,
  isTabletDevice,
  getTouchButtonClasses,
  getResponsiveTextClasses,
  getResponsiveSpacing,
  triggerHapticFeedback,
  getMobileModalClasses
} from '../utils/mobileOptimization';

const AdvancedTechnicalInterview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [examId] = useState(`exam_${user?.id}_${Date.now()}`);
  
  // Exam progress management
  const {
    currentStage,
    stageProgress,
    examStartTime,
    examConfig,
    EXAM_STAGES,
    saveProgress,
    nextStage,
    goToStage,
    isStageAccessible,
    getProgressPercentage,
    resetExam,
    clearExamProgress
  } = useExamProgress(examId);

  // Security management
  const {
    warningVisible,
    hideWarning,
    getViolationCount,
    getViolationHistory,
    isFullscreen,
    requestFullscreen,
    checkFullscreen
  } = useExamSecurity({
    onFirstWarning: (type, details) => {
      console.warn('First security violation:', type, details);
    },
    onSecondInfraction: async (type, details) => {
      console.error('Second security violation - auto-submitting:', type, details);
      await handleAutoSubmit(type, details);
    },
    onViolationLog: (violation) => {
      // Log violation to backend
      console.log('Security violation logged:', violation);
    },
    examId
  });

  // Exam data state
  const [examData, setExamData] = useState({
    examStartTime: Date.now(),
    mcqData: null,
    codingData: null,
    securityViolations: []
  });

  // Request fullscreen on component mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        await requestFullscreen();
      } catch (error) {
        console.warn('Failed to enter fullscreen:', error);
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(enterFullscreen, 100);
    return () => clearTimeout(timer);
  }, [requestFullscreen]);

  // Periodic fullscreen check
  useEffect(() => {
    const interval = setInterval(() => {
      if (!checkFullscreen()) {
        console.warn('Fullscreen lost, attempting to restore...');
        requestFullscreen();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [checkFullscreen, requestFullscreen]);

  // Handle MCQ completion
  const handleMCQComplete = useCallback((mcqData) => {
    setExamData(prev => ({
      ...prev,
      mcqData: {
        ...mcqData,
        completedAt: new Date().toISOString()
      }
    }));

    saveProgress(EXAM_STAGES.MCQ, mcqData);
    nextStage();
  }, [saveProgress, nextStage, EXAM_STAGES.MCQ]);

  // Handle coding completion
  const handleCodingComplete = useCallback((codingData) => {
    setExamData(prev => ({
      ...prev,
      codingData: {
        ...codingData,
        completedAt: new Date().toISOString()
      }
    }));

    saveProgress(EXAM_STAGES.CODING, codingData);
    nextStage();
  }, [saveProgress, nextStage, EXAM_STAGES.CODING]);

  // Handle feedback completion
  const handleFeedbackComplete = useCallback(() => {
    // Exam completed, redirect to dashboard
    clearExamProgress();
    navigate('/dashboard');
  }, [clearExamProgress, navigate]);

  // Handle auto-submit due to security violations
  const handleAutoSubmit = useCallback(async (violationType, violationDetails) => {
    try {
      // Add security note to exam data
      setExamData(prev => ({
        ...prev,
        securityViolations: [
          ...prev.securityViolations,
          {
            type: violationType,
            details: violationDetails,
            timestamp: new Date().toISOString(),
            action: 'auto_submit'
          }
        ],
        autoSubmitted: true,
        autoSubmitReason: `Multiple security violations detected: ${violationType}`
      }));

      // Force move to feedback stage
      saveProgress(EXAM_STAGES.FEEDBACK, { autoSubmitted: true });
      
      // Show warning to user
      alert('Your exam has been automatically submitted due to multiple security violations. You will receive a report with details.');
      
    } catch (error) {
      console.error('Error during auto-submit:', error);
    }
  }, [saveProgress, EXAM_STAGES.FEEDBACK]);

  // Save progress for current stage
  const handleProgressSave = useCallback((stage, data) => {
    saveProgress(stage, data);
  }, [saveProgress]);

  // Handle stage navigation
  const handleStageNavigation = useCallback((stage) => {
    if (isStageAccessible(stage)) {
      goToStage(stage);
    }
  }, [goToStage, isStageAccessible]);

  // Get current stage component
  const renderCurrentStage = () => {
    switch (currentStage) {
      case EXAM_STAGES.MCQ:
        return (
          <AdvancedMCQSection
            onComplete={handleMCQComplete}
            onProgressSave={(data) => handleProgressSave(EXAM_STAGES.MCQ, data)}
            initialData={stageProgress[EXAM_STAGES.MCQ]?.data}
            examConfig={examConfig}
          />
        );

      case EXAM_STAGES.CODING:
        return (
          <AdvancedCodingSection
            onComplete={handleCodingComplete}
            onProgressSave={(data) => handleProgressSave(EXAM_STAGES.CODING, data)}
            initialData={stageProgress[EXAM_STAGES.CODING]?.data}
            examConfig={examConfig}
          />
        );

      case EXAM_STAGES.FEEDBACK:
        return (
          <AdvancedFeedbackSection
            examData={examData}
            onComplete={handleFeedbackComplete}
            examConfig={examConfig}
          />
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Invalid stage. Please refresh the page.</p>
          </div>
        );
    }
  };

  // Handle exam reset
  const handleResetExam = useCallback(() => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset your exam? This will clear all progress and start over.'
    );
    
    if (confirmReset) {
      resetExam();
      setExamData({
        examStartTime: Date.now(),
        mcqData: null,
        codingData: null,
        securityViolations: []
      });
    }
  }, [resetExam]);

  // Handle exit exam
  const handleExitExam = useCallback(() => {
    const confirmExit = window.confirm(
      'Are you sure you want to exit the exam? Your progress will be saved, but you may lose some time.'
    );
    
    if (confirmExit) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Check if exam is in progress
  const isExamInProgress = currentStage !== EXAM_STAGES.FEEDBACK;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Security Warning Modal */}
      <SecurityWarningModal
        isVisible={warningVisible}
        onClose={hideWarning}
        violationCount={getViolationCount()}
        violationHistory={getViolationHistory()}
      />

      {/* Progress Header */}
      <ProgressHeader
        currentStage={currentStage}
        stageProgress={stageProgress}
        EXAM_STAGES={EXAM_STAGES}
        progressPercentage={getProgressPercentage()}
        examStartTime={examStartTime}
        onStageClick={handleStageNavigation}
        isStageAccessible={isStageAccessible}
        onReset={handleResetExam}
        onExit={handleExitExam}
        isFullscreen={isFullscreen}
        violationCount={getViolationCount()}
      />

      {/* Main Content */}
      <div className={`${getResponsiveSpacing('pt-20', 'pt-16')}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentStage()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fullscreen Warning */}
      {!isFullscreen && isExamInProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className={`bg-white rounded-xl ${getResponsiveSpacing('p-8', 'p-6')} text-center ${getMobileModalClasses()}`}>
            <div className={`${getResponsiveTextClasses('text-2xl', 'text-xl')} font-bold text-red-600 mb-4`}>⚠️ Fullscreen Required</div>
            <p className={`text-gray-600 ${getResponsiveSpacing('mb-6', 'mb-4')} ${getResponsiveTextClasses('text-base', 'text-sm')}`}>
              This exam must be taken in fullscreen mode for security reasons.
            </p>
            <button
              onClick={() => {
                triggerHapticFeedback();
                requestFullscreen();
              }}
              className={`${getTouchButtonClasses()} bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors`}
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Security Violation Counter */}
      {getViolationCount() > 0 && (
        <div className={`fixed ${getResponsiveSpacing('bottom-4 right-4', 'bottom-2 right-2')} bg-red-600 text-white ${getResponsiveSpacing('px-4 py-2', 'px-3 py-1')} rounded-lg shadow-lg z-40`}>
          <div className={`${getResponsiveTextClasses('text-sm', 'text-xs')} font-medium`}>
            Security Violations: {getViolationCount()}/2
          </div>
          <div className={`${getResponsiveTextClasses('text-xs', 'text-xs')} opacity-75`}>
            Next violation will auto-submit
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTechnicalInterview;

