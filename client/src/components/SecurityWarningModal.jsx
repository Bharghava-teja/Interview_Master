import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SecurityWarningModal = ({
  isVisible,
  onClose,
  violationCount,
  violationHistory,
  warningDetails,
  isAutoSubmit = false
}) => {
  if (!isVisible) return null;

  // Format countdown display
  const formatCountdown = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    return seconds;
  };

  const getViolationIcon = (type) => {
    const icons = {
      'exited_fullscreen': '🖥️',
      'window_blur': '🪟',
      'tab_hidden': '📑',
      'keyboard_shortcut': '⌨️',
      'right_click': '🖱️',
      'text_selection': '📝',
      'drag_drop': '📁',
      'copy_attempt': '📋',
      'paste_attempt': '📋',
      'devtools_opened': '🔧',
      'escape_key': '⌨️',
      'function_key': '⌨️',
      'fullscreen_lost': '🖥️',
      'fullscreen_blocked': '🚫'
    };
    return icons[type] || '⚠️';
  };

  const getViolationDescription = (type) => {
    const descriptions = {
      'exited_fullscreen': 'Exited fullscreen mode',
      'window_blur': 'Switched to another window or application',
      'tab_hidden': 'Switched to another browser tab',
      'keyboard_shortcut': 'Attempted to use keyboard shortcuts',
      'right_click': 'Attempted to right-click',
      'text_selection': 'Attempted to select text',
      'drag_drop': 'Attempted to drag and drop',
      'copy_attempt': 'Attempted to copy content',
      'paste_attempt': 'Attempted to paste content',
      'devtools_opened': 'Developer tools detected',
      'escape_key': 'Pressed Escape key',
      'function_key': 'Pressed function key',
      'fullscreen_lost': 'Fullscreen mode was lost',
      'fullscreen_blocked': 'Fullscreen access was blocked'
    };
    return descriptions[type] || 'Security violation detected';
  };

  const getViolationSeverity = (type) => {
    const highSeverity = ['exited_fullscreen', 'devtools_opened', 'fullscreen_lost'];
    const mediumSeverity = ['window_blur', 'tab_hidden', 'keyboard_shortcut'];
    
    if (highSeverity.includes(type)) return 'high';
    if (mediumSeverity.includes(type)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">⚠️</div>
                  <div>
                    <h2 className="text-xl font-bold text-red-800">Security Warning</h2>
                    <p className="text-red-600 text-sm">
                      {violationCount === 1 
                        ? 'First security violation detected' 
                        : 'Multiple security violations detected'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Warning/Auto-Submit Message */}
              <div className="mb-6">
                {isAutoSubmit ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-red-600 text-xl">🚨</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-800 mb-2">
                          Interview Auto-Submit in Progress
                        </h3>
                        <p className="text-red-700 text-sm mb-3">
                          {warningDetails?.message || 'Interview is being automatically submitted due to security violations.'}
                        </p>
                        {warningDetails?.countdown && (
                          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="text-red-600 text-2xl font-bold">
                                {formatCountdown(warningDetails.countdown)}
                              </div>
                              <div className="text-red-600 text-sm">
                                seconds remaining
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-yellow-600 text-xl">⚠️</div>
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-2">
                          {warningDetails?.title || (violationCount === 1 ? 'First Warning' : 'Final Warning')}
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          {warningDetails?.message || 
                            (violationCount === 1 
                              ? 'This is your first security violation. Please ensure you remain in fullscreen mode and do not attempt to switch windows, tabs, or use restricted keyboard shortcuts.'
                              : 'This is your second security violation. The next violation will result in automatic interview submission with a security note.'
                            )
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Violation History */}
              {violationHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Recent Violations</h3>
                  <div className="space-y-3">
                    {violationHistory.slice(-3).reverse().map((violation, index) => {
                      const severity = getViolationSeverity(violation.type);
                      const severityClass = getSeverityColor(severity);
                      
                      return (
                        <div key={index} className={`border rounded-lg p-3 ${severityClass}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getViolationIcon(violation.type)}</span>
                              <span className="font-medium">{getViolationDescription(violation.type)}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${severityClass}`}>
                              {getSeverityLabel(severity)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Time:</span> {new Date(violation.timestamp).toLocaleTimeString()}
                            {violation.details && Object.keys(violation.details).length > 0 && (
                              <div className="mt-1">
                                <span className="font-medium">Details:</span> {JSON.stringify(violation.details)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">How to Avoid Violations</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Stay in fullscreen mode throughout the exam</li>
                  <li>• Do not switch to other windows or tabs</li>
                  <li>• Avoid using Ctrl+C, Ctrl+V, or other keyboard shortcuts</li>
                  <li>• Do not right-click or attempt to select text</li>
                  <li>• Keep the exam window focused and active</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {isAutoSubmit ? (
                    <span className="text-red-600 font-medium">Auto-submitting interview...</span>
                  ) : (
                    <>Violation Count: <span className="font-medium">{violationCount}/2</span></>
                  )}
                </div>
                {!isAutoSubmit && (
                  <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    I Understand
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SecurityWarningModal;

