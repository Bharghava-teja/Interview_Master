const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    default: () => `log_${uuidv4()}`
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  sessionId: String,
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  statusCode: Number,
  responseTime: Number, // in milliseconds
  ipAddress: String,
  userAgent: String,
  requestHeaders: {
    type: Map,
    of: String
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    // Sensitive data will be filtered out
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed,
    // Only metadata, not full response
  },
  queryParams: {
    type: Map,
    of: String
  },
  pathParams: {
    type: Map,
    of: String
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data_access', 'security', 'exam', 'system'],
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  errorStack: String,
  metadata: {
    examId: String,
    resultId: String,
    violationType: String,
    riskScore: Number,
    deviceFingerprint: String,
    geolocation: {
      country: String,
      region: String,
      city: String
    }
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, severity: 1 });
auditLogSchema.index({ 'metadata.examId': 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Sensitive fields to exclude from logging
const SENSITIVE_FIELDS = [
  'password', 'token', 'authorization', 'cookie', 'session',
  'secret', 'key', 'private', 'confidential'
];

// Filter sensitive data from objects
const filterSensitiveData = (obj, maxDepth = 3, currentDepth = 0) => {
  if (!obj || typeof obj !== 'object' || currentDepth >= maxDepth) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map(item => filterSensitiveData(item, maxDepth, currentDepth + 1));
  }

  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field));
    
    if (isSensitive) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value, maxDepth, currentDepth + 1);
    } else if (typeof value === 'string' && value.length > 1000) {
      filtered[key] = value.substring(0, 1000) + '... [TRUNCATED]';
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Determine action category based on endpoint
const determineCategory = (endpoint, method) => {
  if (endpoint.includes('/auth') || endpoint.includes('/login') || endpoint.includes('/register')) {
    return 'authentication';
  }
  if (endpoint.includes('/violation') || endpoint.includes('/security')) {
    return 'security';
  }
  if (endpoint.includes('/exam') || endpoint.includes('/mcq') || endpoint.includes('/coding')) {
    return 'exam';
  }
  if (endpoint.includes('/user') || endpoint.includes('/profile')) {
    return 'data_access';
  }
  return 'system';
};

// Determine severity based on status code and endpoint
const determineSeverity = (statusCode, endpoint, method) => {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) {
    if (endpoint.includes('/auth') || endpoint.includes('/login')) {
      return 'warning';
    }
    return 'error';
  }
  if (endpoint.includes('/violation') || method === 'DELETE') {
    return 'warning';
  }
  return 'info';
};

// Extract client IP address
const getClientIP = (req) => {
  return req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown';
};

// Main audit logging middleware
const auditLogger = (options = {}) => {
  const {
    excludeEndpoints = ['/api/health', '/favicon.ico'],
    includeRequestBody = true,
    includeResponseBody = false,
    maxBodySize = 10000
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody = null;

    // Skip logging for excluded endpoints
    if (excludeEndpoints.some(endpoint => req.path.includes(endpoint))) {
      return next();
    }

    // Capture response body if needed
    if (includeResponseBody) {
      res.send = function(body) {
        responseBody = body;
        return originalSend.call(this, body);
      };
    }

    // Continue with request processing
    res.on('finish', async () => {
      try {
        const responseTime = Date.now() - startTime;
        const category = determineCategory(req.path, req.method);
        const severity = determineSeverity(res.statusCode, req.path, req.method);

        // Prepare audit log entry
        const auditEntry = {
          userId: req.user?.id || req.user?._id || null,
          sessionId: req.sessionID || req.headers['x-session-id'],
          action: `${req.method} ${req.path}`,
          resource: req.path,
          method: req.method,
          endpoint: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          requestHeaders: new Map(Object.entries(filterSensitiveData(req.headers) || {})),
          queryParams: new Map(Object.entries(req.query || {})),
          pathParams: new Map(Object.entries(req.params || {})),
          category,
          severity,
          success: res.statusCode < 400,
          tags: []
        };

        // Add request body if enabled and not too large
        if (includeRequestBody && req.body) {
          const bodyString = JSON.stringify(req.body);
          if (bodyString.length <= maxBodySize) {
            auditEntry.requestBody = filterSensitiveData(req.body);
          } else {
            auditEntry.requestBody = { _truncated: true, _size: bodyString.length };
          }
        }

        // Add response metadata
        if (includeResponseBody && responseBody) {
          try {
            const parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            auditEntry.responseBody = {
              hasError: !!parsedResponse.error,
              dataSize: JSON.stringify(parsedResponse).length,
              keys: Object.keys(parsedResponse || {})
            };
          } catch (e) {
            auditEntry.responseBody = { _parseError: true };
          }
        }

        // Add error information for failed requests
        if (res.statusCode >= 400) {
          auditEntry.errorMessage = res.locals.errorMessage || 'Request failed';
          if (res.locals.errorStack && severity === 'critical') {
            auditEntry.errorStack = res.locals.errorStack;
          }
        }

        // Add exam-specific metadata
        if (req.body?.examId || req.query?.examId || req.params?.examId) {
          auditEntry.metadata = {
            examId: req.body?.examId || req.query?.examId || req.params?.examId
          };
        }

        if (req.body?.violationType) {
          auditEntry.metadata = {
            ...auditEntry.metadata,
            violationType: req.body.violationType
          };
        }

        // Add performance tags
        if (responseTime > 5000) auditEntry.tags.push('slow_response');
        if (responseTime > 10000) auditEntry.tags.push('very_slow_response');
        if (res.statusCode >= 500) auditEntry.tags.push('server_error');
        if (res.statusCode === 429) auditEntry.tags.push('rate_limited');

        // Save audit log (non-blocking)
        setImmediate(async () => {
          try {
            await AuditLog.create(auditEntry);
          } catch (error) {
            console.error('Failed to save audit log:', error.message);
          }
        });

      } catch (error) {
        console.error('Audit logging error:', error.message);
      }
    });

    next();
  };
};

// Security event logger (for high-priority security events)
const logSecurityEvent = async (eventData) => {
  try {
    const securityLog = {
      action: eventData.action || 'security_event',
      resource: eventData.resource || '/security',
      method: 'POST',
      endpoint: eventData.endpoint || '/api/security/event',
      category: 'security',
      severity: eventData.severity || 'warning',
      userId: eventData.userId,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      success: false,
      metadata: eventData.metadata || {},
      tags: ['security_event', ...(eventData.tags || [])]
    };

    await AuditLog.create(securityLog);
  } catch (error) {
    console.error('Failed to log security event:', error.message);
  }
};

// Query audit logs with filters
const queryAuditLogs = async (filters = {}, options = {}) => {
  const {
    userId,
    category,
    severity,
    startDate,
    endDate,
    action,
    success,
    examId
  } = filters;

  const {
    limit = 100,
    page = 1,
    sortBy = 'timestamp',
    sortOrder = -1
  } = options;

  const query = {};

  if (userId) query.userId = userId;
  if (category) query.category = category;
  if (severity) query.severity = severity;
  if (action) query.action = new RegExp(action, 'i');
  if (success !== undefined) query.success = success;
  if (examId) query['metadata.examId'] = examId;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const results = await AuditLog.find(query)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const totalCount = await AuditLog.countDocuments(query);

  return {
    logs: results,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNext: page * limit < totalCount,
      hasPrev: page > 1
    }
  };
};

module.exports = {
  auditLogger,
  logSecurityEvent,
  queryAuditLogs,
  AuditLog
};