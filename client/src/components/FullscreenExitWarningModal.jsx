import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Monitor, X } from 'lucide-react';

const FullscreenExitWarningModal = ({
  isVisible,
  onExitInterview,
  onStayInFullscreen
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
        style={{ zIndex: 999999 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Fullscreen Exit Warning
                </h2>
                <p className="text-red-100 text-sm">
                  You are attempting to exit fullscreen mode
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Monitor className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Security Requirement</h3>
                    <p className="text-red-700 text-sm">
                      This interview must be conducted in fullscreen mode for security and integrity purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">What would you like to do?</h4>
                <ul className="text-amber-700 text-sm space-y-1">
                  <li>• <strong>Close:</strong> Stay in the interview and return to fullscreen</li>
                  <li>• <strong>Exit Interview:</strong> End the interview session and submit</li>
                </ul>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <p className="text-gray-700 text-sm text-center">
                <strong>Note:</strong> Exiting the interview will automatically submit your responses and end the session.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between space-x-3">
              <button
                onClick={onStayInFullscreen}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <Monitor className="h-4 w-4" />
                <span>Close</span>
              </button>
              
              <button
                onClick={onExitInterview}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Exit Interview</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenExitWarningModal;