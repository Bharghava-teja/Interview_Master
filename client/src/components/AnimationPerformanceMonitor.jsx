/**
 * Animation Performance Monitor Component
 * Provides real-time monitoring and optimization suggestions for animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationPerformance, useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, INTERACTIONS } from '../utils/animationUtils';

const AnimationPerformanceMonitor = ({ 
  isVisible = false, 
  onClose,
  showDetailedMetrics = false 
}) => {
  const { metrics, recordFrameDrop, recordAnimation } = useAnimationPerformance();
  const { animationQuality, fps, capabilities, shouldAnimate } = useOptimizedAnimation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Generate performance recommendations
  useEffect(() => {
    const newRecommendations = [];

    if (fps < 30) {
      newRecommendations.push({
        type: 'warning',
        title: 'Low Frame Rate Detected',
        description: 'Consider reducing animation complexity or enabling performance mode.',
        action: 'Reduce animation quality'
      });
    }

    if (metrics.frameDrops > 10) {
      newRecommendations.push({
        type: 'error',
        title: 'Frequent Frame Drops',
        description: 'Animations are causing performance issues.',
        action: 'Enable reduced motion or disable complex animations'
      });
    }

    if (capabilities?.isLowEndDevice) {
      newRecommendations.push({
        type: 'info',
        title: 'Low-End Device Detected',
        description: 'Automatically optimizing animations for better performance.',
        action: 'Performance mode enabled'
      });
    }

    if (capabilities?.batteryLevel < 0.2) {
      newRecommendations.push({
        type: 'warning',
        title: 'Low Battery Level',
        description: 'Consider reducing animations to preserve battery life.',
        action: 'Enable battery saver mode'
      });
    }

    setRecommendations(newRecommendations);
  }, [fps, metrics.frameDrops, capabilities]);

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'none': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Animation Performance</h2>
                <p className="text-blue-100">Real-time monitoring and optimization</p>
              </div>
              <motion.button
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                {...(shouldAnimate ? INTERACTIONS.button : {})}
                onClick={onClose}
                aria-label="Close performance monitor"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* FPS Counter */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Frame Rate</h3>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    fps >= 50 ? 'text-green-600 bg-green-100' :
                    fps >= 30 ? 'text-yellow-600 bg-yellow-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    {fps} FPS
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      fps >= 50 ? 'bg-green-500' :
                      fps >= 30 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(fps / 60 * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Animation Quality */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">Quality Level</h3>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getQualityColor(animationQuality)}`}>
                    {animationQuality.charAt(0).toUpperCase() + animationQuality.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {animationQuality === 'high' && 'All animations enabled with full quality'}
                  {animationQuality === 'medium' && 'Optimized animations for better performance'}
                  {animationQuality === 'low' && 'Simplified animations for low-end devices'}
                  {animationQuality === 'none' && 'Animations disabled for accessibility'}
                </p>
              </div>
            </div>

            {/* Detailed Metrics */}
            {showDetailedMetrics && (
              <motion.div
                className="bg-gray-50 rounded-xl p-4 mb-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="font-semibold text-gray-800 mb-4">Detailed Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Frame Drops:</span>
                    <div className="font-semibold">{metrics.frameDrops}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Animations:</span>
                    <div className="font-semibold">{metrics.animationCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Memory:</span>
                    <div className="font-semibold">
                      {metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Battery:</span>
                    <div className="font-semibold">
                      {capabilities?.batteryLevel ? `${Math.round(capabilities.batteryLevel * 100)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Device Capabilities */}
            {capabilities && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Device Capabilities</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Hardware Acceleration:</span>
                    <span className={`font-semibold ${
                      capabilities.supportsHardwareAcceleration ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {capabilities.supportsHardwareAcceleration ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Device Type:</span>
                    <span className="font-semibold">
                      {capabilities.isLowEndDevice ? 'Low-End' : 'High-End'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Connection:</span>
                    <span className={`font-semibold ${
                      capabilities.connectionSpeed === 'fast' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {capabilities.connectionSpeed === 'fast' ? 'Fast' : 'Slow'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      className="bg-white rounded-lg p-3 border-l-4 border-blue-500"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getRecommendationIcon(rec.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {rec.action}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Detailed Metrics */}
            <div className="mt-6 text-center">
              <motion.button
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                {...(shouldAnimate ? INTERACTIONS.button : {})}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Hide' : 'Show'} Advanced Metrics
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimationPerformanceMonitor;