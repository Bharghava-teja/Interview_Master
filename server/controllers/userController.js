const User = require('../models/User');
const { APIResponse, HTTP_STATUS } = require('../utils/responseFormatter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'Profile retrieved successfully'
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.getProfile = asyncHandler(async (req, res) => {
  // req.user is already the full user object from AuthMiddleware.authenticate
  const user = req.user;
  
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  const response = APIResponse.success(
    user,
    'Profile retrieved successfully'
  );
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: 'John Doe'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.doe@example.com'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'Profile updated successfully'
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/APIResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, firstName, lastName, phone, organization, department, position, timezone, language } = req.body;
  const userId = req.user._id;
  
  // Find current user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  
  // Check if email is being changed and if it's already in use
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      throw new AppError('Email already in use', HTTP_STATUS.CONFLICT);
    }
  }
  
  // Update user fields
  if (name) user.name = name;
  if (email) user.email = email;
  
  // Update profile fields
  if (firstName !== undefined) user.profile.firstName = firstName;
  if (lastName !== undefined) user.profile.lastName = lastName;
  if (phone !== undefined) user.profile.phone = phone;
  if (organization !== undefined) user.profile.organization = organization;
  if (department !== undefined) user.profile.department = department;
  if (position !== undefined) user.profile.position = position;
  if (timezone !== undefined) user.profile.timezone = timezone;
  if (language !== undefined) user.profile.language = language;
  
  await user.save();
  
  const response = APIResponse.success(
    user,
    'Profile updated successfully'
  );
  response.send(res, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/APIResponse'
 *                 - properties:
 *                     success:
 *                       example: true
 *                     message:
 *                       example: 'Statistics retrieved successfully'
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalExams:
 *                           type: integer
 *                           example: 15
 *                         averageScore:
 *                           type: number
 *                           example: 85.5
 *                         passedExams:
 *                           type: integer
 *                           example: 12
 *                         totalTimeSpent:
 *                           type: integer
 *                           description: Total time in minutes
 *                           example: 450
 *                         recentActivity:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               examId:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               score:
 *                                 type: number
 *                               completedAt:
 *                                 type: string
 *                                 format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const Result = require('../models/Result');
  
  // Get user statistics
  const stats = await Result.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        averageScore: { $avg: '$score' },
        passedExams: { $sum: { $cond: [{ $gte: ['$score', 60] }, 1, 0] } },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    }
  ]);
  
  // Get recent activity (last 5 exams)
  const recentActivity = await Result.find({ userId })
    .sort({ completedAt: -1 })
    .limit(5)
    .select('examId title score completedAt')
    .lean();
  
  const userStats = {
    totalExams: stats[0]?.totalExams || 0,
    averageScore: Math.round((stats[0]?.averageScore || 0) * 100) / 100,
    passedExams: stats[0]?.passedExams || 0,
    totalTimeSpent: stats[0]?.totalTimeSpent || 0,
    recentActivity
  };
  
  const response = APIResponse.success(
    { stats: userStats },
    'Statistics retrieved successfully'
  );
  response.send(res, HTTP_STATUS.OK);
});