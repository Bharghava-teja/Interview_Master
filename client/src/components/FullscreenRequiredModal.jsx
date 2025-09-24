import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, AlertTriangle, Maximize } from 'lucide-react';

const FullscreenRequiredModal = ({
  isVisible,
  onFullscreenEnabled,
  onCancel,
  isRetrying = false
}) => {
  
  const handleCancel = () => {
    // Resolve the Promise with false when user cancels
    if (window.fullscreenPromiseResolve) {
      window.fullscreenPromiseResolve(false);
    }
    if (onCancel) {
      onCancel();
    }
  };
  const [isRequestingFullscreen, setIsRequestingFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(true);

  useEffect(() => {
    // Check if fullscreen is supported
    const element = document.documentElement;
    const supported = !!(element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullscreen);
    
    setIsFullscreenSupported(supported);
  }, []);

  const handleRequestFullscreen = async () => {
    if (!isFullscreenSupported) {
      setError('Fullscreen mode is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    setIsRequestingFullscreen(true);
    setError(null);

    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }

      // The fullscreen change event will be handled by MockInterviewPage event listeners
      // Just reset the requesting state after a brief delay
      setTimeout(() => {
        setIsRequestingFullscreen(false);
        // Call the onFullscreenEnabled callback if provided
        if (onFullscreenEnabled) {
          onFullscreenEnabled();
        }
      }, 500);
      
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      setError(`Failed to enter fullscreen mode: ${error.message}. Please try pressing F11 or check your browser settings.`);
      setIsRequestingFullscreen(false);
      
      // If there's a Promise resolve function available, resolve with false on error
      if (window.fullscreenPromiseResolve) {
        window.fullscreenPromiseResolve(false);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">
                  {isRetrying ? 'Fullscreen Required Again' : 'Fullscreen Mode Required'}
                </h2>
                <p className="text-blue-700 text-sm">
                  {isRetrying ? 'Please return to fullscreen to continue' : 'This interview requires fullscreen mode'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Warning Message */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-1">
                    Security Requirement
                  </h3>
                  <p className="text-amber-700 text-sm">
                    {isRetrying 
                      ? 'You have exited fullscreen mode. The interview is paused until you return to fullscreen.'
                      : 'To ensure exam integrity and prevent cheating, this interview must be conducted in fullscreen mode.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits Comparison */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Why fullscreen mode is required:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Tab Mode Issues */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Tab Mode Issues
                  </h4>
                  <ul className="text-red-700 text-xs space-y-1">
                    <li>• Easy to switch to other tabs/applications</li>
                    <li>• Browser controls remain accessible</li>
                    <li>• Notifications can distract you</li>
                    <li>• Compromises exam integrity</li>
                  </ul>
                </div>
                
                {/* Fullscreen Benefits */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Fullscreen Benefits
                  </h4>
                  <ul className="text-green-700 text-xs space-y-1">
                    <li>• Prevents accidental tab switching</li>
                    <li>• Hides browser navigation & shortcuts</li>
                    <li>• Eliminates external distractions</li>
                    <li>• Ensures focused interview environment</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-2">What happens in fullscreen:</h4>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>• Interview interface fills your entire screen</li>
                  <li>• System menus and taskbar are hidden</li>
                  <li>• Security monitoring becomes active</li>
                  <li>• Exiting fullscreen triggers warnings and may pause the interview</li>
                </ul>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Support Warning */}
            {!isFullscreenSupported && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-1">Browser Not Supported</h3>
                    <p className="text-orange-700 text-sm">
                      Your browser doesn't support fullscreen mode. Please use Chrome, Firefox, Safari, or Edge.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={isRequestingFullscreen}
              >
                Cancel Interview
              </button>
              
              <button
                onClick={handleRequestFullscreen}
                disabled={isRequestingFullscreen || !isFullscreenSupported}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
              >
                {isRequestingFullscreen ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    <span>Enter Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenRequiredModal;