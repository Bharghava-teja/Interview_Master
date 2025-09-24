const express = require('express');
const router = express.Router();
const { AuthMiddleware } = require('../middleware/auth');
const { enforceFullscreen, validateFullscreenHeaders, logFullscreenChanges } = require('../middleware/fullscreenSecurity');
const examController = require('../controllers/examController');

// Create a new exam
router.post('/', AuthMiddleware.authenticate, examController.createExam);

// Start an exam
router.post('/:examId/start', AuthMiddleware.authenticate, validateFullscreenHeaders, logFullscreenChanges, examController.startExam);

// Submit exam answers
router.post('/:examId/submit', AuthMiddleware.authenticate, validateFullscreenHeaders, enforceFullscreen, examController.submitExam);

// Get exam results
router.get('/:examId/results', AuthMiddleware.authenticate, examController.getExamResults);

// Get exam progress
router.get('/:examId/progress', AuthMiddleware.authenticate, validateFullscreenHeaders, enforceFullscreen, examController.getExamProgress);

// Log security violation
router.post('/:examId/violations', AuthMiddleware.authenticate, examController.logSecurityViolation);

// Get fullscreen status
router.get('/:examId/fullscreen-status', AuthMiddleware.authenticate, examController.getFullscreenStatus);

// Update fullscreen status
router.post('/:examId/fullscreen-status', AuthMiddleware.authenticate, examController.updateFullscreenStatus);

module.exports = router;