const mongoose = require('mongoose');
const os = require('os');
const process = require('process');
const { AppError } = require('../middleware/errorHandler');

/**
 * Performance Monitoring Utilities
 * Free performance tracking and optimization tools
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      database: new Map(),
      system: new Map()
    };
    this.startTime = Date.now();
    this.requestCount = 0;
    this.slowQueries = [];
    this.maxSlowQueries = 100;
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    // Monitor MongoDB operations
    this.setupDatabaseMonitoring();
    
    // Monitor system resources
    this.setupSystemMonitoring();
    
    // Setup periodic cleanup
    setInterval(() => this.cleanup(), 300000); // 5 minutes
    
    console.log('Performance monitoring initialized');
  }

  /**
   * Setup database performance monitoring
   */
  setupDatabaseMonitoring() {
    // Monitor slow queries
    mongoose.connection.on('commandStarted', (event) => {
      this.metrics.database.set(event.requestId, {
        command: event.commandName,
        collection: event.command[event.commandName],
        startTime: Date.now(),
        query: this.sanitizeQuery(event.command)
      });
    });

    mongoose.connection.on('commandSucceeded', (event) => {
      const startData = this.metrics.database.get(event.requestId);
      if (startData) {
        const duration = Date.now() - startData.startTime;
        
        // Log slow queries (>100ms)
        if (duration > 100) {
          this.recordSlowQuery({
            ...startData,
            duration,
            success: true,
            timestamp: new Date()
          });
        }
        
        this.metrics.database.delete(event.requestId);
      }
    });

    mongoose.connection.on('commandFailed', (event) => {
      const startData = this.metrics.database.get(event.requestId);
      if (startData) {
        const duration = Date.now() - startData.startTime;
        
        this.recordSlowQuery({
          ...startData,
          duration,
          success: false,
          error: event.failure,
          timestamp: new Date()
        });
        
        this.metrics.database.delete(event.requestId);
      }
    });
  }

  /**
   * Setup system resource monitoring
   */
  setupSystemMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.metrics.system.set('memory', {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        timestamp: Date.now()
      });
      
      this.metrics.system.set('cpu', {
        user: cpuUsage.user,
        system: cpuUsage.system,
        timestamp: Date.now()
      });
      
      this.metrics.system.set('system', {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
        uptime: os.uptime(),
        timestamp: Date.now()
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Record slow query
   */
  recordSlowQuery(queryData) {
    this.slowQueries.push(queryData);
    
    // Keep only the most recent slow queries
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries = this.slowQueries.slice(-this.maxSlowQueries);
    }
    
    // Log critical slow queries (>1000ms)
    if (queryData.duration > 1000) {
      console.warn('Critical slow query detected:', {
        command: queryData.command,
        collection: queryData.collection,
        duration: `${queryData.duration}ms`,
        query: queryData.query
      });
    }
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  sanitizeQuery(command) {
    const sanitized = { ...command };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const result = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  /**
   * Track request performance
   */
  trackRequest(req, res, next) {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.performanceId = requestId;
    
    this.metrics.requests.set(requestId, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      startTime,
      timestamp: new Date()
    });
    
    this.requestCount++;
    
    // Track response
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const requestData = this.metrics.requests.get(requestId);
      if (requestData) {
        requestData.duration = duration;
        requestData.statusCode = res.statusCode;
        // Safely calculate response size with proper type checking
        let responseSize = 0;
        if (data) {
          if (typeof data === 'string') {
            responseSize = Buffer.byteLength(data, 'utf8');
          } else if (Buffer.isBuffer(data)) {
            responseSize = data.length;
          } else if (typeof data === 'object') {
            responseSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
          }
        }
        requestData.responseSize = responseSize;
        
        // Log slow requests (>2000ms)
        if (duration > 2000) {
          console.warn('Slow request detected:', {
            method: requestData.method,
            url: requestData.url,
            duration: `${duration}ms`,
            statusCode: res.statusCode
          });
        }
      }
      
      originalSend.call(res, data);
    }.bind(this);
    
    next();
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate request statistics
    const recentRequests = Array.from(this.metrics.requests.values())
      .filter(req => req.timestamp && (now - req.timestamp.getTime()) < 300000); // Last 5 minutes
    
    const avgResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, req) => sum + (req.duration || 0), 0) / recentRequests.length
      : 0;
    
    const requestsPerMinute = recentRequests.length / 5;
    
    // Get system stats
    const memoryStats = this.metrics.system.get('memory');
    const systemStats = this.metrics.system.get('system');
    
    // Calculate database statistics
    const recentSlowQueries = this.slowQueries.filter(
      query => query.timestamp && (now - query.timestamp.getTime()) < 300000
    );
    
    const avgQueryTime = recentSlowQueries.length > 0
      ? recentSlowQueries.reduce((sum, query) => sum + query.duration, 0) / recentSlowQueries.length
      : 0;
    
    return {
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000)
      },
      requests: {
        total: this.requestCount,
        recent: recentRequests.length,
        perMinute: Math.round(requestsPerMinute * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100
      },
      database: {
        slowQueries: this.slowQueries.length,
        recentSlowQueries: recentSlowQueries.length,
        avgQueryTime: Math.round(avgQueryTime * 100) / 100,
        connectionState: mongoose.connection.readyState
      },
      memory: memoryStats ? {
        heapUsed: this.formatBytes(memoryStats.heapUsed),
        heapTotal: this.formatBytes(memoryStats.heapTotal),
        rss: this.formatBytes(memoryStats.rss),
        external: this.formatBytes(memoryStats.external)
      } : null,
      system: systemStats ? {
        freeMemory: this.formatBytes(systemStats.freeMemory),
        totalMemory: this.formatBytes(systemStats.totalMemory),
        loadAverage: systemStats.loadAverage,
        uptime: Math.floor(systemStats.uptime / 3600) + 'h'
      } : null
    };
  }

  /**
   * Get slow queries report
   */
  getSlowQueries(limit = 20) {
    return this.slowQueries
      .slice(-limit)
      .sort((a, b) => b.duration - a.duration)
      .map(query => ({
        command: query.command,
        collection: query.collection,
        duration: query.duration,
        success: query.success,
        timestamp: query.timestamp,
        query: query.query
      }));
  }

  /**
   * Get request analytics
   */
  getRequestAnalytics() {
    const now = Date.now();
    const requests = Array.from(this.metrics.requests.values())
      .filter(req => req.timestamp && (now - req.timestamp.getTime()) < 3600000); // Last hour
    
    // Group by endpoint
    const endpointStats = {};
    const statusCodeStats = {};
    
    requests.forEach(req => {
      // Normalize URL (remove IDs)
      const normalizedUrl = req.url.replace(/\/[0-9a-fA-F]{24}/g, '/:id');
      const endpoint = `${req.method} ${normalizedUrl}`;
      
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        };
      }
      
      const stats = endpointStats[endpoint];
      stats.count++;
      
      if (req.duration) {
        stats.totalDuration += req.duration;
        stats.avgDuration = stats.totalDuration / stats.count;
        stats.minDuration = Math.min(stats.minDuration, req.duration);
        stats.maxDuration = Math.max(stats.maxDuration, req.duration);
      }
      
      // Status code stats
      const statusCode = req.statusCode || 'unknown';
      statusCodeStats[statusCode] = (statusCodeStats[statusCode] || 0) + 1;
    });
    
    // Convert to arrays and sort
    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalRequests: requests.length,
      topEndpoints,
      statusCodes: statusCodeStats,
      timeRange: '1 hour'
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup old metrics
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    // Cleanup old requests
    for (const [id, request] of this.metrics.requests.entries()) {
      if (request.timestamp && (now - request.timestamp.getTime()) > maxAge) {
        this.metrics.requests.delete(id);
      }
    }
    
    // Cleanup old slow queries
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp && (now - query.timestamp.getTime()) < maxAge
    );
    
    console.log('Performance metrics cleanup completed');
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const stats = this.getStats();
    const slowQueries = this.getSlowQueries(10);
    const requestAnalytics = this.getRequestAnalytics();
    
    return {
      timestamp: new Date().toISOString(),
      summary: stats,
      slowQueries,
      requestAnalytics,
      recommendations: this.generateRecommendations(stats, slowQueries)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(stats, slowQueries) {
    const recommendations = [];
    
    // Memory recommendations
    if (stats.memory && stats.memory.heapUsed) {
      const heapUsedMB = parseInt(stats.memory.heapUsed);
      if (heapUsedMB > 500) {
        recommendations.push({
          type: 'memory',
          priority: 'high',
          message: 'High memory usage detected. Consider implementing caching or optimizing data structures.'
        });
      }
    }
    
    // Response time recommendations
    if (stats.requests.avgResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time is high. Consider optimizing database queries and adding caching.'
      });
    }
    
    // Database recommendations
    if (slowQueries.length > 10) {
      recommendations.push({
        type: 'database',
        priority: 'medium',
        message: 'Multiple slow queries detected. Review database indexes and query optimization.'
      });
    }
    
    // Request rate recommendations
    if (stats.requests.perMinute > 100) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        message: 'High request rate detected. Consider implementing rate limiting and load balancing.'
      });
    }
    
    return recommendations;
  }
}

