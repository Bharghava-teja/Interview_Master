const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { PerformanceMonitor } = require('../utils/performance');
const DatabaseManager = require('../config/database');
const { redisClient } = require('../config/redis');

/**
 * Comprehensive Monitoring and Logging Service
 * Provides system health monitoring, structured logging, and alerting
 */

class MonitoringService {
  constructor() {
    this.logger = null;
    this.performanceMonitor = new PerformanceMonitor();
    this.healthChecks = new Map();
    this.alerts = [];
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: []
    };
    
    this.initializeLogger();
    this.setupHealthChecks();
    this.startMonitoring();
  }

  /**
   * Initialize Winston logger with multiple transports
   */
  initializeLogger() {
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Custom log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    // Create logger with multiple transports
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'interview-system',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),

        // Combined log file
        new DailyRotateFile({
          filename: path.join(logsDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info'
        }),

        // Error log file
        new DailyRotateFile({
          filename: path.join(logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error'
        }),

        // Security log file
        new DailyRotateFile({
          filename: path.join(logsDir, 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          level: 'warn'
        }),

        // Performance log file
        new DailyRotateFile({
          filename: path.join(logsDir, 'performance-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
          level: 'info'
        })
      ],

      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ],

      rejectionHandlers: [
        new DailyRotateFile({
          filename: path.join(logsDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ]
    });

    console.log('✅ Monitoring service logger initialized');
  }

  /**
   * Setup health check functions
   */
  setupHealthChecks() {
    // Database health check
    this.healthChecks.set('database', async () => {
      try {
        const health = await DatabaseManager.healthCheck();
        return {
          status: health.connected ? 'healthy' : 'unhealthy',
          details: health,
          timestamp: new Date()
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date()
        };
      }
    });

    // Redis health check (non-critical)
    this.healthChecks.set('redis', async () => {
      try {
        await redisClient.ping();
        return {
          status: 'healthy',
          details: { connected: true },
          timestamp: new Date()
        };
      } catch (error) {
        // Redis is optional, so mark as warning instead of unhealthy
        return {
          status: 'warning',
          error: error.message,
          details: { connected: false, optional: true },
          timestamp: new Date()
        };
      }
    });

    // Memory health check
    this.healthChecks.set('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      const status = memoryUsagePercent > 90 ? 'critical' : 
                    memoryUsagePercent > 75 ? 'warning' : 'healthy';

      return {
        status,
        details: {
          heapUsed: this.formatBytes(memUsage.heapUsed),
          heapTotal: this.formatBytes(memUsage.heapTotal),
          rss: this.formatBytes(memUsage.rss),
          external: this.formatBytes(memUsage.external),
          systemMemoryUsage: `${memoryUsagePercent.toFixed(2)}%`,
          freeMemory: this.formatBytes(freeMem),
          totalMemory: this.formatBytes(totalMem)
        },
        timestamp: new Date()
      };
    });

    // CPU health check
    this.healthChecks.set('cpu', async () => {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      const load1min = loadAvg[0];
      const cpuCount = cpus.length;
      const loadPercent = (load1min / cpuCount) * 100;

      const status = loadPercent > 90 ? 'critical' : 
                    loadPercent > 75 ? 'warning' : 'healthy';

      return {
        status,
        details: {
          loadAverage: loadAvg,
          cpuCount,
          loadPercent: `${loadPercent.toFixed(2)}%`,
          uptime: this.formatUptime(os.uptime())
        },
        timestamp: new Date()
      };
    });

    // Disk space health check
    this.healthChecks.set('disk', async () => {
      try {
        const stats = fs.statSync(process.cwd());
        // This is a simplified check - in production, you'd use a proper disk space library
        return {
          status: 'healthy',
          details: {
            path: process.cwd(),
            accessible: true
          },
          timestamp: new Date()
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date()
        };
      }
    });

    console.log('✅ Health checks configured');
  }

  /**
   * Start monitoring processes
   */
  startMonitoring() {
    // Initialize performance monitoring
    this.performanceMonitor.initialize();

    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Run health checks every 60 seconds
    setInterval(() => {
      this.runHealthChecks();
    }, 60000);

    // Generate monitoring report every 5 minutes
    setInterval(() => {
      this.generateMonitoringReport();
    }, 300000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 3600000);

    console.log('✅ Monitoring processes started');
  }

  /**
   * Collect system performance metrics
   */
  async collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const timestamp = Date.now();

      // Store memory metrics
      this.metrics.memoryUsage.push({
        timestamp,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external
      });

      // Store CPU metrics
      this.metrics.cpuUsage.push({
        timestamp,
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // Keep only last 100 entries
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
      }
      if (this.metrics.cpuUsage.length > 100) {
        this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
      }

      // Log performance metrics
      this.logger.info('System metrics collected', {
        category: 'performance',
        metrics: {
          memory: this.formatBytes(memUsage.heapUsed),
          cpu: cpuUsage,
          timestamp
        }
      });
    } catch (error) {
      this.logger.error('Error collecting system metrics', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const healthResults = {};
    let overallStatus = 'healthy';

    for (const [name, checkFn] of this.healthChecks.entries()) {
      try {
        const result = await checkFn();
        healthResults[name] = result;

        if (result.status === 'critical') {
          overallStatus = 'critical';
        } else if (result.status === 'warning' && overallStatus !== 'critical') {
          overallStatus = 'warning';
        } else if (result.status === 'unhealthy' && overallStatus === 'healthy') {
          overallStatus = 'unhealthy';
        }

        // Log health check results
        this.logger.info(`Health check: ${name}`, {
          category: 'health',
          service: name,
          status: result.status,
          details: result.details
        });

        // Generate alerts for unhealthy services
        if (result.status !== 'healthy') {
          this.generateAlert(name, result);
        }
      } catch (error) {
        healthResults[name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date()
        };

        this.logger.error(`Health check failed: ${name}`, {
          category: 'health',
          service: name,
          error: error.message,
          stack: error.stack
        });
      }
    }

    // Store overall health status
    this.lastHealthCheck = {
      timestamp: new Date(),
      overallStatus,
      services: healthResults
    };
  }

  /**
   * Generate alert for unhealthy services
   */
  generateAlert(serviceName, healthResult) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      service: serviceName,
      status: healthResult.status,
      message: `Service ${serviceName} is ${healthResult.status}`,
      details: healthResult.details || {},
      error: healthResult.error
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // Log alert
    this.logger.warn('System alert generated', {
      category: 'alert',
      alert
    });

    // In production, you could send notifications here
    // e.g., email, Slack, SMS, etc.
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateMonitoringReport() {
    try {
      const report = {
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION || '1.0.0',
        metrics: {
          requests: this.metrics.requests,
          errors: this.metrics.errors,
          averageResponseTime: this.calculateAverageResponseTime(),
          memoryTrend: this.analyzeMemoryTrend(),
          cpuTrend: this.analyzeCpuTrend()
        },
        health: this.lastHealthCheck,
        alerts: this.alerts.slice(-10), // Last 10 alerts
        performance: this.performanceMonitor.getStats(),
        slowQueries: this.performanceMonitor.getSlowQueries(5)
      };

      this.logger.info('Monitoring report generated', {
        category: 'monitoring',
        report
      });

      return report;
    } catch (error) {
      this.logger.error('Error generating monitoring report', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    
    const sum = this.metrics.responseTime.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / this.metrics.responseTime.length);
  }

  /**
   * Analyze memory usage trend
   */
  analyzeMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return 'insufficient_data';
    
    const recent = this.metrics.memoryUsage.slice(-10);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyze CPU usage trend
   */
  analyzeCpuTrend() {
    if (this.metrics.cpuUsage.length < 2) return 'insufficient_data';
    
    const recent = this.metrics.cpuUsage.slice(-10);
    const first = recent[0].user + recent[0].system;
    const last = recent[recent.length - 1].user + recent[recent.length - 1].system;
    
    const change = ((last - first) / first) * 100;
    
    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean up response times older than 1 hour
    this.metrics.responseTime = this.metrics.responseTime.filter(
      time => time.timestamp > oneHourAgo
    );
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(
      alert => alert.timestamp > new Date(oneHourAgo)
    );
    
    this.logger.info('Metrics cleanup completed', {
      category: 'maintenance',
      cleaned: {
        responseTime: this.metrics.responseTime.length,
        alerts: this.alerts.length
      }
    });
  }

  /**
   * Track request metrics
   */
  trackRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push({
      timestamp: Date.now(),
      time: responseTime,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });

    if (res.statusCode >= 400) {
      this.metrics.errors++;
    }

    // Log slow requests
    if (responseTime > 1000) {
      this.logger.warn('Slow request detected', {
        category: 'performance',
        method: req.method,
        path: req.path,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  }

  /**
   * Track security events
   */
  trackSecurityEvent(event, details = {}) {
    this.logger.warn('Security event', {
      category: 'security',
      event,
      details,
      timestamp: new Date()
    });
  }

  /**
   * Get current system health
   */
  async getSystemHealth() {
    if (!this.lastHealthCheck) {
      await this.runHealthChecks();
    }
    
    return this.lastHealthCheck;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? 
        (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: this.calculateAverageResponseTime() + 'ms',
      uptime: this.formatUptime(process.uptime()),
      memoryTrend: this.analyzeMemoryTrend(),
      cpuTrend: this.analyzeCpuTrend(),
      alertCount: this.alerts.length
    };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Get logger instance
   */
  getLogger() {
    return this.logger;
  }
}

module.exports = new MonitoringService();