import React from 'react';
import './SecurityWarning.css';

const SecurityWarning = ({ show, message, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="security-warning-overlay">
      <div className="security-warning-modal">
        <div className="security-warning-header">
          <div className="security-warning-icon">⚠️</div>
          <h3>Security Warning</h3>
        </div>
        <div className="security-warning-content">
          <p>{message}</p>
        </div>
        <div className="security-warning-actions">
          <button 
            className="security-warning-dismiss-btn"
            onClick={onDismiss}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityWarning;