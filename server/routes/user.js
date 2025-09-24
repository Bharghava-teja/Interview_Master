const express = require('express');
const router = express.Router();
const { AuthMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Result = require('../models/Result');
const mongoose = require('mongoose');

// Get user profile
router.get('/profile', AuthMiddleware.authenticate, userController.getProfile);

// Update user profile
router.put('/profile', AuthMiddleware.authenticate, userController.updateProfile);

// Get user statistics
router.get('/stats', AuthMiddleware.authenticate, userController.getUserStats);

// Update password
router.put('/password', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;