import React from 'react';
import './ViolationLog.css';

const ViolationLog = ({ violations, show, onClose }) => {
  if (!show) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#757575';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  const getViolationTypeLabel = (type) => {
    switch (type) {
      case 'tab_switch': return 'Tab Switch';
      case 'multiple_tabs': return 'Multiple Tabs';
      case 'permission_revoked': return 'Permission Revoked';
      case 'screen_switch': return 'Screen Switch';
      default: return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const violationsByType = violations.reduce((acc, violation) => {
    if (!acc[violation.type]) {
      acc[violation.type] = [];
    }
    acc[violation.type].push(violation);
    return acc;
  }, {});

  const totalViolations = violations.length;
  const highSeverityCount = violations.filter(v => v.severity === 'high').length;

  return (
    <div className="violation-log-overlay">
      <div className="violation-log-modal">
        <div className="violation-log-header">
          <h2>Security Violation Report</h2>
          <button className="violation-log-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="violation-log-summary">
          <div className="violation-summary-item">
            <span className="summary-label">Total Violations:</span>
            <span className="summary-value">{totalViolations}</span>
          </div>
          <div className="violation-summary-item">
            <span className="summary-label">High Severity:</span>
            <span className="summary-value high-severity">{highSeverityCount}</span>
          </div>
        </div>

        <div className="violation-log-content">
          {totalViolations === 0 ? (
            <div className="no-violations">
              <div className="no-violations-icon">✅</div>
              <p>No security violations detected during this session.</p>
            </div>
          ) : (
            <div className="violations-list">
              {Object.entries(violationsByType).map(([type, typeViolations]) => (
                <div key={type} className="violation-type-group">
                  <h3 className="violation-type-header">
                    {getViolationTypeLabel(type)} ({typeViolations.length})
                  </h3>
                  <div className="violation-items">
                    {typeViolations.map((violation) => (
                      <div key={violation.id} className="violation-item">
                        <div className="violation-item-header">
                          <span 
                            className="violation-severity-icon"
                            style={{ color: getSeverityColor(violation.severity) }}
                          >
                            {getSeverityIcon(violation.severity)}
                          </span>
                          <span className="violation-timestamp">
                            {formatTimestamp(violation.timestamp)}
                          </span>
                          <span 
                            className="violation-severity-badge"
                            style={{ 
                              backgroundColor: getSeverityColor(violation.severity),
                              color: 'white'
                            }}
                          >
                            {violation.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="violation-description">
                          {violation.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="violation-log-footer">
          <button className="violation-log-close-footer-btn" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViolationLog;