const express = require('express');
const router = express.Router();
const { AuthMiddleware } = require('../middleware/auth');
const { PerformanceMonitor, QueryOptimizer } = require('../utils/performance');
const DatabaseManager = require('../config/database');
const { MigrationManager } = require('../utils/migrations');
const { asyncHandler } = require('../middleware/errorHandler');
const { APIResponse, HTTP_STATUS } = require('../utils/responseFormatter');
const { AppError } = require('../middleware/errorHandler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const { v4: uuidv4 } = require('uuid');

/**
 * Admin Routes for System Management
 * Requires admin authentication
 */

// Apply authentication and admin authorization to all routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').lean();
  
  const response = APIResponse.success(
    { users },
    'Users retrieved successfully'
  );
  response.send(res, HTTP_STATUS.OK);
}));

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
  }
  
  const user = await User.findById(id).select('-password').lean();
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  const response = APIResponse.success(
    { user },
    'User retrieved successfully'
  );
  response.send(res, HTTP_STATUS.OK);
}));

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid user ID', HTTP_STATUS.BAD_REQUEST);
  }
  
  const user = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).select('-password').lean();
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  const response = APIResponse.success(
    { user },
    'User updated successfully'
  );
  response.send(res, HTTP_STATUS.OK);
}));

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get system analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const totalResults = await Result.countDocuments();
  
  const analytics = {
    totalUsers,
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers
    },
    exams: {
      totalResults: totalResults
    }
  };
  
  const response = APIResponse.success(
    { analytics },
    'Analytics retrieved successfully'
  );
  response.send(res, HTTP_STATUS.OK);
}));

/**
 * @swagger
 * /api/v1/admin/exams:
 *   post:
 *     summary: Create a new exam (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Exam created successfully
 */
router.post('/exams', asyncHandler(async (req, res) => {
  const examData = req.body;
  const userId = req.user._id;

  // Generate unique exam ID
  const examId = `exam_${uuidv4()}`;

  // Create new exam
  const exam = new Exam({
    examId,
    userId,
    status: 'active', // Set exam as active so candidates can start it
    ...req.body
  });

  await exam.save();

  const response = APIResponse.success({
    exam: {
      examId: exam.examId,
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      configuration: exam.configuration,
      status: exam.status,
      createdAt: exam.createdAt
    }
  }, 'Exam created successfully');
  response.send(res, HTTP_STATUS.CREATED);
}));

/**
 * @swagger
 * /api/v1/admin/performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: object
 *                     requests:
 *                       type: object
 *                     database:
 *                       type: object
 *                     memory:
 *                       type: object
 *                     system:
 *                       type: object
 */
