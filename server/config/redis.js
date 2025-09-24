const redis = require('redis');
const session = require('express-session');
const { RedisStore } = require('connect-redis');

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis max attempts reached');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('end', () => {
  console.log('Redis client disconnected');
});

// Session configuration
const sessionConfig = {
  store: new RedisStore({
    client: redisClient,
    prefix: 'interview:sess:'
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'interview.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  },
  rolling: true // Reset expiration on activity
};

// Cache configuration for application data
const cacheConfig = {
  defaultTTL: 60 * 60, // 1 hour default TTL
  mcqTTL: 30 * 60, // 30 minutes for MCQ data
  codingChallengeTTL: 60 * 60, // 1 hour for coding challenges
  userProfileTTL: 15 * 60, // 15 minutes for user profiles
  examResultsTTL: 24 * 60 * 60 // 24 hours for exam results
};

// Cache helper functions
const cache = {
  // Get data from cache
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set data in cache
  set: async (key, data, ttl = cacheConfig.defaultTTL) => {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  // Delete data from cache
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  // Increment counter
  incr: async (key, ttl = cacheConfig.defaultTTL) => {
    try {
      const result = await redisClient.incr(key);
      if (result === 1) {
        await redisClient.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  },

  // Get multiple keys
  mget: async (keys) => {
    try {
      const data = await redisClient.mget(keys);
      return data.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return new Array(keys.length).fill(null);
    }
  },

  // Set multiple keys
  mset: async (keyValuePairs, ttl = cacheConfig.defaultTTL) => {
    try {
      const pipeline = redisClient.pipeline();
      
      for (const [key, value] of keyValuePairs) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  },

  // Clear all cache (use with caution)
  flush: async () => {
    try {
      await redisClient.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

// Browser fingerprinting cache helpers
const fingerprintCache = {
  // Store browser fingerprint
  setFingerprint: async (userId, fingerprint, sessionId) => {
    const key = `fingerprint:${userId}`;
    const data = {
      fingerprint,
      sessionId,
      timestamp: Date.now(),
      lastSeen: Date.now()
    };
    return await cache.set(key, data, 24 * 60 * 60); // 24 hours
  },

  // Get browser fingerprint
  getFingerprint: async (userId) => {
    const key = `fingerprint:${userId}`;
    return await cache.get(key);
  },

  // Update last seen timestamp
  updateLastSeen: async (userId) => {
    const key = `fingerprint:${userId}`;
    const data = await cache.get(key);
    if (data) {
      data.lastSeen = Date.now();
      return await cache.set(key, data, 24 * 60 * 60);
    }
    return false;
  },

  // Check if fingerprint matches
  verifyFingerprint: async (userId, fingerprint) => {
    const stored = await fingerprintCache.getFingerprint(userId);
    if (!stored || !stored.fingerprint) return { valid: false, reason: 'no_fingerprint' };
    
    if (stored.fingerprint !== fingerprint) {
      return { valid: false, reason: 'fingerprint_mismatch' };
    }
    
    // Update last seen
    await fingerprintCache.updateLastSeen(userId);
    return { valid: true };
  }
};

module.exports = {
  redisClient,
  sessionConfig,
  cacheConfig,
  cache,
  fingerprintCache
};