/**
 * Query optimization utilities
 */
class QueryOptimizer {
  /**
   * Analyze query performance
   */
  static async analyzeQuery(model, query, options = {}) {
    const startTime = Date.now();
    
    try {
      // Execute query with explain
      const explainResult = await model.find(query).explain('executionStats');
      const duration = Date.now() - startTime;
      
      const stats = explainResult.executionStats;
      
      return {
        duration,
        totalDocsExamined: stats.totalDocsExamined,
        totalDocsReturned: stats.totalDocsReturned,
        executionTimeMillis: stats.executionTimeMillis,
        indexesUsed: this.extractIndexesUsed(explainResult),
        efficiency: stats.totalDocsReturned / Math.max(stats.totalDocsExamined, 1),
        recommendations: this.generateQueryRecommendations(stats)
      };
    } catch (error) {
      console.error('Query analysis failed:', error);
      throw new AppError('Failed to analyze query performance', 500);
    }
  }

  /**
   * Extract indexes used from explain result
   */
  static extractIndexesUsed(explainResult) {
    const indexes = [];
    
    const extractFromStage = (stage) => {
      if (stage.indexName) {
        indexes.push(stage.indexName);
      }
      
      if (stage.inputStage) {
        extractFromStage(stage.inputStage);
      }
      
      if (stage.inputStages) {
        stage.inputStages.forEach(extractFromStage);
      }
    };
    
    if (explainResult.executionStats && explainResult.executionStats.executionStages) {
      extractFromStage(explainResult.executionStats.executionStages);
    }
    
    return indexes;
  }

  /**
   * Generate query optimization recommendations
   */
  static generateQueryRecommendations(stats) {
    const recommendations = [];
    
    // Check if query is doing a collection scan
    if (stats.totalDocsExamined > stats.totalDocsReturned * 10) {
      recommendations.push({
        type: 'index',
        priority: 'high',
        message: 'Query is examining too many documents. Consider adding an appropriate index.'
      });
    }
    
    // Check execution time
    if (stats.executionTimeMillis > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Query execution time is high. Review query structure and indexes.'
      });
    }
    
    // Check efficiency
    const efficiency = stats.totalDocsReturned / Math.max(stats.totalDocsExamined, 1);
    if (efficiency < 0.1) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        message: 'Query efficiency is low. Consider more selective query criteria or better indexes.'
      });
    }
    
    return recommendations;
  }
}

module.exports = {
  PerformanceMonitor,
  QueryOptimizer
};