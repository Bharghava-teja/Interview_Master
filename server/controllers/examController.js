const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');
const SecurityViolation = require('../models/SecurityViolation');
const { APIResponse } = require('../utils/responseFormatter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { SecurityManager } = require('../utils/security');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Start an exam
 * POST /api/v1/exams/:examId/start
 */
exports.startExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;

  // Find the exam
  const exam = await Exam.findOne({ examId });
  if (!exam) {
    throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
  }

  // Check if exam is already started or completed
  const existingResult = await Result.findOne({
    examId,
    userId,
    status: { $in: ['in_progress', 'completed'] }
  });

  if (existingResult) {
    if (existingResult.status === 'completed') {
      throw new AppError('Exam already completed', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Return existing in-progress exam
    return res.json(APIResponse.success({
      exam: {
        examId: exam.examId,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        configuration: exam.configuration,
        status: 'in_progress',
        startTime: existingResult.startTime,
        timeLimit: exam.totalTimeLimit,
        questions: exam.questions
      },
      result: {
        resultId: existingResult.resultId,
        startTime: existingResult.startTime,
        status: existingResult.status
      }
    }, 'Exam session resumed'));
  }

  // Check if user has permission to take this exam
  // Allow candidates to take exams created by admins, but restrict access to personal exams
  const user = await User.findById(userId);
  if (exam.userId && exam.userId.toString() !== userId.toString()) {
    // If the exam creator is an admin, allow any authenticated user to take it
    const examCreator = await User.findById(exam.userId);
    if (!examCreator || examCreator.role !== 'admin') {
      throw new AppError('Not authorized to take this exam', HTTP_STATUS.FORBIDDEN);
    }
  }

  // Check if exam is active
  if (!exam.isActive()) {
    throw new AppError('Exam is not currently active', HTTP_STATUS.BAD_REQUEST);
  }

  // Create new result record
  const result = new Result({
    resultId: `result_${uuidv4()}`,
    examId,
    userId,
    exam: exam._id,
    startTime: new Date(),
    status: 'in_progress',
    answers: [],
    scoring: {
      maxPossiblePoints: exam.getTotalPoints(),
      totalPoints: 0,
      percentage: 0,
      grade: 'F'
    },
    analytics: {
      questionsAttempted: 0,
      questionsSkipped: 0,
      averageTimePerQuestion: 0,
      flaggedQuestions: []
    }
  });

  await result.save();

  // Update exam status if needed
  if (exam.status === 'pending' || exam.status === 'active') {
    exam.status = 'in_progress';
    exam.startTime = new Date();
    await exam.save();
  }

  // Log exam start for audit purposes

  res.json(APIResponse.success({
    exam: {
      examId: exam.examId,
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      configuration: exam.configuration,
      status: 'in_progress',
      startTime: result.startTime,
      timeLimit: exam.totalTimeLimit,
      questions: exam.questions
    },
    result: {
      resultId: result.resultId,
      startTime: result.startTime,
      status: result.status
    }
  }, 'Exam started successfully'));
});

/**
 * Submit exam answers
 * POST /api/v1/exams/:examId/submit
 */
exports.submitExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { answers, timeSpent } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!answers || !Array.isArray(answers)) {
    throw new AppError('Answers are required and must be an array', HTTP_STATUS.BAD_REQUEST);
  }

  // Find the exam
  const exam = await Exam.findOne({ examId });
  if (!exam) {
    throw new AppError('Exam not found', HTTP_STATUS.NOT_FOUND);
  }

  // Find the active result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'in_progress'
  });

  if (!result) {
    throw new AppError('No active exam session found', HTTP_STATUS.NOT_FOUND);
  }

  // Update result with submitted answers and calculate scores
  result.answers = answers.map(answer => {
    const examQuestion = exam.questions.find(q => q.questionId === answer.questionId);
    if (!examQuestion) {
      return {
        questionId: answer.questionId,
        questionType: 'mcq',
        userAnswer: answer.selectedOption || answer.userAnswer || answer.answer,
        isCorrect: false,
        pointsEarned: 0,
        maxPoints: 1,
        timeSpent: answer.timeSpent || 0,
        flagged: answer.flagged || false
      };
    }

    const userAnswer = answer.selectedOption || answer.userAnswer || answer.answer;
    let isCorrect = false;
    let pointsEarned = 0;
    const maxPoints = examQuestion.points || 1;

    // Check if answer is correct based on question type
    if (examQuestion.type === 'mcq') {
      // For MCQ, compare with correct answer (could be index or string)
      if (typeof examQuestion.correctAnswer === 'number') {
        isCorrect = parseInt(userAnswer) === examQuestion.correctAnswer;
      } else {
        isCorrect = userAnswer === examQuestion.correctAnswer;
      }
    } else if (examQuestion.type === 'coding') {
      // For coding questions, we'd need to run test cases
      // For now, assume partial credit based on test case results
      // This would be implemented with actual code execution
      isCorrect = false; // Placeholder
    } else {
      // For essay questions, manual grading would be required
      isCorrect = false; // Placeholder
    }

    if (isCorrect) {
      pointsEarned = maxPoints;
    }

    return {
      questionId: answer.questionId,
      questionType: examQuestion.type || 'mcq',
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      maxPoints: maxPoints,
      timeSpent: answer.timeSpent || 0,
      flagged: answer.flagged || false
    };
  });

  // Set completion time
  result.endTime = new Date();
  result.status = 'completed';
  result.totalTimeSpent = timeSpent || Math.floor((result.endTime - result.startTime) / 1000);

  // Calculate score
  result.calculateScore();
  result.scoring.grade = result.calculateGrade();

  // Update analytics
  result.analytics.questionsAttempted = result.answers.filter(a => 
    a.userAnswer !== null && a.userAnswer !== undefined && a.userAnswer !== ''
  ).length;
  result.analytics.questionsSkipped = result.answers.filter(a => 
    !a.userAnswer || a.userAnswer === ''
  ).length;
  result.analytics.averageTimePerQuestion = result.answers.length > 0 ? 
    result.totalTimeSpent / result.answers.length : 0;
  result.analytics.flaggedQuestions = result.answers
    .filter(a => a.flagged)
    .map(a => a.questionId);

  await result.save();

  // Update exam status if this was the last submission
  if (exam.status === 'in_progress') {
    const activeResults = await Result.countDocuments({
      examId,
      status: 'in_progress'
    });

    if (activeResults === 0) {
      exam.status = 'completed';
      exam.endTime = new Date();
      await exam.save();
    }
  }

  // Log exam completion
  console.log(`Exam completed: ${examId} by user ${userId}, score: ${result.scoring.percentage}%`);

  res.json(APIResponse.success({
    result: {
      resultId: result.resultId,
      examId: result.examId,
      status: result.status,
      startTime: result.startTime,
      endTime: result.endTime,
      totalTimeSpent: result.totalTimeSpent,
      scoring: {
        totalPoints: result.scoring.totalPoints,
        maxPossiblePoints: result.scoring.maxPossiblePoints,
        percentage: result.scoring.percentage,
        grade: result.scoring.grade
      },
      analytics: result.analytics,
      answers: result.answers
    }
  }, 'Exam submitted successfully'));
});

