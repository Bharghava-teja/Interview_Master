const { cache, cacheConfig } = require('../config/redis');
const { PerformanceMonitor } = require('../utils/performance');

/**
 * Enhanced Caching Service
 * Implements intelligent caching strategies for optimal performance
 */

class CacheService {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.hitRate = new Map();
    this.missRate = new Map();
  }

  /**
   * Cache MCQ questions with intelligent prefetching
   */
  async cacheMCQQuestions(category, difficulty, questions) {
    const key = `mcq:${category}:${difficulty}`;
    const success = await cache.set(key, questions, cacheConfig.mcqTTL);
    
    if (success) {
      // Prefetch related categories
      this.prefetchRelatedMCQs(category, difficulty);
    }
    
    return success;
  }

  // MCQ caching removed - no longer supported

  /**
   * Cache coding challenges with metadata
   */
  async cacheCodingChallenges(difficulty, challenges) {
    const key = `coding:${difficulty}`;
    const enhancedData = {
      challenges,
      metadata: {
        count: challenges.length,
        lastUpdated: new Date(),
        difficulty
      }
    };
    
    return await cache.set(key, enhancedData, cacheConfig.codingChallengeTTL);
  }

  /**
   * Get cached coding challenges
   */
  async getCodingChallenges(difficulty) {
    const key = `coding:${difficulty}`;
    const startTime = Date.now();
    
    const data = await cache.get(key);
    const duration = Date.now() - startTime;
    
    this.recordCacheMetrics(key, data !== null, duration);
    
    return data;
  }

  /**
   * Cache user profile with session data
   */
  async cacheUserProfile(userId, profile) {
    const key = `user:profile:${userId}`;
    const enhancedProfile = {
      ...profile,
      cached_at: new Date(),
      cache_version: '1.0'
    };
    
    return await cache.set(key, enhancedProfile, cacheConfig.userProfileTTL);
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    const key = `user:profile:${userId}`;
    const startTime = Date.now();
    
    const profile = await cache.get(key);
    const duration = Date.now() - startTime;
    
    this.recordCacheMetrics(key, profile !== null, duration);
    
    return profile;
  }

  /**
   * Cache exam results with analytics
   */
  async cacheExamResults(examId, userId, results) {
    const key = `exam:results:${examId}:${userId}`;
    const enhancedResults = {
      ...results,
      analytics: {
        cached_at: new Date(),
        performance_score: this.calculatePerformanceScore(results),
        improvement_suggestions: this.generateImprovementSuggestions(results)
      }
    };
    
    return await cache.set(key, enhancedResults, cacheConfig.examResultsTTL);
  }

  /**
   * Get cached exam results
   */
  async getExamResults(examId, userId) {
    const key = `exam:results:${examId}:${userId}`;
    const startTime = Date.now();
    
    const results = await cache.get(key);
    const duration = Date.now() - startTime;
    
    this.recordCacheMetrics(key, results !== null, duration);
    
    return results;
  }

  /**
   * Intelligent cache warming for frequently accessed data
   */
  async warmCache() {
    console.log('🔥 Starting intelligent cache warming...');
    
    try {
      // Warm MCQ categories
      const popularCategories = ['javascript', 'python', 'react', 'nodejs'];
      const difficulties = ['easy', 'medium', 'hard'];
      
      for (const category of popularCategories) {
        for (const difficulty of difficulties) {
          const key = `mcq:${category}:${difficulty}`;
          const exists = await cache.exists(key);
          
          if (!exists) {
            // This would typically fetch from database
            console.log(`Warming cache for ${category}:${difficulty}`);
          }
        }
      }
      
      // Warm coding challenges
      for (const difficulty of difficulties) {
        const key = `coding:${difficulty}`;
        const exists = await cache.exists(key);
        
        if (!exists) {
          console.log(`Warming cache for coding:${difficulty}`);
        }
      }
      
      console.log('✅ Cache warming completed');
    } catch (error) {
      console.error('❌ Cache warming error:', error);
    }
  }

  /**
   * Prefetch related MCQ categories
   */
  async prefetchRelatedMCQs(category, difficulty) {
    const relatedCategories = this.getRelatedCategories(category);
    
    for (const relatedCategory of relatedCategories) {
      const key = `mcq:${relatedCategory}:${difficulty}`;
      const exists = await cache.exists(key);
      
      if (!exists) {
        // Schedule prefetch (would integrate with actual data fetching)
        setTimeout(() => {
          console.log(`Prefetching ${relatedCategory}:${difficulty}`);
        }, 1000);
      }
    }
  }

  /**
   * Get related categories for intelligent prefetching
   */
  getRelatedCategories(category) {
    const categoryMap = {
      'javascript': ['react', 'nodejs', 'typescript'],
      'python': ['django', 'flask', 'data-science'],
      'react': ['javascript', 'typescript', 'redux'],
      'nodejs': ['javascript', 'express', 'mongodb']
    };
    
    return categoryMap[category] || [];
  }

  /**
   * Record cache performance metrics
   */
  recordCacheMetrics(key, isHit, duration) {
    const category = key.split(':')[0];
    
    if (!this.hitRate.has(category)) {
      this.hitRate.set(category, { hits: 0, misses: 0, totalTime: 0 });
    }
    
    const metrics = this.hitRate.get(category);
    
    if (isHit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }
    
    metrics.totalTime += duration;
    
    // Log slow cache operations
    if (duration > 50) {
      console.warn(`Slow cache operation: ${key} took ${duration}ms`);
    }
  }

  /**
   * Calculate performance score for exam results
   */
  calculatePerformanceScore(results) {
    if (!results.scoring) return 0;
    
    const { percentage, timeEfficiency, accuracy } = results.scoring;
    
    return Math.round(
      (percentage * 0.5) + 
      (timeEfficiency * 0.3) + 
      (accuracy * 0.2)
    );
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions(results) {
    const suggestions = [];
    
    if (results.scoring?.percentage < 70) {
      suggestions.push('Focus on fundamental concepts');
    }
    
    if (results.scoring?.timeEfficiency < 60) {
      suggestions.push('Practice time management');
    }
    
    if (results.scoring?.accuracy < 80) {
      suggestions.push('Review incorrect answers carefully');
    }
    
    return suggestions;
  }

  /**
   * Get cache performance statistics
   */
  getCacheStats() {
    const stats = {};
    
    for (const [category, metrics] of this.hitRate.entries()) {
      const total = metrics.hits + metrics.misses;
      const hitRate = total > 0 ? (metrics.hits / total * 100).toFixed(2) : 0;
      const avgTime = total > 0 ? (metrics.totalTime / total).toFixed(2) : 0;
      
      stats[category] = {
        hitRate: `${hitRate}%`,
        totalRequests: total,
        averageTime: `${avgTime}ms`,
        hits: metrics.hits,
        misses: metrics.misses
      };
    }
    
    return stats;
  }

  /**
   * Clear cache for specific patterns
   */
  async clearCachePattern(pattern) {
    console.log(`Clearing cache pattern: ${pattern}`);
    // Implementation would depend on Redis SCAN command
    // For now, we'll implement basic key clearing
    
    const commonKeys = [
      `mcq:${pattern}`,
      `coding:${pattern}`,
      `user:profile:${pattern}`,
      `exam:results:${pattern}`
    ];
    
    for (const key of commonKeys) {
      await cache.del(key);
    }
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimizeCache() {
    console.log('🔧 Optimizing cache based on usage patterns...');
    
    const stats = this.getCacheStats();
    
    for (const [category, metrics] of Object.entries(stats)) {
      const hitRate = parseFloat(metrics.hitRate);
      
      if (hitRate < 50) {
        console.log(`Low hit rate for ${category}: ${metrics.hitRate}`);
        // Could implement cache warming or TTL adjustment
      }
      
      if (parseFloat(metrics.averageTime) > 100) {
        console.log(`Slow cache performance for ${category}: ${metrics.averageTime}`);
        // Could implement cache optimization strategies
      }
    }
    
    console.log('✅ Cache optimization completed');
  }
}

module.exports = new CacheService();