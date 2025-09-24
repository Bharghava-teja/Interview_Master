const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examType: {
    type: String,
    enum: ['industry_specific', 'resume_review', 'mock_interview', 'behavioral'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  configuration: {
    timeLimit: {
      type: Number,
      default: 3600 // 60 minutes in seconds
    },
    industry: {
      type: String,
      default: 'technology'
    },
    difficulty: {
      type: String,
      enum: ['entry', 'mid', 'senior'],
      default: 'mid'
    },
    numberOfQuestions: {
      type: Number,
      default: 10
    }
  },
  questions: [{
    questionId: String,
    type: {
      type: String,
      enum: ['behavioral', 'technical', 'situational', 'essay']
    },
    question: String,
    options: [String], // For MCQ questions
    correctAnswer: mongoose.Schema.Types.Mixed, // Can be index, string, or array
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    category: String,
    points: {
      type: Number,
      default: 1
    },
    timeLimit: Number, // Individual question time limit
    codeTemplate: String, // For coding questions
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: {
        type: Boolean,
        default: false
      }
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived', 'pending', 'in_progress'],
    default: 'draft'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  totalTimeLimit: {
    type: Number, // Total exam time in seconds
    required: true
  },
  passingScore: {
    type: Number,
    default: 70 // Percentage
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  isProctored: {
    type: Boolean,
    default: true
  },
  securitySettings: {
    fullscreenRequired: {
      type: Boolean,
      default: true
    },
    preventCopyPaste: {
      type: Boolean,
      default: true
    },
    preventRightClick: {
      type: Boolean,
      default: true
    },
    preventTabSwitch: {
      type: Boolean,
      default: true
    },
    maxViolations: {
      type: Number,
      default: 2
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  metadata: {
    version: {
      type: String,
      default: '1.0'
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    isTemplate: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examSchema.index({ userId: 1, status: 1 });
examSchema.index({ examType: 1, status: 1 });
examSchema.index({ createdAt: -1 });
// examId already has unique: true in field definition

// Virtual for exam duration in minutes
examSchema.virtual('durationMinutes').get(function() {
  return Math.floor(this.totalTimeLimit / 60);
});

// Method to check if exam is active
examSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         (!this.startTime || this.startTime <= now) && 
         (!this.endTime || this.endTime >= now);
};

// Method to calculate total points
examSchema.methods.getTotalPoints = function() {
  return this.questions.reduce((total, question) => total + (question.points || 1), 0);
};

// Static method to find active exams for user
examSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    userId: userId,
    status: 'active',
    $or: [
      { startTime: { $lte: new Date() } },
      { startTime: { $exists: false } }
    ],
    $or: [
      { endTime: { $gte: new Date() } },
      { endTime: { $exists: false } }
    ]
  });
};

module.exports = mongoose.model('Exam', examSchema);