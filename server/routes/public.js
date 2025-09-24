const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { uploadResume } = require('../controllers/resumeController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/json' // Allow JSON for testing
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.json'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and JSON files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/v1/public/test-upload
 * @desc    Test upload and analyze a resume (no auth required)
 * @access  Public
 * @body    file: Resume file (PDF, DOC, DOCX, TXT)
 * @returns {Object} Resume analysis results
 */
router.post('/test-upload',
  upload.single('resume'),
  (req, res, next) => {
    // Mock user for testing with valid ObjectId
    req.user = { id: new mongoose.Types.ObjectId() };
    next();
  },
  uploadResume
);

module.exports = router;