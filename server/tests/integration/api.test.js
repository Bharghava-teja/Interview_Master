const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Exam = require('../../models/Exam');
const Result = require('../../models/Result');

/**
 * API Integration Tests
 * Tests complete API workflows and endpoint interactions
 */

describe('API Integration Tests', () => {
  let app;
  let server;
  let testUser;
  let authToken;
  let adminUser;
  let adminToken;
  
  beforeAll(async () => {
    // Create Express app with all middleware
    app = express();
    
    // Basic middleware setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(require('cookie-parser')());
    
    // Import middleware
    const { AuthMiddleware } = require('../../middleware/auth');
    
    // Import and setup routes
    const authRoutes = require('../../routes/auth');
    const userRoutes = require('../../routes/user');
    const adminRoutes = require('../../routes/admin');
    const examRoutes = require('../../routes/exam');
    
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', AuthMiddleware.authenticate, userRoutes);
    app.use('/api/v1/admin', AuthMiddleware.authenticate, AuthMiddleware.authorize('admin'), adminRoutes);
    app.use('/api/v1/exams', AuthMiddleware.authenticate, examRoutes);
    
    // Error handling middleware
    const { globalErrorHandler, handleNotFound } = require('../../middleware/errorHandler');
    app.use(handleNotFound);
    app.use(globalErrorHandler);
  });
  
  beforeEach(async () => {
    // Create test users
    testUser = await global.testUtils.createTestUser({
      email: 'integration@example.com',
      password: 'Password123!',
      role: 'candidate'
    });
    
    adminUser = await global.testUtils.createTestUser({
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin'
    });
    
    // Generate auth tokens
    authToken = global.testUtils.generateTestToken(testUser._id, 'candidate');
    adminToken = global.testUtils.generateTestToken(adminUser._id, 'admin');
  });
  
  describe('Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // 1. Register new user
      const registrationData = {
        email: 'newintegration@example.com',
        password: 'Password123!',
        name: 'Integration Test'
      };
      
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201);
      
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.token).toBeDefined();
      
      // 2. Login with new credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password
        })
        .expect(200);
      
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      
      // 3. Access protected route with token
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);
      
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(registrationData.email);
    });
    
    it('should handle token refresh flow', async () => {
      // 1. Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'Password123!'
        })
        .expect(200);
      
      const { refreshToken } = loginResponse.body.data;
      
      // 2. Use refresh token to get new access token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.token).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();
      
      // 3. Use new token to access protected route
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${refreshResponse.body.data.token}`)
        .expect(200);
      
      expect(profileResponse.body.success).toBe(true);
    });
  });
  
  describe('User Profile Management', () => {
    it('should get and update user profile', async () => {
      // 1. Get current profile
      const getResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.email).toBe('integration@example.com');
      
      // 2. Update profile
      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        organization: 'Test Org'
      };
      
      const updateResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.profile.firstName).toBe('Updated');
      expect(updateResponse.body.data.profile.lastName).toBe('User');
      expect(updateResponse.body.data.profile.organization).toBe('Test Org');
      
      // 3. Verify changes persisted
      const verifyResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(verifyResponse.body.data.profile.firstName).toBe('Updated');
      expect(verifyResponse.body.data.profile.lastName).toBe('User');
      expect(verifyResponse.body.data.profile.organization).toBe('Test Org');
    });
    
    it('should get user statistics', async () => {
      // Create some test data
      await global.testUtils.createTestExam({
        userId: testUser._id,
        status: 'completed'
      });
      
      await global.testUtils.createTestResult({
        userId: testUser._id,
        scoring: { 
          totalPoints: 8.5,
          maxPossiblePoints: 10,
          percentage: 85, 
          passed: true 
        }
      });
      
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalExams).toBeGreaterThan(0);
    });
  });
  
  describe('Exam Management Flow', () => {
    it('should create, start, and complete exam workflow', async () => {
      // 1. Create exam (admin)
      const examData = {
        examType: 'mcq',
        totalTimeLimit: 1800, // 30 minutes in seconds
        configuration: {
          mcqCategory: 'javascript',
          mcqDifficulty: 'medium',
          numberOfQuestions: 5,
          mcqTimeLimit: 900 // 15 minutes in seconds
        },
        title: 'Integration Test Exam',
        description: 'Test exam for integration testing'
      };
      
      const createResponse = await request(app)
        .post('/api/v1/admin/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData)
        .expect(201);
      
      expect(createResponse.body.success).toBe(true);
      const examId = createResponse.body.data.exam.examId;
      
      // 2. Start exam (candidate)
      const startResponse = await request(app)
        .post(`/api/v1/exams/${examId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
      
      if (startResponse.status !== 200) {
        console.log('Start exam error:', startResponse.status, startResponse.body);
      }
      expect(startResponse.status).toBe(200);
      
      expect(startResponse.body.success).toBe(true);
      expect(startResponse.body.data.exam.status).toBe('in_progress');
      
      // 3. Submit answers
      const answers = {
        answers: [
          { questionId: 'q1', selectedOption: 'A' },
          { questionId: 'q2', selectedOption: 'B' },
          { questionId: 'q3', selectedOption: 'C' }
        ]
      };
      
      const submitResponse = await request(app)
        .post(`/api/v1/exams/${examId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(answers)
        .expect(200);
      
      expect(submitResponse.body.success).toBe(true);
      expect(submitResponse.body.data.result).toBeDefined();
      
      // 4. Get exam results
      const resultsResponse = await request(app)
        .get(`/api/v1/exams/${examId}/results`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(resultsResponse.body.success).toBe(true);
      expect(resultsResponse.body.data.result.status).toBe('completed');
    });
  });
  
  describe('Admin Operations', () => {
    it('should perform admin user management operations', async () => {
      // 1. Get all users (admin only)
      const usersResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(usersResponse.body.success).toBe(true);
      expect(Array.isArray(usersResponse.body.data.users)).toBe(true);
      
      // 2. Get user details
      const userResponse = await request(app)
        .get(`/api/v1/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(userResponse.body.success).toBe(true);
      expect(userResponse.body.data.user._id).toBe(testUser._id.toString());
      
      // 3. Update user role
      const updateResponse = await request(app)
        .put(`/api/v1/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' })
        .expect(200);
      
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.user.role).toBe('moderator');
    });
    
    it('should get system analytics', async () => {
      // Create test data
      await global.testUtils.createTestExam({ status: 'completed' });
      await global.testUtils.createTestResult({ 
        scoring: { 
          totalPoints: 7,
          maxPossiblePoints: 10,
          percentage: 70,
          passed: true 
        } 
      });
      
      const response = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
      expect(response.body.data.analytics.totalUsers).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });
    
    it('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should handle insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${authToken}`) // candidate token
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('permission');
    });
    
    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
    
    it('should handle resource not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/v1/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });
  
  describe('Performance and Caching', () => {
    it('should cache frequently accessed data', async () => {
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time1 = Date.now() - start1;
      
      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time2 = Date.now() - start2;
      
      expect(response1.body.data.email).toBe(response2.body.data.email);
      // Second request should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });
    
    it('should handle concurrent requests', async () => {
      const promises = [];
      
      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/v1/users/profile')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
  
  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      // Create exam
      const exam = await global.testUtils.createTestExam({
        userId: testUser._id,
        status: 'active'
      });
      
      // Start exam
      const startResponse = await request(app)
        .post(`/api/v1/exams/${exam.examId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(startResponse.status).toBe(200);
      
      // Verify exam status changed
      const Exam = require('../../models/Exam');
      const updatedExam = await Exam.findOne({ examId: exam.examId });
      expect(updatedExam.status).toBe('in_progress');
      expect(updatedExam.startTime).toBeDefined();
      
      // Submit exam
      const submitResponse = await request(app)
        .post(`/api/v1/exams/${exam.examId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            { questionId: 'q1', selectedOption: 'A' }
          ]
        })
        .expect(200);
      
      // Verify result was created
      const Result = require('../../models/Result');
      const result = await Result.findOne({ examId: exam.examId });
      expect(result).toBeTruthy();
      expect(result.status).toBe('completed');
      
      // Verify exam status updated
      const finalExam = await Exam.findOne({ examId: exam.examId });
      expect(finalExam.status).toBe('completed');
      expect(finalExam.endTime).toBeDefined();
    });
  });
});