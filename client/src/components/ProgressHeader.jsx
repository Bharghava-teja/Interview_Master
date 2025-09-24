import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ProgressHeader = ({
  currentStage,
  stageProgress,
  EXAM_STAGES,
  progressPercentage,
  examStartTime,
  onStageClick,
  isStageAccessible,
  onReset,
  onExit,
  isFullscreen,
  violationCount
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - examStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [examStartTime]);

  // Format time
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get stage display info
  const getStageInfo = (stage) => {
    const stageNames = {
      [EXAM_STAGES.MCQ]: 'MCQ Section',
      [EXAM_STAGES.CODING]: 'Coding Section',
      [EXAM_STAGES.FEEDBACK]: 'Results & Feedback'
    };

    const stageIcons = {
      [EXAM_STAGES.MCQ]: '📝',
      [EXAM_STAGES.CODING]: '💻',
      [EXAM_STAGES.FEEDBACK]: '📊'
    };

    return {
      name: stageNames[stage] || stage,
      icon: stageIcons[stage] || '❓',
      isCompleted: stageProgress[stage]?.completed || false,
      isCurrent: currentStage === stage,
      isAccessible: isStageAccessible(stage)
    };
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-30 bg-white shadow-lg border-b border-gray-200"
    >
      <div className="px-6 py-4">
        {/* Top Row - Title and Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Technical Interview</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isFullscreen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isFullscreen ? '🟢 Fullscreen' : '🔴 Not Fullscreen'}
              </span>
              {violationCount > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠️ Violations: {violationCount}/2
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Time Elapsed</div>
              <div className="text-lg font-mono font-bold text-gray-800">
                {formatTime(timeElapsed)}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={onReset}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Reset Exam"
              >
                🔄 Reset
              </button>
              <button
                onClick={onExit}
                className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                title="Exit Exam"
              >
                🚪 Exit
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stage Navigation */}
        <div className="flex items-center justify-center space-x-8">
          {Object.values(EXAM_STAGES).map((stage, index) => {
            const stageInfo = getStageInfo(stage);
            const isLast = index === Object.values(EXAM_STAGES).length - 1;

            return (
              <div key={stage} className="flex items-center">
                {/* Stage Button */}
                <button
                  onClick={() => onStageClick(stage)}
                  disabled={!stageInfo.isAccessible}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    stageInfo.isCurrent
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                      : stageInfo.isCompleted
                      ? 'bg-green-100 border-2 border-green-500 text-green-700'
                      : stageInfo.isAccessible
                      ? 'bg-gray-100 border-2 border-gray-300 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl mb-1">{stageInfo.icon}</div>
                  <div className="text-xs font-medium text-center max-w-20">
                    {stageInfo.name}
                  </div>
                  {stageInfo.isCompleted && (
                    <div className="text-xs mt-1">✓</div>
                  )}
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    stageInfo.isCompleted ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressHeader;

