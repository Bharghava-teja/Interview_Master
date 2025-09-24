const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { AuthMiddleware, AuthFactory } = require('../middleware/auth');
const { RateLimitManager, SecurityHeaders } = require('../utils/security');

// Apply security headers to all auth routes
router.use(SecurityHeaders.applyHeaders());

// Apply rate limiting
const authLimiter = RateLimitManager.createAuthLimiter();
const generalLimiter = RateLimitManager.createGeneralLimiter();

// Health check route (no rate limiting for monitoring)
router.get('/health', authController.healthCheck);

// Public routes (with strict rate limiting)
router.post('/signup', authLimiter, authController.signup);
router.post('/register', authLimiter, authController.signup); // Alias for signup
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/refresh', generalLimiter, authController.refreshToken);

// Protected routes (require authentication)
router.post('/logout', generalLimiter, AuthMiddleware.optionalAuth, authController.logout);
router.post('/change-password', generalLimiter, ...AuthFactory.protected(), authController.changePassword);
router.get('/profile', generalLimiter, ...AuthFactory.protected(), authController.getProfile);
router.get('/sessions', generalLimiter, ...AuthFactory.protected(), authController.getSessions);
router.post('/revoke-sessions', generalLimiter, ...AuthFactory.protected(), authController.revokeSessions);

module.exports = router;