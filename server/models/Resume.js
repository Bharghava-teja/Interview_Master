const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  resumeId: {
    type: String,
    required: true,
    unique: true,
    default: () => `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  parsedData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String
    },
    summary: String,
    experience: [{
      company: String,
      position: String,
      duration: String,
      startDate: String,
      endDate: String,
      description: String,
      technologies: [String],
      achievements: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      graduationYear: String,
      gpa: String,
      honors: [String]
    }],
    skills: {
      technical: [String],
      soft: [String],
      languages: [String],
      frameworks: [String],
      tools: [String],
      databases: [String]
    },
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      github: String,
      duration: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
      expiryDate: String,
      credentialId: String
    }],
    awards: [String],
    publications: [String],
    languages: [{
      language: String,
      proficiency: String
    }]
  },
  evaluation: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    atsCompatibility: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      issues: [{
        type: {
          type: String,
          required: true
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          required: true
        },
        description: {
          type: String,
          required: true
        },
        suggestion: {
          type: String,
          required: true
        }
      }],
      keywordOptimization: Number,
      formatCompliance: Number
    },
    content: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      strengths: [String],
      weaknesses: [String],
      missingElements: [String],
      recommendations: [String]
    },
    skills: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      relevantSkills: [String],
      missingSkills: [String],
      skillLevel: {
        type: String,
        enum: ['entry', 'junior', 'mid', 'senior', 'expert']
      },
      experienceYears: Number,
      industryAlignment: Number
    },
    formatting: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      issues: [String],
      suggestions: [String],
      readabilityScore: Number
    },
    keywords: {
      found: [String],
      missing: [String],
      density: Number,
      relevanceScore: Number,
      industrySpecific: [String]
    },
    sections: {
      present: [String],
      missing: [String],
      order: [String],
      completeness: Number
    },
    length: {
      pages: Number,
      wordCount: Number,
      isOptimal: Boolean,
      recommendation: String,
      sentenceComplexity: Number
    },
    industryMatch: {
      targetIndustry: String,
      matchScore: {
        type: Number,
        min: 0,
        max: 100
      },
      relevantExperience: [String],
      suggestions: [String]
    }
  },
  feedback: {
    summary: String,
    detailedFeedback: String,
    actionItems: [{
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      category: String,
      description: String,
      suggestion: String,
      resources: [String]
    }],
    improvementAreas: [{
      area: String,
      currentLevel: String,
      targetLevel: String,
      steps: [String]
    }]
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'analyzed', 'error'],
    default: 'uploaded'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    fileHash: { type: String, index: true }, // SHA-256 hash for file integrity
    securityChecks: {
      fileSignatureValid: { type: Boolean, default: false },
      contentSanitized: { type: Boolean, default: false },
      malwareScanned: { type: Boolean, default: false },
      lastSecurityScan: { type: Date, default: Date.now }
    },
    processingFlags: {
      hasTimeoutIssues: { type: Boolean, default: false },
      requiresManualReview: { type: Boolean, default: false },
      confidenceScore: { type: Number, min: 0, max: 100, default: 100 }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
resumeSchema.index({ userId: 1, createdAt: -1 });
// resumeId index is automatically created by unique: true constraint
resumeSchema.index({ status: 1 });
resumeSchema.index({ 'evaluation.overallScore': -1 });

// Virtual for file URL
resumeSchema.virtual('fileUrl').get(function() {
  return `/api/v1/resumes/${this.resumeId}/download`;
});

// Methods
resumeSchema.methods.calculateOverallScore = function() {
  const weights = {
    atsCompatibility: 0.25,
    contentQuality: 0.30,
    skillsRelevance: 0.25,
    formatting: 0.20
  };
  
  const atsScore = this.evaluation?.atsCompatibility?.score || 0;
  const contentScore = this.evaluation?.content?.score || 0;
  const skillsScore = this.evaluation?.skills?.score || 0;
  const formatScore = this.evaluation?.formatting?.score || 0;
  
  const overallScore = Math.round(
    (atsScore * weights.atsCompatibility) +
    (contentScore * weights.contentQuality) +
    (skillsScore * weights.skillsRelevance) +
    (formatScore * weights.formatting)
  );
  
  this.evaluation.overallScore = overallScore;
  return overallScore;
};

resumeSchema.methods.getScoreCategory = function() {
  const score = this.evaluation?.overallScore || 0;
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  if (score >= 60) return 'below-average';
  return 'poor';
};

resumeSchema.methods.generateImprovementPlan = function() {
  const actionItems = [];
  const evaluation = this.evaluation;
  
  if (evaluation?.atsCompatibility?.score < 80) {
    actionItems.push({
      priority: 'high',
      category: 'ATS Compatibility',
      description: 'Improve ATS compatibility to increase visibility',
      suggestion: 'Use standard section headings and avoid complex formatting',
      resources: ['ATS-friendly resume templates', 'Keyword optimization guide']
    });
  }
  
  if (evaluation?.content?.missingElements?.length > 0) {
    actionItems.push({
      priority: 'medium',
      category: 'Content',
      description: 'Add missing resume sections',
      suggestion: `Include: ${evaluation.content.missingElements.join(', ')}`,
      resources: ['Resume writing guide', 'Section templates']
    });
  }
  
  return actionItems;
};

// Static methods
resumeSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

resumeSchema.statics.getAnalytics = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalResumes: { $sum: 1 },
        averageScore: { $avg: '$evaluation.overallScore' },
        latestScore: { $last: '$evaluation.overallScore' },
        improvementTrend: {
          $push: {
            date: '$createdAt',
            score: '$evaluation.overallScore'
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Resume', resumeSchema);