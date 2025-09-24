const mongoose = require('mongoose');

/**
 * Database Configuration and Optimization
 * Free MongoDB optimization strategies
 */

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB with optimized settings
   */
  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-system';
      
      // Optimized connection options (all free)
      const options = {
        // Connection pool settings for better performance
        maxPoolSize: 10, // Maximum number of connections
        minPoolSize: 2,  // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 30000, // How long to try selecting a server
        socketTimeoutMS: 45000, // How long to wait for a response
        
        // Buffer settings
        bufferCommands: false, // Disable mongoose buffering
        
        // Write concern for better performance
        writeConcern: {
          w: 'majority',
          j: true, // Wait for journal confirmation
          wtimeout: 5000
        },
        
        // Read preference
        readPreference: 'primary',
        
        // Compression (free performance boost)
        compressors: ['zlib'],
        zlibCompressionLevel: 6
      };

      this.connection = await mongoose.connect(mongoURI, options);
      this.isConnected = true;
      
      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Database: ${this.connection.connection.name}`);
      console.log(`🔗 Host: ${this.connection.connection.host}:${this.connection.connection.port}`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      // Create indexes after connection
      await this.createOptimizedIndexes();
      
      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  /**
   * Set up connection event listeners
   */
  setupEventListeners() {
    const db = mongoose.connection;
    
    db.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      this.isConnected = false;
    });
    
    db.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      this.isConnected = false;
    });
    
    db.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.isConnected = true;
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Create optimized indexes for better query performance
   */
  async createOptimizedIndexes() {
    try {
      console.log('🔍 Creating optimized database indexes...');
      
      // Create indexes in background without blocking startup
      const indexPromises = [];
      
      // User collection indexes
      indexPromises.push(
        this.createCollectionIndexes('users', [
          { key: { email: 1 }, unique: true, background: true },
          { key: { createdAt: -1 }, background: true },
          { key: { email: 1, createdAt: -1 }, background: true }
        ])
      );
      
      // Exam collection indexes
      indexPromises.push(
        this.createCollectionIndexes('exams', [
          { key: { examId: 1 }, unique: true, background: true },
          { key: { userId: 1, status: 1 }, background: true },
          { key: { examType: 1, status: 1 }, background: true },
          { key: { createdAt: -1 }, background: true },
          { key: { userId: 1, createdAt: -1 }, background: true },
          { key: { status: 1, startTime: 1, endTime: 1 }, background: true },
          { key: { 'configuration.mcqCategory': 1, 'configuration.mcqDifficulty': 1 }, background: true },
          { key: { tags: 1 }, background: true },
          { key: { createdBy: 1, status: 1 }, background: true }
        ])
      );
      
      // Result collection indexes
      indexPromises.push(
        this.createCollectionIndexes('results', [
          { key: { resultId: 1 }, unique: true, background: true },
          { key: { userId: 1, createdAt: -1 }, background: true },
          { key: { examId: 1, userId: 1 }, background: true },
          { key: { status: 1 }, background: true },
          { key: { 'scoring.percentage': -1 }, background: true },
          { key: { userId: 1, status: 1, 'scoring.passed': 1 }, background: true },
          { key: { userId: 1, 'scoring.percentage': -1 }, background: true },
          { key: { examId: 1, attemptNumber: 1 }, background: true },
          { key: { createdAt: -1 }, background: true },
          { key: { submissionTime: -1 }, background: true, sparse: true }
        ])
      );
      
      // Security violations indexes
      indexPromises.push(
        this.createCollectionIndexes('securityviolations', [
          { key: { violationId: 1 }, unique: true, background: true },
          { key: { userId: 1, timestamp: -1 }, background: true },
          { key: { examId: 1, timestamp: -1 }, background: true },
          { key: { violationType: 1, timestamp: -1 }, background: true },
          { key: { severity: 1, timestamp: -1 }, background: true },
          { key: { timestamp: -1 }, background: true }
        ])
      );
      
      // Wait for all indexes to be created with timeout
      await Promise.allSettled(indexPromises);
      console.log('✅ Database indexes creation initiated');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
  }
  
  /**
   * Helper method to create indexes for a specific collection
   */
  async createCollectionIndexes(collectionName, indexes) {
    try {
      const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        console.log(`⏭️ Skipping indexes for non-existent collection: ${collectionName}`);
        return;
      }
      
      await mongoose.connection.db.collection(collectionName).createIndexes(indexes);
      console.log(`✅ Indexes created for ${collectionName}`);
    } catch (error) {
      console.warn(`⚠️ Could not create indexes for ${collectionName}:`, error.message);
    }
  }

  /**
   * Get database performance statistics
   */
  async getPerformanceStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: this.formatBytes(stats.dataSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexSize: this.formatBytes(stats.indexSize),
        totalSize: this.formatBytes(stats.dataSize + stats.indexSize),
        objects: stats.objects,
        avgObjSize: this.formatBytes(stats.avgObjSize),
        indexes: stats.indexes
      };
    } catch (error) {
      console.error('Error getting database stats:', error.message);
      return null;
    }
  }

  /**
   * Analyze slow queries and suggest optimizations
   */
  async analyzeSlowQueries() {
    try {
      const db = mongoose.connection.db;
      
      // Enable profiling for slow operations (>100ms)
      await db.command({ profile: 2, slowms: 100 });
      
      // Get profiling data
      const profilingData = await db.collection('system.profile')
        .find({})
        .sort({ ts: -1 })
        .limit(10)
        .toArray();
      
      return profilingData.map(op => ({
        operation: op.command,
        duration: op.millis,
        timestamp: op.ts,
        namespace: op.ns
      }));
    } catch (error) {
      console.error('Error analyzing slow queries:', error.message);
      return [];
    }
  }

  /**
   * Optimize database collections
   */
  async optimizeCollections() {
    try {
      const collections = ['users', 'exams', 'results', 'securityviolations'];
      
      for (const collectionName of collections) {
        // Compact collection to reclaim space
        await mongoose.connection.db.command({ compact: collectionName });
        console.log(`✅ Optimized collection: ${collectionName}`);
      }
      
      console.log('✅ All collections optimized');
    } catch (error) {
      console.error('❌ Error optimizing collections:', error.message);
    }
  }

  /**
   * Clean up old data (data retention policy)
   */
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      // Clean up old security violations (older than 30 days)
      const violationsDeleted = await mongoose.connection.db
        .collection('securityviolations')
        .deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
      
      // Archive old completed results (older than 6 months)
      const oldResults = await mongoose.connection.db
        .collection('results')
        .find({ 
          status: { $in: ['completed', 'submitted'] },
          createdAt: { $lt: sixMonthsAgo }
        })
        .toArray();
      
      if (oldResults.length > 0) {
        // Move to archive collection
        await mongoose.connection.db
          .collection('results_archive')
          .insertMany(oldResults);
        
        // Remove from main collection
        await mongoose.connection.db
          .collection('results')
          .deleteMany({ 
            _id: { $in: oldResults.map(r => r._id) }
          });
      }
      
      console.log(`🧹 Cleanup completed:`);
      console.log(`   - Deleted ${violationsDeleted.deletedCount} old security violations`);
      console.log(`   - Archived ${oldResults.length} old results`);
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error.message);
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// Export singleton instance
module.exports = new DatabaseManager();