/**
 * Get exam results
 * GET /api/v1/exams/:examId/results
 */
exports.getExamResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;

  // Find the result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'completed'
  }).populate('exam');

  if (!result) {
    throw new AppError('Exam results not found', HTTP_STATUS.NOT_FOUND);
  }

  res.json(APIResponse.success({
    result: {
      resultId: result.resultId,
      examId: result.examId,
      examTitle: result.exam?.title || 'Unknown Exam',
      status: result.status,
      startTime: result.startTime,
      endTime: result.endTime,
      totalTimeSpent: result.totalTimeSpent,
      scoring: result.scoring,
      analytics: result.analytics,
      answers: result.answers
    }
  }, 'Exam results retrieved successfully'));
});

/**
 * Get exam progress
 * GET /api/v1/exams/:examId/progress
 */
exports.getExamProgress = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;

  // Find the active result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'in_progress'
  }).populate('exam');

  if (!result) {
    throw new AppError('No active exam session found', HTTP_STATUS.NOT_FOUND);
  }

  res.json(APIResponse.success({
    progress: {
      resultId: result.resultId,
      examId: result.examId,
      examTitle: result.exam?.title || 'Unknown Exam',
      startTime: result.startTime,
      timeElapsed: Math.floor((new Date() - result.startTime) / 1000),
      totalTimeLimit: result.exam?.totalTimeLimit || 0,
      questionsAttempted: result.analytics.questionsAttempted,
      totalQuestions: result.exam?.questions?.length || 0,
      currentScore: result.scoring.percentage,
      answers: result.answers
    }
  }, 'Exam progress retrieved successfully'));
});

/**
 * Create a new exam
 * POST /api/v1/exams
 */
exports.createExam = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const examData = req.body;

  // Generate unique exam ID
  const examId = `exam_${uuidv4()}`;

  // Create new exam
  const exam = new Exam({
    examId,
    userId,
    ...examData
  });

  await exam.save();

  res.status(HTTP_STATUS.CREATED).json(APIResponse.success({
    exam: {
      examId: exam.examId,
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      configuration: exam.configuration,
      status: exam.status,
      createdAt: exam.createdAt
    }
  }, 'Exam created successfully'));
});

/**
 * Log security violation
 * POST /api/v1/exams/:examId/violations
 */
