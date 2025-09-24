import { useState, useEffect, useCallback } from 'react';

const EXAM_STAGES = {
  MCQ: 'mcq',
  CODING: 'coding',
  FEEDBACK: 'feedback'
};

const STAGE_ORDER = [EXAM_STAGES.MCQ, EXAM_STAGES.CODING, EXAM_STAGES.FEEDBACK];

export const useExamProgress = (examId) => {
  const [currentStage, setCurrentStage] = useState(EXAM_STAGES.MCQ);
  const [stageProgress, setStageProgress] = useState({
    [EXAM_STAGES.MCQ]: { completed: false, data: null },
    [EXAM_STAGES.CODING]: { completed: false, data: null },
    [EXAM_STAGES.FEEDBACK]: { completed: false, data: null }
  });
  const [examStartTime, setExamStartTime] = useState(null);
  const [examConfig, setExamConfig] = useState({
    mcqTimeLimit: 30 * 60, // 30 minutes in seconds
    codingTimeLimit: 60 * 60, // 60 minutes in seconds
    mcqCategory: 'javascript',
    mcqDifficulty: 'medium'
  });

  // Load exam progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`exam_progress_${examId}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setStageProgress(parsed.stageProgress || stageProgress);
        setCurrentStage(parsed.currentStage || EXAM_STAGES.MCQ);
        setExamStartTime(parsed.examStartTime || Date.now());
        setExamConfig(parsed.examConfig || examConfig);
      } catch (error) {
        console.error('Failed to parse saved exam progress:', error);
        // Reset to default if corrupted
        setExamStartTime(Date.now());
      }
    } else {
      setExamStartTime(Date.now());
    }
  }, [examId]);

  // Save progress to localStorage
  const saveProgress = useCallback((stage, data) => {
    const newStageProgress = {
      ...stageProgress,
      [stage]: { completed: true, data, timestamp: Date.now() }
    };
    
    setStageProgress(newStageProgress);
    
    const progressData = {
      stageProgress: newStageProgress,
      currentStage,
      examStartTime,
      examConfig,
      lastSaved: Date.now()
    };
    
    localStorage.setItem(`exam_progress_${examId}`, JSON.stringify(progressData));
  }, [stageProgress, currentStage, examStartTime, examConfig, examId]);

  // Navigate to next stage
  const nextStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      const nextStageName = STAGE_ORDER[currentIndex + 1];
      setCurrentStage(nextStageName);
      
      // Update localStorage
      const progressData = {
        stageProgress,
        currentStage: nextStageName,
        examStartTime,
        examConfig,
        lastSaved: Date.now()
      };
      localStorage.setItem(`exam_progress_${examId}`, JSON.stringify(progressData));
    }
  }, [currentStage, stageProgress, examStartTime, examConfig, examId]);

  // Navigate to specific stage
  const goToStage = useCallback((stage) => {
    if (STAGE_ORDER.includes(stage)) {
      setCurrentStage(stage);
      
      const progressData = {
        stageProgress,
        currentStage: stage,
        examStartTime,
        examConfig,
        lastSaved: Date.now()
      };
      localStorage.setItem(`exam_progress_${examId}`, JSON.stringify(progressData));
    }
  }, [stageProgress, examStartTime, examConfig, examId]);

  // Check if stage is accessible
  const isStageAccessible = useCallback((stage) => {
    const stageIndex = STAGE_ORDER.indexOf(stage);
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    
    // Can only access current stage or previous completed stages
    return stageIndex <= currentIndex || stageProgress[stage]?.completed;
  }, [currentStage, stageProgress]);

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    const completedStages = Object.values(stageProgress).filter(stage => stage.completed).length;
    return Math.round((completedStages / STAGE_ORDER.length) * 100);
  }, [stageProgress]);

  // Reset exam progress
  const resetExam = useCallback(() => {
    const resetProgress = {
      stageProgress: {
        [EXAM_STAGES.MCQ]: { completed: false, data: null },
        [EXAM_STAGES.CODING]: { completed: false, data: null },
        [EXAM_STAGES.FEEDBACK]: { completed: false, data: null }
      },
      currentStage: EXAM_STAGES.MCQ,
      examStartTime: Date.now(),
      examConfig,
      lastSaved: Date.now()
    };
    
    setStageProgress(resetProgress.stageProgress);
    setCurrentStage(EXAM_STAGES.MCQ);
    setExamStartTime(Date.now());
    
    localStorage.setItem(`exam_progress_${examId}`, JSON.stringify(resetProgress));
  }, [examConfig, examId]);

  // Clear exam progress
  const clearExamProgress = useCallback(() => {
    localStorage.removeItem(`exam_progress_${examId}`);
    setStageProgress({
      [EXAM_STAGES.MCQ]: { completed: false, data: null },
      [EXAM_STAGES.CODING]: { completed: false, data: null },
      [EXAM_STAGES.FEEDBACK]: { completed: false, data: null }
    });
    setCurrentStage(EXAM_STAGES.MCQ);
    setExamStartTime(Date.now());
  }, [examId]);

  return {
    currentStage,
    stageProgress,
    examStartTime,
    examConfig,
    EXAM_STAGES,
    STAGE_ORDER,
    saveProgress,
    nextStage,
    goToStage,
    isStageAccessible,
    getProgressPercentage,
    resetExam,
    clearExamProgress,
    setExamConfig
  };
};

