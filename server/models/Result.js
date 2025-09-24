const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  resultId: {
    type: String,
    required: true,
    unique: true
  },
  examId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'submitted', 'auto_submitted', 'cancelled'],
    default: 'in_progress'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  submissionTime: {
    type: Date
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['mcq', 'coding', 'essay'],
      required: true
    },
    userAnswer: mongoose.Schema.Types.Mixed, // Can be string, number, array, or object
    isCorrect: {
      type: Boolean
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    maxPoints: {
      type: Number,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    attempts: {
      type: Number,
      default: 1
    },
    // For coding questions
    codeSubmission: {
      code: String,
      language: String,
      executionResults: [{
        testCaseId: String,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        passed: Boolean,
        executionTime: Number,
        memoryUsed: Number,
        error: String
      }],
      compilationError: String,
      totalTestCases: Number,
      passedTestCases: Number
    },
    // For essay/behavioral questions
    textResponse: {
      content: String,
      wordCount: Number,
      characterCount: Number
    },
    feedback: {
      automated: String,
      manual: String,
      suggestions: [String]
    },
    timestamps: {
      firstAttempt: Date,
      lastModified: Date,
      submitted: Date
    }
  }],
  scoring: {
    totalPoints: {
      type: Number,
      required: true,
      default: 0
    },
    maxPossiblePoints: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      default: 0
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    },
    passed: {
      type: Boolean,
      required: true,
      default: false
    },
    breakdown: {
      mcqScore: Number,
      codingScore: Number,
      essayScore: Number,
      mcqPercentage: Number,
      codingPercentage: Number,
      essayPercentage: Number
    }
  },
  analytics: {
    averageTimePerQuestion: Number,
    questionsAttempted: {
      type: Number,
      default: 0
    },
    questionsSkipped: {
      type: Number,
      default: 0
    },
    difficultyBreakdown: {
      easy: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 }
      },
      medium: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 }
      },
      hard: {
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 }
      }
    },
    categoryPerformance: [{
      category: String,
      attempted: Number,
      correct: Number,
      percentage: Number
    }],
    timeDistribution: {
      fastAnswers: Number, // < 30 seconds
      normalAnswers: Number, // 30-120 seconds
      slowAnswers: Number // > 120 seconds
    }
  },
  securityEvents: {
    violationCount: {
      type: Number,
      default: 0
    },
    violations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityViolation'
    }],
    autoSubmitted: {
      type: Boolean,
      default: false
    },
    autoSubmissionReason: String
  },
  feedback: {
    overallFeedback: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [{
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      resources: [String]
    }],
    nextSteps: [String],
    estimatedStudyTime: Number // in hours
  },
  proctoring: {
    isProctored: {
      type: Boolean,
      default: false
    },
    proctorNotes: [{
      timestamp: Date,
      note: String,
      severity: {
        type: String,
        enum: ['info', 'warning', 'critical']
      }
    }],
    flaggedForReview: {
      type: Boolean,
      default: false
    },
    reviewNotes: String
  },
  metadata: {
    browserInfo: {
      userAgent: String,
      platform: String,
      language: String,
      screenResolution: String
    },
    ipAddress: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    deviceFingerprint: String,
    sessionId: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
resultSchema.index({ userId: 1, createdAt: -1 });
resultSchema.index({ examId: 1, userId: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ 'scoring.percentage': -1 });
// resultId already has unique: true in field definition

// Virtual for exam duration
resultSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }
  return 0;
});

// Method to calculate final score
resultSchema.methods.calculateScore = function() {
  let totalPoints = 0;
  let maxPoints = 0;
  
  this.answers.forEach(answer => {
    totalPoints += answer.pointsEarned || 0;
    maxPoints += answer.maxPoints || 0;
  });
  
  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  
  this.scoring.totalPoints = totalPoints;
  this.scoring.maxPossiblePoints = maxPoints;
  this.scoring.percentage = percentage;
  this.scoring.passed = percentage >= 70; // Default passing score
  
  return percentage;
};

// Method to generate grade based on percentage
resultSchema.methods.calculateGrade = function() {
  const percentage = this.scoring.percentage;
  
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Method to check if result is complete
resultSchema.methods.isComplete = function() {
  return ['completed', 'submitted', 'auto_submitted'].includes(this.status);
};

// Static method to get user's exam history
resultSchema.statics.getUserHistory = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('exam', 'title examType')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('examId scoring.percentage scoring.passed status createdAt exam');
};

// Static method to get performance analytics
resultSchema.statics.getPerformanceAnalytics = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), status: { $in: ['completed', 'submitted'] } } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        averageScore: { $avg: '$scoring.percentage' },
        passedExams: {
          $sum: {
            $cond: [{ $eq: ['$scoring.passed', true] }, 1, 0]
          }
        },
        totalTimeSpent: { $sum: '$totalTimeSpent' }
      }
    }
  ]);
};

module.exports = mongoose.model('Result', resultSchema);