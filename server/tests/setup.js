const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const redis = require('redis');

/**
 * Test Setup Configuration
 * Sets up in-memory databases for testing
 */

let mongoServer;
let redisClient;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  console.log('✅ Test MongoDB connected');
  
  // Setup Redis mock for testing
  jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
      connect: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      flushall: jest.fn(),
      on: jest.fn(),
      quit: jest.fn()
    }))
  }));
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close MongoDB connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ Test databases cleaned up');
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const { SecurityManager } = require('../utils/security');
    
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      isActive: true
    };
    
    const finalData = { ...defaultUser, ...userData };
    
    // Hash the password using SecurityManager
    if (finalData.password) {
      finalData.password = await SecurityManager.hashData(finalData.password);
    }
    
    const user = new User(finalData);
    return await user.save();
  },
  
  // Create test exam
  createTestExam: async (examData = {}) => {
    const Exam = require('../models/Exam');
    const mongoose = require('mongoose');
    const defaultExam = {
      examId: 'test-exam-' + Date.now(),
      userId: new mongoose.Types.ObjectId(),
      examType: 'mcq',
      title: 'Test Exam',
      status: 'pending',
      totalTimeLimit: 1800,
      configuration: {
        mcqCategory: 'javascript',
        mcqDifficulty: 'medium',
        numberOfQuestions: 10,
        mcqTimeLimit: 1800
      }
    };
    
    const exam = new Exam({ ...defaultExam, ...examData });
    return await exam.save();
  },
  
  // Create test result
  createTestResult: async (resultData = {}) => {
    const Result = require('../models/Result');
    const mongoose = require('mongoose');
    const defaultResult = {
      resultId: 'test-result-' + Date.now(),
      userId: new mongoose.Types.ObjectId(),
      examId: 'test-exam-id',
      exam: new mongoose.Types.ObjectId(),
      status: 'completed',
      scoring: {
        totalPoints: 7,
        maxPossiblePoints: 10,
        percentage: 70,
        totalQuestions: 10,
        correctAnswers: 7,
        passed: true
      }
    };
    
    const result = new Result({ ...defaultResult, ...resultData });
    return await result.save();
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId = 'test-user-id', role = 'user') => {
    const { SecurityManager } = require('../utils/security');
    return SecurityManager.generateJWT({ userId, role });
  },
  
  // Mock Redis operations
  mockRedis: {
    data: new Map(),
    
    get: jest.fn((key) => {
      const value = global.testUtils.mockRedis.data.get(key);
      return Promise.resolve(value ? JSON.stringify(value) : null);
    }),
    
    set: jest.fn((key, value) => {
      global.testUtils.mockRedis.data.set(key, JSON.parse(value));
      return Promise.resolve('OK');
    }),
    
    setex: jest.fn((key, ttl, value) => {
      global.testUtils.mockRedis.data.set(key, JSON.parse(value));
      return Promise.resolve('OK');
    }),
    
    del: jest.fn((key) => {
      const existed = global.testUtils.mockRedis.data.has(key);
      global.testUtils.mockRedis.data.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    }),
    
    exists: jest.fn((key) => {
      return Promise.resolve(global.testUtils.mockRedis.data.has(key) ? 1 : 0);
    }),
    
    flushall: jest.fn(() => {
      global.testUtils.mockRedis.data.clear();
      return Promise.resolve('OK');
    })
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SESSION_SECRET = 'test-session-secret-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Suppress logs during testing for cleaner output
// Temporarily disabled to debug refresh token issue
// if (process.env.SUPPRESS_TEST_LOGS === 'true') {
//   console.log = jest.fn();
//   console.warn = jest.fn();
//   console.error = jest.fn();
// }

console.log('🧪 Test environment initialized');