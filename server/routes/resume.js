const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { AuthMiddleware } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');
const { APIResponse } = require('../utils/responseFormatter');
const Resume = require('../models/Resume');
const {
  upload,
  uploadResume,
  getResumeAnalysis,
  getUserResumes,
  deleteResume,
  getResumeAnalytics,
  downloadResume
} = require('../controllers/resumeController');

// Validation middleware
const validateResumeId = [
  param('resumeId')
    .isString()
    .matches(/^resume_\d+_[a-zA-Z0-9]+$/)
    .withMessage('Invalid resume ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

// Rate limiting for file uploads
const uploadRateLimit = rateLimiter.uploadLimiter; // Use dedicated upload limiter for uploads

// Standard rate limiting for other endpoints
const standardRateLimit = rateLimiter.generalLimiter; // Use existing general limiter

/**
 * @route   POST /api/v1/resumes/upload
 * @desc    Upload and analyze a resume
 * @access  Private
 * @body    file: Resume file (PDF, DOC, DOCX)
 * @returns {Object} Resume analysis results
 */
router.post('/upload',
  uploadRateLimit,
  AuthMiddleware.authenticate,
  upload.single('resume'),
  uploadResume
);

/**
 * @route   POST /api/v1/resumes/test-upload
 * @desc    Test upload and analyze a resume (no auth required)
 * @access  Public
 * @body    file: Resume file (PDF, DOC, DOCX)
 * @returns {Object} Resume analysis results
 */
router.post('/test-upload',
  upload.single('resume'),
  (req, res, next) => {
    // Mock user for testing
    req.user = { id: 'test-user-id' };
    next();
  },
  uploadResume
);

/**
 * @route   GET /api/v1/resumes/:resumeId
 * @desc    Get detailed resume analysis
 * @access  Private
 * @param   {string} resumeId - Resume identifier
 * @returns {Object} Detailed resume analysis
 */
router.get('/:resumeId',
  standardRateLimit,
  AuthMiddleware.authenticate,
  ...validateResumeId,
  getResumeAnalysis
);

/**
 * @route   GET /api/v1/resumes
 * @desc    Get user's resume list with pagination
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10, max: 50)
 * @returns {Object} Paginated list of user's resumes
 */
router.get('/',
  standardRateLimit,
  AuthMiddleware.authenticate,
  ...validatePagination,
  getUserResumes
);

/**
 * @route   DELETE /api/v1/resumes/:resumeId
 * @desc    Delete a resume and its analysis
 * @access  Private
 * @param   {string} resumeId - Resume identifier
 * @returns {Object} Success confirmation
 */
router.delete('/:resumeId',
  standardRateLimit,
  AuthMiddleware.authenticate,
  ...validateResumeId,
  deleteResume
);

/**
 * @route   GET /api/v1/resumes/analytics/summary
 * @desc    Get user's resume analytics and improvement trends
 * @access  Private
 * @returns {Object} Resume analytics data
 */
router.get('/analytics/summary',
  standardRateLimit,
  AuthMiddleware.authenticate,
  getResumeAnalytics
);

/**
 * @route   GET /api/v1/resumes/:resumeId/download
 * @desc    Download original resume file
 * @access  Private
 * @param   {string} resumeId - Resume identifier
 * @returns {File} Original resume file
 */
router.get('/:resumeId/download',
  standardRateLimit,
  AuthMiddleware.authenticate,
  ...validateResumeId,
  downloadResume
);

/**
 * @route   POST /api/v1/resumes/:resumeId/reanalyze
 * @desc    Re-analyze an existing resume with updated algorithms
 * @access  Private
 * @param   {string} resumeId - Resume identifier
 * @returns {Object} Updated resume analysis
 */
router.post('/:resumeId/reanalyze',
  uploadRateLimit, // Use upload rate limit since this is processing-intensive
  AuthMiddleware.authenticate,
  ...validateResumeId,
  async (req, res) => {
    try {
      const { formatResponse } = require('../utils/responseFormatter');
      const logger = require('../utils/logger');
      
      const { resumeId } = req.params;
      
      const resume = await Resume.findOne({
        resumeId,
        userId: req.user.id
      });
      
      if (!resume) {
        return res.status(404).json(APIResponse.error(
          'Resume not found'
        ));
      }
      
      // Re-run analysis with existing extracted text
      
      const startTime = Date.now();
      
      // Re-parse and re-evaluate
      const parsedData = parseResumeContent(resume.extractedText);
      const evaluation = evaluateResume(parsedData, resume.extractedText);
      const feedback = generateFeedback(evaluation, parsedData);
      
      // Update resume with new analysis
      resume.parsedData = parsedData;
      resume.evaluation = evaluation;
      resume.feedback = feedback;
      resume.status = 'analyzed';
      resume.processingTime = Date.now() - startTime;
      resume.metadata.lastUpdated = new Date();
      resume.version += 1;
      
      // Recalculate overall score
      resume.calculateOverallScore();
      
      await resume.save();
      
      logger.info(`Resume re-analyzed: ${resumeId} for user ${req.user.id}`, {
        version: resume.version,
        processingTime: resume.processingTime,
        overallScore: resume.evaluation.overallScore
      });
      
      res.json(APIResponse.success(
        {
          resumeId: resume.resumeId,
          version: resume.version,
          overallScore: resume.evaluation.overallScore,
          scoreCategory: resume.getScoreCategory(),
          processingTime: resume.processingTime,
          feedback: resume.feedback,
          evaluation: resume.evaluation
        },
        'Resume re-analyzed successfully'
      ));
      
    } catch (error) {
      const logger = require('../utils/logger');
      
      logger.error('Resume re-analysis error:', error);
      res.status(500).json(APIResponse.error(
        'Failed to re-analyze resume',
        error.message
      ));
    }
  }
);

/**
 * @route   GET /api/v1/resumes/:resumeId/improvement-plan
 * @desc    Get personalized improvement plan for a resume
 * @access  Private
 * @param   {string} resumeId - Resume identifier
 * @returns {Object} Detailed improvement plan with actionable steps
 */
router.get('/:resumeId/improvement-plan',
  standardRateLimit,
  AuthMiddleware.authenticate,
  ...validateResumeId,
  async (req, res) => {
    try {
      const { formatResponse } = require('../utils/responseFormatter');
      
      const { resumeId } = req.params;
      
      const resume = await Resume.findOne({
        resumeId,
        userId: req.user.id
      });
      
      if (!resume) {
        return res.status(404).json(APIResponse.error(
          'Resume not found'
        ));
      }
      
      const improvementPlan = resume.generateImprovementPlan();
      
      // Add additional personalized recommendations
      const personalizedPlan = {
        currentScore: resume.evaluation.overallScore,
        targetScore: Math.min(100, resume.evaluation.overallScore + 20),
        estimatedTimeToImprove: '2-4 weeks',
        priorityActions: improvementPlan.filter(item => item.priority === 'high'),
        secondaryActions: improvementPlan.filter(item => item.priority !== 'high'),
        skillGaps: resume.evaluation.skillsAnalysis.missingSkills,
        industryBenchmark: {
          averageScore: 75,
          topPercentileScore: 90,
          yourRanking: resume.evaluation.overallScore >= 90 ? 'Top 10%' : 
                      resume.evaluation.overallScore >= 75 ? 'Above Average' : 
                      resume.evaluation.overallScore >= 60 ? 'Average' : 'Below Average'
        },
        nextSteps: [
          'Review and implement high-priority recommendations',
          'Update resume with new content',
          'Re-upload for updated analysis',
          'Apply to relevant positions'
        ]
      };
      
      res.json(APIResponse.success(
        personalizedPlan,
        'Improvement plan generated successfully'
      ));
      
    } catch (error) {
      const logger = require('../utils/logger');
      
      logger.error('Get improvement plan error:', error);
      res.status(500).json(APIResponse.error(
        'Failed to generate improvement plan',
        error.message
      ));
    }
  }
);

/**
 * @route   GET /api/v1/resumes/templates/suggestions
 * @desc    Get resume template suggestions based on user's profile
 * @access  Private
 * @returns {Object} Recommended resume templates and formats
 */
router.get('/templates/suggestions',
  standardRateLimit,
  AuthMiddleware.authenticate,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const { formatResponse } = require('../utils/responseFormatter');
      
      const user = await User.findById(req.user.id);
      
      // Generate template suggestions based on user profile
      const templates = [
        {
          id: 'modern-tech',
          name: 'Modern Tech Professional',
          description: 'Clean, ATS-friendly design perfect for software developers',
          suitableFor: ['Software Engineer', 'Full Stack Developer', 'Frontend Developer'],
          features: ['ATS Optimized', 'Skills Section', 'Project Showcase'],
          difficulty: 'Easy',
          estimatedTime: '30 minutes'
        },
        {
          id: 'executive-minimal',
          name: 'Executive Minimal',
          description: 'Professional layout for senior positions',
          suitableFor: ['Senior Developer', 'Tech Lead', 'Engineering Manager'],
          features: ['Leadership Focus', 'Achievement Highlights', 'Clean Layout'],
          difficulty: 'Medium',
          estimatedTime: '45 minutes'
        },
        {
          id: 'creative-portfolio',
          name: 'Creative Portfolio',
          description: 'Showcase your projects and creativity',
          suitableFor: ['UI/UX Designer', 'Frontend Developer', 'Full Stack Developer'],
          features: ['Portfolio Links', 'Visual Elements', 'Project Gallery'],
          difficulty: 'Advanced',
          estimatedTime: '60 minutes'
        }
      ];
      
      // Personalize recommendations based on user's experience level
      const personalizedTemplates = templates.map(template => ({
        ...template,
        recommended: template.suitableFor.some(role => 
          user.profile?.experience?.toLowerCase().includes(role.toLowerCase())
        )
      }));
      
      res.json(APIResponse.success(
        {
          templates: personalizedTemplates,
          tips: [
            'Choose a template that matches your experience level',
            'Ensure the template is ATS-friendly',
            'Customize the template to highlight your strengths',
            'Keep the design clean and professional'
          ]
        },
        'Template suggestions retrieved successfully'
      ));
      
    } catch (error) {
      const logger = require('../utils/logger');
      
      logger.error('Get template suggestions error:', error);
      res.status(500).json(APIResponse.error(
        'Failed to get template suggestions',
        error.message
      ));
    }
  }
);

module.exports = router;