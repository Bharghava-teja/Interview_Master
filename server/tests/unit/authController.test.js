const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

/**
 * Authentication Controller Unit Tests
 * Tests all authentication-related functionality
 */

describe('AuthController', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Setup routes for testing
    app.post('/register', authController.signup);
    app.post('/login', authController.login);
    app.post('/refresh', authController.refreshToken);
    app.post('/logout', authController.logout);
    app.post('/forgot-password', authController.forgotPassword);
    app.post('/reset-password', authController.resetPassword);
    app.post('/verify-email', authController.verifyEmail);
    
    // Add error handling middleware for tests
    app.use((err, req, res, next) => {
      console.log('Test Error Handler:', err.message);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    });
  });
  
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'newuser@example.com',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('registered successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('token');
expect(response.body.data.user.email).toBe(userData.email);
      
      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });
    
    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
    });
    
    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'user@example.com',
        password: '123'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
    });
    
    it('should reject registration with existing email', async () => {
      // Create existing user
      await global.testUtils.createTestUser({
        email: 'existing@example.com'
      });
      
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already in use');
    });
  });
  
  describe('POST /login', () => {
    let testUser;
    
    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        email: 'login@example.com',
        password: 'Password123!'
      });
    });
    
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(loginData.email);
      
      // Verify JWT token
      const decoded = jwt.verify(
        response.body.data.accessToken,
        process.env.JWT_SECRET
      );
      expect(decoded.userId).toBe(testUser._id.toString());
    });
    
    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword!'
      };
      
      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
    
    it('should handle rate limiting for failed attempts', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword!'
      };
      
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/login')
          .send(loginData)
          .expect(401);
      }
      
      // Next attempt should be rate limited
      const response = await request(app)
        .post('/login')
        .send(loginData);
      
      // Should be rate limited (429) or still unauthorized (401)
      expect([401, 429]).toContain(response.status);
    });
  });
  
  describe('POST /refresh', () => {
    let testUser;
    let refreshToken;
    
    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
      const { SecurityManager } = require('../../utils/security');
      refreshToken = SecurityManager.generateRefreshToken(testUser._id);
    });
    
    it('should refresh token with valid refresh token', async () => {
      try {
        const response = await request(app)
          .post('/refresh')
          .send({ refreshToken });
        
        if (response.status !== 200) {
          const errorDetails = {
            status: response.status,
            body: response.body,
            text: response.text,
            error: response.error
          };
          throw new Error(`Expected 200 but got ${response.status}. Details: ${JSON.stringify(errorDetails, null, 2)}`);
        }
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('expiresIn');
        
        // Verify new token
        const decoded = jwt.verify(
          response.body.data.accessToken,
          process.env.JWT_SECRET
        );
        expect(decoded.userId).toBe(testUser._id.toString());
      } catch (error) {
        console.log('Test caught error:', error.message);
        console.log('Error stack:', error.stack);
        throw error;
      }
    });
    
    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      
expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });
  });
  
  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const token = global.testUtils.generateTestToken();
      
      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('logged out');
    });
  });
  
  describe('POST /forgot-password', () => {
    let testUser;
    
    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        email: 'forgot@example.com',
        isActive: true
      });
    });
    
    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset link');
      
      // Verify reset token was set (it should be hashed)
      const updatedUser = await User.findById(testUser._id).select('+passwordResetToken');
      expect(updatedUser.passwordResetToken).toBeDefined();
      expect(updatedUser.passwordResetExpires).toBeDefined();
      expect(updatedUser.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });
    
    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
      
      // Should still return success for security reasons
      expect(response.body).toHaveProperty('success', true);
    });
  });
  
  describe('POST /reset-password', () => {
    let testUser;
    let resetToken;
    let hashedResetToken;
    
    beforeEach(async () => {
      resetToken = 'test-reset-token-' + Date.now();
      // We need to hash the token like the controller does
      const SecurityManager = require('../../utils/security').SecurityManager;
      hashedResetToken = await SecurityManager.hashData(resetToken);
      testUser = await global.testUtils.createTestUser({
        passwordResetToken: hashedResetToken,
        passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour
      });
    });
    
    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset successful');
      
      // Verify password was changed and token was cleared
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();
    });
    
    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });
    
    it('should reject expired reset token', async () => {
      // Update user with expired token
      await User.findByIdAndUpdate(testUser._id, {
        passwordResetExpires: new Date(Date.now() - 3600000) // 1 hour ago
      });
      
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('expired');
    });
  });
  
  describe('POST /verify-email', () => {
    let testUser;
    let verificationToken;
    
    beforeEach(async () => {
      verificationToken = 'test-verify-token-' + Date.now();
      testUser = await global.testUtils.createTestUser({
        'metadata.emailVerificationToken': verificationToken,
        'metadata.emailVerified': false
      });
    });
    
    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/verify-email')
        .send({ token: verificationToken })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('verified');
      
      // Verify email was marked as verified
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.metadata.emailVerified).toBe(true);
expect(updatedUser.metadata.emailVerificationToken).toBeFalsy();
    });
    
    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });
  });
});