exports.logSecurityViolation = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;
  const { violationType, severity, details, timestamp } = req.body;

  // Validate violation type
  const validViolationTypes = [
    'fullscreen_exit', 'tab_switch', 'window_blur', 'right_click',
    'copy_paste', 'keyboard_shortcut', 'text_selection', 'browser_navigation',
    'developer_tools', 'multiple_monitors', 'suspicious_activity',
    'network_disconnection', 'unauthorized_software', 'face_not_detected',
    'multiple_faces', 'audio_detection', 'screen_sharing', 'virtual_machine',
    'mobile_device_detected', 'unusual_mouse_behavior', 'rapid_clicking',
    'automated_behavior'
  ];

  if (!validViolationTypes.includes(violationType)) {
    throw new AppError('Invalid violation type', HTTP_STATUS.BAD_REQUEST);
  }

  // Find active exam result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'in_progress'
  });

  if (!result) {
    throw new AppError('No active exam found', HTTP_STATUS.NOT_FOUND);
  }

  // Create security violation record
  const violation = new SecurityViolation({
    violationId: uuidv4(),
    userId,
    examId,
    resultId: result.resultId,
    violationType,
    severity: severity || 'medium',
    timestamp: timestamp || new Date(),
    details: {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      sessionId: req.sessionID,
      ...details
    },
    context: {
      examTitle: result.examTitle || 'Mock Interview',
      questionIndex: details?.questionIndex || 0,
      timeElapsed: Date.now() - new Date(result.startTime).getTime()
    }
  });

  await violation.save();

  // Log security event
  logger.warn('Security violation detected', {
    violationId: violation.violationId,
    userId: userId.toString(),
    examId,
    violationType,
    severity,
    timestamp: violation.timestamp
  });

  // Check if exam should be terminated due to excessive violations
  const violationCount = await SecurityViolation.countDocuments({
    userId,
    examId,
    severity: { $in: ['high', 'critical'] }
  });

  let shouldTerminate = false;
  if (violationCount >= 3) {
    shouldTerminate = true;
    // Update result status to terminated
    await Result.findOneAndUpdate(
      { resultId: result.resultId },
      { 
        status: 'terminated',
        endTime: new Date(),
        terminationReason: 'excessive_security_violations'
      }
    );
  }

  res.json(APIResponse.success({
    violationId: violation.violationId,
    violationCount,
    shouldTerminate,
    message: shouldTerminate ? 'Exam terminated due to excessive violations' : 'Violation logged'
  }, 'Security violation logged successfully'));
});

/**
 * Get fullscreen status
 * GET /api/v1/exams/:examId/fullscreen-status
 */
exports.getFullscreenStatus = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;

  // Find active exam result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'in_progress'
  });

  if (!result) {
    throw new AppError('No active exam found', HTTP_STATUS.NOT_FOUND);
  }

  // Get recent fullscreen violations
  const recentViolations = await SecurityViolation.find({
    userId,
    examId,
    violationType: 'fullscreen_exit',
    timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
  }).sort({ timestamp: -1 }).limit(10);

  // Get total violation count
  const totalViolations = await SecurityViolation.countDocuments({
    userId,
    examId,
    violationType: 'fullscreen_exit'
  });

  res.json(APIResponse.success({
    examId,
    userId: userId.toString(),
    isFullscreenRequired: true,
    totalViolations,
    recentViolations: recentViolations.map(v => ({
      violationId: v.violationId,
      timestamp: v.timestamp,
      severity: v.severity,
      details: v.details
    })),
    status: result.status,
    warningThreshold: 2,
    terminationThreshold: 3
  }, 'Fullscreen status retrieved successfully'));
});

/**
 * Update fullscreen status
 * POST /api/v1/exams/:examId/fullscreen-status
 */
exports.updateFullscreenStatus = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user._id;
  const { isFullscreen, timestamp } = req.body;

  // Find active exam result
  const result = await Result.findOne({
    examId,
    userId,
    status: 'in_progress'
  });

  if (!result) {
    throw new AppError('No active exam found', HTTP_STATUS.NOT_FOUND);
  }

  // If fullscreen was exited, log as violation
  if (!isFullscreen) {
    const violation = new SecurityViolation({
      violationId: uuidv4(),
      userId,
      examId,
      resultId: result.resultId,
      violationType: 'fullscreen_exit',
      severity: 'high',
      timestamp: timestamp || new Date(),
      details: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        sessionId: req.sessionID,
        automaticDetection: true
      },
      context: {
        examTitle: result.examTitle || 'Mock Interview',
        timeElapsed: Date.now() - new Date(result.startTime).getTime()
      }
    });

    await violation.save();

    // Log security event
    logger.warn('Fullscreen exit detected', {
      violationId: violation.violationId,
      userId: userId.toString(),
      examId,
      timestamp: violation.timestamp
    });
  }

  res.json(APIResponse.success({
    examId,
    userId: userId.toString(),
    isFullscreen,
    timestamp: timestamp || new Date(),
    message: isFullscreen ? 'Fullscreen status updated' : 'Fullscreen exit logged as violation'
  }, 'Fullscreen status updated successfully'));
});