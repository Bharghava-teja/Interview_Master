const mongoose = require('mongoose');
const { emailValidator, passwordValidator } = require('../utils/validation');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    lowercase: true,
    trim: true,
    validate: [emailValidator, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Exclude password from queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'candidate'],
    default: 'user',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Security fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  lockUntil: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastKnownIP: {
    type: String
  },
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  // API access
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
    select: false
  },
  apiKeyCreatedAt: {
    type: Date
  },
  // Permissions
  permissions: [{
    type: String,
    enum: [
      'read:exams',
      'write:exams', 
      'delete:exams',
      'read:users',
      'write:users',
      'delete:users',
      'read:results',
      'write:results',
      'admin:system'
    ]
  }],
  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    organization: String,
    department: String,
    position: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    avatar: String
  },
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  // Metadata
  metadata: {
    registrationIP: String,
    registrationUserAgent: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: Date,
    termsAcceptedAt: Date,
    privacyPolicyAcceptedAt: Date
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.twoFactorSecret;
      delete ret.apiKey;
      delete ret.emailVerificationToken;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.twoFactorSecret;
      delete ret.apiKey;
      delete ret.emailVerificationToken;
      return ret;
    }
  }
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Instance methods
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      accountLocked: true
    };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { accountLocked: false }
  });
};

userSchema.methods.createPasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createAPIKey = function() {
  const crypto = require('crypto');
  const apiKey = 'ak_' + crypto.randomBytes(32).toString('hex');
  
  this.apiKey = apiKey;
  this.apiKeyCreatedAt = new Date();
  
  return apiKey;
};

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions && this.permissions.includes(permission);
};

userSchema.methods.addPermission = function(permission) {
  if (!this.permissions) this.permissions = [];
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
};

userSchema.methods.removePermission = function(permission) {
  if (this.permissions) {
    this.permissions = this.permissions.filter(p => p !== permission);
  }
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByAPIKey = function(apiKey) {
  return this.findOne({ apiKey, isActive: true });
};

userSchema.statics.findByResetToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

// Indexes (most are already defined in field definitions)
// email already has unique: true in field definition

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update passwordChangedAt when password is modified
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  }
  
  // Update lastActivity
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);