router.get('/performance', asyncHandler(async (req, res) => {
  // Get performance monitor instance from app locals or create new one
  const performanceMonitor = req.app.locals.performanceMonitor || new PerformanceMonitor();
  
  const stats = performanceMonitor.getStats();
  
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/v1/admin/performance/report:
 *   get:
 *     summary: Get detailed performance report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance report generated successfully
 */
router.get('/performance/report', asyncHandler(async (req, res) => {
  const performanceMonitor = req.app.locals.performanceMonitor || new PerformanceMonitor();
  
  const report = performanceMonitor.generateReport();
  
  res.json({
    success: true,
    data: report
  });
}));

/**
 * @swagger
 * /api/v1/admin/performance/slow-queries:
 *   get:
 *     summary: Get slow database queries
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of slow queries to return
 *     responses:
 *       200:
 *         description: Slow queries retrieved successfully
 */
router.get('/performance/slow-queries', asyncHandler(async (req, res) => {
  const performanceMonitor = req.app.locals.performanceMonitor || new PerformanceMonitor();
  const limit = parseInt(req.query.limit) || 20;
  
  const slowQueries = performanceMonitor.getSlowQueries(limit);
  
  res.json({
    success: true,
    data: {
      queries: slowQueries,
      total: slowQueries.length,
      limit
    }
  });
}));

/**
 * @swagger
 * /api/v1/admin/database/stats:
 *   get:
 *     summary: Get database statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database statistics retrieved successfully
 */
router.get('/database/stats', asyncHandler(async (req, res) => {
  const stats = await DatabaseManager.getPerformanceStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

/**
 * @swagger
 * /api/v1/admin/database/health:
 *   get:
 *     summary: Get database health status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database health status retrieved successfully
 */
router.get('/database/health', asyncHandler(async (req, res) => {
  const health = await DatabaseManager.healthCheck();
  
  res.json({
    success: true,
    data: health
  });
}));

/**
 * @swagger
 * /api/v1/admin/database/optimize:
 *   post:
 *     summary: Optimize database collections
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database optimization completed successfully
 */
router.post('/database/optimize', asyncHandler(async (req, res) => {
  const result = await DatabaseManager.optimizeCollections();
  
  res.json({
    success: true,
    message: 'Database optimization completed',
    data: result
  });
}));

/**
 * @swagger
 * /api/v1/admin/database/analyze-slow-queries:
 *   get:
 *     summary: Analyze slow queries and get optimization suggestions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow query analysis completed successfully
 */
router.get('/database/analyze-slow-queries', asyncHandler(async (req, res) => {
  const slowQueries = await DatabaseManager.analyzeSlowQueries();
  
  res.json({
    success: true,
    data: slowQueries
  });
}));

/**
 * @swagger
 * /api/v1/admin/migrations/status:
 *   get:
 *     summary: Get migration status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration status retrieved successfully
 */
router.get('/migrations/status', asyncHandler(async (req, res) => {
  const migrationManager = new MigrationManager();
  const status = await migrationManager.getStatus();
  
  res.json({
    success: true,
    data: status
  });
}));

/**
 * @swagger
 * /api/v1/admin/migrations/run:
 *   post:
 *     summary: Run pending migrations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migrations executed successfully
 */
router.post('/migrations/run', asyncHandler(async (req, res) => {
  const migrationManager = new MigrationManager();
  const result = await migrationManager.migrate();
  
  res.json({
    success: true,
    message: `Executed ${result.executed} migrations`,
    data: result
  });
}));

/**
 * @swagger
 * /api/v1/admin/migrations/rollback:
 *   post:
 *     summary: Rollback migrations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               steps:
 *                 type: integer
 *                 default: 1
 *                 description: Number of migrations to rollback
 *     responses:
 *       200:
 *         description: Migrations rolled back successfully
 */
router.post('/migrations/rollback', asyncHandler(async (req, res) => {
  const migrationManager = new MigrationManager();
  const steps = req.body.steps || 1;
  
  const result = await migrationManager.rollback(steps);
  
  res.json({
    success: true,
    message: `Rolled back ${result.rolledBack} migrations`,
    data: result
  });
}));

/**
 * @swagger
 * /api/v1/admin/system/info:
 *   get:
 *     summary: Get system information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 */
router.get('/system/info', asyncHandler(async (req, res) => {
  const os = require('os');
  const process = require('process');
  
  const systemInfo = {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime()
    },
    os: {
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus().length
    },
    database: {
      connectionState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };
  
  res.json({
    success: true,
    data: systemInfo
  });
}));

/**
 * @swagger
 * /api/v1/admin/collections/stats:
 *   get:
 *     summary: Get collection statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Collection statistics retrieved successfully
 */
router.get('/collections/stats', asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  const stats = [];
  
  for (const collection of collections) {
    try {
      const collStats = await db.collection(collection.name).stats();
      stats.push({
        name: collection.name,
        count: collStats.count,
        size: collStats.size,
        avgObjSize: collStats.avgObjSize,
        storageSize: collStats.storageSize,
        indexes: collStats.nindexes,
        indexSize: collStats.totalIndexSize
      });
    } catch (error) {
      // Some collections might not support stats
      stats.push({
        name: collection.name,
        error: 'Stats not available'
      });
    }
  }
  
  res.json({
    success: true,
    data: {
      collections: stats,
      total: collections.length
    }
  });
}));

/**
 * @swagger
 * /api/v1/admin/cleanup/old-data:
 *   post:
 *     summary: Clean up old data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 90
 *                 description: Number of days to keep data
 *     responses:
 *       200:
 *         description: Data cleanup completed successfully
 */
router.post('/cleanup/old-data', asyncHandler(async (req, res) => {
  const days = req.body.days || 90;
  const result = await DatabaseManager.cleanupOldData(days);
  
  res.json({
    success: true,
    message: `Cleaned up data older than ${days} days`,
    data: result
  });
}));

/**
 * @swagger
 * /api/v1/admin/query/analyze:
 *   post:
 *     summary: Analyze query performance
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collection:
 *                 type: string
 *                 description: Collection name to analyze
 *               query:
 *                 type: object
 *                 description: MongoDB query to analyze
 *     responses:
 *       200:
 *         description: Query analysis completed successfully
 */
router.post('/query/analyze', asyncHandler(async (req, res) => {
  const { collection, query } = req.body;
  
  if (!collection || !query) {
    return res.status(400).json({
      success: false,
      message: 'Collection name and query are required'
    });
  }
  
  // Get the model for the collection
  const modelName = collection.charAt(0).toUpperCase() + collection.slice(1).toLowerCase();
  const Model = mongoose.model(modelName);
  
  const analysis = await QueryOptimizer.analyzeQuery(Model, query);
  
  res.json({
    success: true,
    data: analysis
  });
}));

module.exports = router;