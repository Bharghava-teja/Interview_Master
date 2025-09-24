const mongoose = require('mongoose');

const securityViolationSchema = new mongoose.Schema({
  violationId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: String,
    required: true
  },
  resultId: {
    type: String,
    required: true
  },
  violationType: {
    type: String,
    enum: [
      'fullscreen_exit',
      'tab_switch',
      'window_blur',
      'right_click',
      'copy_paste',
      'keyboard_shortcut',
      'text_selection',
      'browser_navigation',
      'developer_tools',
      'multiple_monitors',
      'suspicious_activity',
      'network_disconnection',
      'unauthorized_software',
      'face_not_detected',
      'no_face_detected',
      'multiple_faces',
      'face_mismatch',
      'looking_away',
      'audio_detection',
      'screen_sharing',
      'virtual_machine',
      'mobile_device_detected',
      'unusual_mouse_behavior',
      'rapid_clicking',
      'automated_behavior'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  detectionMethod: {
    type: String,
    enum: ['client_side', 'server_side', 'ai_analysis', 'manual_review'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  questionId: {
    type: String // Which question was active when violation occurred
  },
  context: {
    currentStage: {
      type: String,
      enum: ['mcq', 'coding', 'feedback']
    },
    timeIntoExam: Number, // seconds since exam start
    questionNumber: Number,
    totalQuestionsAttempted: Number,
    currentScore: Number
  },
  technicalDetails: {
    userAgent: String,
    browserVersion: String,
    operatingSystem: String,
    screenResolution: String,
    windowSize: String,
    ipAddress: String,
    deviceFingerprint: String,
    mousePosition: {
      x: Number,
      y: Number
    },
    keyboardEvent: {
      key: String,
      keyCode: Number,
      ctrlKey: Boolean,
      altKey: Boolean,
      shiftKey: Boolean
    },
    networkInfo: {
      connectionType: String,
      downlink: Number,
      rtt: Number
    }
  },
  evidence: {
    screenshot: String, // Base64 or file path
    webcamCapture: String, // Base64 or file path
    audioRecording: String, // File path
    screenRecording: String, // File path
    logEntries: [{
      timestamp: Date,
      level: String,
      message: String,
      source: String
    }],
    networkLogs: [{
      timestamp: Date,
      url: String,
      method: String,
      status: Number,
      blocked: Boolean
    }]
  },
  response: {
    actionTaken: {
      type: String,
      enum: [
        'warning_shown',
        'question_locked',
        'exam_paused',
        'exam_terminated',
        'manual_review_flagged',
        'no_action',
        'score_penalty',
        'time_penalty'
      ],
      default: 'warning_shown'
    },
    warningMessage: String,
    penaltyApplied: {
      scoreDeduction: Number,
      timeDeduction: Number, // in seconds
      questionsLocked: [String]
    },
    automaticResponse: {
      type: Boolean,
      default: true
    },
    reviewRequired: {
      type: Boolean,
      default: false
    }
  },
  investigation: {
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
      default: 'pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin/Proctor
    },
    reviewNotes: [{
      timestamp: Date,
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      note: String,
      decision: {
        type: String,
        enum: ['valid_violation', 'false_positive', 'needs_more_info']
      }
    }],
    finalDecision: {
      type: String,
      enum: ['violation_confirmed', 'violation_dismissed', 'inconclusive']
    },
    resolutionDate: Date
  },
  patterns: {
    isRepeatedViolation: {
      type: Boolean,
      default: false
    },
    previousViolationCount: {
      type: Number,
      default: 0
    },
    violationFrequency: Number, // violations per minute
    suspiciousPattern: {
      type: Boolean,
      default: false
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  metadata: {
    reportedBy: {
      type: String,
      enum: ['system', 'proctor', 'ai', 'user_report'],
      default: 'system'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    processed: {
      type: Boolean,
      default: false
    },
    processingTime: Date,
    version: {
      type: String,
      default: '1.0'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
securityViolationSchema.index({ userId: 1, timestamp: -1 });
securityViolationSchema.index({ examId: 1, timestamp: -1 });
securityViolationSchema.index({ violationType: 1, severity: 1 });
securityViolationSchema.index({ 'investigation.status': 1 });
// violationId already has unique: true in field definition
securityViolationSchema.index({ timestamp: -1 });

// Virtual for violation age
securityViolationSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60));
});

// Method to calculate risk score
securityViolationSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Base score by violation type
  const typeScores = {
    'fullscreen_exit': 20,
    'tab_switch': 25,
    'window_blur': 15,
    'right_click': 10,
    'copy_paste': 30,
    'keyboard_shortcut': 25,
    'text_selection': 15,
    'browser_navigation': 35,
    'developer_tools': 40,
    'multiple_monitors': 30,
    'suspicious_activity': 50,
    'network_disconnection': 20,
    'unauthorized_software': 45,
    'face_not_detected': 35,
    'multiple_faces': 40,
    'audio_detection': 30,
    'screen_sharing': 50,
    'virtual_machine': 60,
    'mobile_device_detected': 25,
    'unusual_mouse_behavior': 35,
    'rapid_clicking': 20,
    'automated_behavior': 70
  };
  
  score += typeScores[this.violationType] || 20;
  
  // Severity multiplier
  const severityMultipliers = {
    'low': 0.5,
    'medium': 1.0,
    'high': 1.5,
    'critical': 2.0
  };
  
  score *= severityMultipliers[this.severity] || 1.0;
  
  // Repeated violation penalty
  if (this.patterns.isRepeatedViolation) {
    score += this.patterns.previousViolationCount * 5;
  }
  
  // Frequency penalty
  if (this.patterns.violationFrequency > 0.5) { // More than 0.5 violations per minute
    score += 15;
  }
  
  this.patterns.riskScore = Math.min(Math.round(score), 100);
  return this.patterns.riskScore;
};

// Method to determine if violation requires immediate action
securityViolationSchema.methods.requiresImmediateAction = function() {
  const criticalTypes = [
    'developer_tools',
    'screen_sharing',
    'virtual_machine',
    'automated_behavior',
    'unauthorized_software'
  ];
  
  return criticalTypes.includes(this.violationType) || 
         this.severity === 'critical' || 
         this.patterns.riskScore > 70;
};

// Static method to get violation summary for exam
securityViolationSchema.statics.getExamViolationSummary = function(examId) {
  return this.aggregate([
    { $match: { examId: examId } },
    {
      $group: {
        _id: '$violationType',
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$patterns.riskScore' },
        maxSeverity: { $max: '$severity' },
        latestViolation: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get user violation history
securityViolationSchema.statics.getUserViolationHistory = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId: userId,
    timestamp: { $gte: startDate }
  })
  .sort({ timestamp: -1 })
  .select('violationType severity timestamp examId patterns.riskScore');
};

// Static method to detect suspicious patterns
securityViolationSchema.statics.detectSuspiciousPatterns = function(userId, examId) {
  return this.aggregate([
    { 
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        examId: examId,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      } 
    },
    {
      $group: {
        _id: null,
        totalViolations: { $sum: 1 },
        uniqueTypes: { $addToSet: '$violationType' },
        avgRiskScore: { $avg: '$patterns.riskScore' },
        maxRiskScore: { $max: '$patterns.riskScore' },
        timeSpan: {
          $max: {
            $subtract: ['$timestamp', { $min: '$timestamp' }]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('SecurityViolation', securityViolationSchema);