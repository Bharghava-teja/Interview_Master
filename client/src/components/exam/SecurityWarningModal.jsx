import React, { useEffect, useState } from 'react';
import { useExam } from '../../contexts/ExamContext';
import './SecurityWarningModal.css';

const SecurityWarningModal = () => {
  const { warning, hideWarning, totalViolations, examConfig } = useExam();
  const [countdown, setCountdown] = useState(5);
  const [isShaking, setIsShaking] = useState(false);

  // Countdown timer for auto-hide
  useEffect(() => {
    let timer;
    if (warning.show && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      hideWarning();
      setCountdown(5); // Reset for next warning
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [warning.show, countdown, hideWarning]);

  // Reset countdown when new warning appears
  useEffect(() => {
    if (warning.show) {
      setCountdown(5);
      setIsShaking(true);
      
      // Stop shaking after animation
      const shakeTimer = setTimeout(() => {
        setIsShaking(false);
      }, 600);

      return () => clearTimeout(shakeTimer);
    }
  }, [warning.timestamp]);

  // Get warning severity based on violation count
  const getWarningSeverity = () => {
    const violationRatio = totalViolations / (examConfig.allowedViolations || 3);
    if (violationRatio >= 0.8) return 'critical';
    if (violationRatio >= 0.5) return 'high';
    return 'medium';
  };

  // Get warning icon based on type
  const getWarningIcon = (type) => {
    switch (type) {
      case 'fullscreen_exit':
        return '🔒';
      case 'blocked_key':
        return '⌨️';
      case 'visibility_hidden':
        return '👁️';
      case 'window_blur':
        return '🪟';
      case 'context_menu':
        return '🖱️';
      case 'dev_tools_suspected':
        return '🛠️';
      case 'force_exit':
        return '🚫';
      default:
        return '⚠️';
    }
  };

  // Get warning title based on type
  const getWarningTitle = (type) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'Fullscreen Mode Required';
      case 'blocked_key':
        return 'Key Combination Blocked';
      case 'visibility_hidden':
        return 'Tab Switching Detected';
      case 'window_blur':
        return 'Window Focus Lost';
      case 'context_menu':
        return 'Right-Click Disabled';
      case 'dev_tools_suspected':
        return 'Developer Tools Detected';
      case 'force_exit':
        return 'Exam Terminated';
      default:
        return 'Security Warning';
    }
  };

  // Get additional instructions based on warning type
  const getInstructions = (type) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'Please remain in fullscreen mode throughout the exam. The screen will automatically return to fullscreen.';
      case 'blocked_key':
        return 'Certain key combinations are disabled during the exam for security purposes.';
      case 'visibility_hidden':
        return 'Please keep the exam window active and visible at all times.';
      case 'window_blur':
        return 'Please do not switch to other applications during the exam.';
      case 'context_menu':
        return 'Right-click functionality is disabled during the exam.';
      case 'dev_tools_suspected':
        return 'Developer tools are not permitted during the exam.';
      case 'force_exit':
        return 'The exam has been terminated due to multiple security violations.';
      default:
        return 'Please follow exam security guidelines.';
    }
  };

  if (!warning.show) {
    return null;
  }

  const severity = getWarningSeverity();
  const isTermination = warning.type === 'force_exit';

  return (
    <>
      {/* Backdrop */}
      <div className="security-warning-backdrop" />
      
      {/* Modal */}
      <div 
        className={`security-warning-modal ${severity} ${isShaking ? 'shake' : ''}`}
        role="alert"
        aria-live="assertive"
      >
        {/* Header */}
        <div className="warning-header">
          <div className="warning-icon">
            {getWarningIcon(warning.type)}
          </div>
          <div className="warning-title">
            <h3>{getWarningTitle(warning.type)}</h3>
            <div className="violation-counter">
              Violations: {totalViolations} / {examConfig.allowedViolations || 3}
            </div>
          </div>
          {!isTermination && (
            <div className="countdown-timer">
              <div className="countdown-circle">
                <span>{countdown}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="warning-content">
          <div className="warning-message">
            {warning.message}
          </div>
          
          <div className="warning-instructions">
            {getInstructions(warning.type)}
          </div>

          {/* Violation Progress Bar */}
          <div className="violation-progress">
            <div className="progress-label">
              Security Violations
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${severity}`}
                style={{ 
                  width: `${(totalViolations / (examConfig.allowedViolations || 3)) * 100}%` 
                }}
              />
            </div>
            <div className="progress-text">
              {examConfig.allowedViolations - totalViolations} violations remaining
            </div>
          </div>

          {/* Warning Details */}
          {warning.type === 'blocked_key' && warning.details && (
            <div className="warning-details">
              <strong>Blocked Key:</strong> {formatKeyDetails(warning.details)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="warning-footer">
          {isTermination ? (
            <div className="termination-notice">
              <p>Your exam session has been terminated due to security violations.</p>
              <p>Please contact your instructor for further assistance.</p>
            </div>
          ) : (
            <>
              <div className="auto-close-notice">
                This warning will close automatically in {countdown} seconds
              </div>
              <button 
                className="acknowledge-button"
                onClick={hideWarning}
                aria-label="Acknowledge warning"
              >
                I Understand
              </button>
            </>
          )}
        </div>

        {/* Severity Indicator */}
        <div className={`severity-indicator ${severity}`} />
      </div>
    </>
  );
};

// Helper function to format key details
function formatKeyDetails(details) {
  const parts = [];
  if (details.ctrlKey) parts.push('Ctrl');
  if (details.altKey) parts.push('Alt');
  if (details.metaKey) parts.push('Cmd');
  if (details.shiftKey) parts.push('Shift');
  if (details.key) parts.push(details.key);
  return parts.join(' + ');
}

export default SecurityWarningModal;