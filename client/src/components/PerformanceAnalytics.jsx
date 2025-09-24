import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  Activity,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const PerformanceAnalytics = ({ 
  interviewData, 
  userId, 
  timeRange = '30d',
  onExportReport,
  onShareResults 
}) => {

  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'detailed', 'comparison'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'technical', 'behavioral', 'mixed'
  const [showInsights, setShowInsights] = useState(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Color schemes for charts - memoized to prevent re-renders
  const COLORS = useMemo(() => ({
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    indigo: '#6366F1',
    pink: '#EC4899',
    teal: '#14B8A6'
  }), []);

  const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple];

  // Generate AI-powered insights
  const generateInsights = useCallback((summary, trends, performance, behavioral) => {
    const insights = [];

    // Performance trend analysis
    if (trends.length >= 3) {
      const recentScores = trends.slice(-3).map(t => t.score);
      const earlierScores = trends.slice(0, 3).map(t => t.score);
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;
      
      if (recentAvg > earlierAvg + 5) {
        insights.push({
          type: 'positive',
          title: 'Improving Performance',
          description: `Your recent interview scores have improved by ${(recentAvg - earlierAvg).toFixed(1)} points on average.`,
          icon: TrendingUp,
          color: COLORS.success
        });
      } else if (recentAvg < earlierAvg - 5) {
        insights.push({
          type: 'warning',
          title: 'Performance Decline',
          description: `Your recent scores have decreased. Consider reviewing your preparation strategy.`,
          icon: TrendingDown,
          color: COLORS.warning
        });
      }
    }

    // Violation analysis
    if (summary.violationRate > 2) {
      insights.push({
        type: 'warning',
        title: 'Security Violations',
        description: `Average of ${summary.violationRate.toFixed(1)} violations per interview. Focus on following interview guidelines.`,
        icon: AlertTriangle,
        color: COLORS.danger
      });
    } else if (summary.violationRate < 0.5) {
      insights.push({
        type: 'positive',
        title: 'Excellent Compliance',
        description: 'You maintain excellent interview discipline with minimal violations.',
        icon: CheckCircle,
        color: COLORS.success
      });
    }

    // Behavioral insights
    if (behavioral.eyeContact < 60) {
      insights.push({
        type: 'improvement',
        title: 'Eye Contact Opportunity',
        description: 'Practice maintaining eye contact with the camera to improve your interview presence.',
        icon: Eye,
        color: COLORS.warning
      });
    }

    if (behavioral.confidence > 80) {
      insights.push({
        type: 'positive',
        title: 'Strong Confidence',
        description: 'Your confidence levels are consistently high across interviews.',
        icon: Target,
        color: COLORS.success
      });
    }

    // Response time analysis
    const avgResponseTime = trends.reduce((sum, t) => sum + t.responseTime, 0) / trends.length;
    if (avgResponseTime > 180000) { // 3 minutes
      insights.push({
        type: 'improvement',
        title: 'Response Time',
        description: 'Consider practicing quicker response formulation to improve interview flow.',
        icon: Clock,
        color: COLORS.warning
      });
    }

    return insights;
  }, [COLORS]);

  // Process interview data for analytics
  const analyticsData = useMemo(() => {
    if (!interviewData || !Array.isArray(interviewData)) {
      return {
        summary: {},
        trends: [],
        performance: {},
        behavioral: {},
        insights: []
      };
    }

    // Filter data based on selected criteria
    const filteredData = interviewData.filter(interview => {
      if (filterBy === 'all') return true;
      return interview.type === filterBy;
    });

    // Calculate summary metrics
    const summary = {
      totalInterviews: filteredData.length,
      averageScore: filteredData.reduce((sum, i) => sum + (i.score || 0), 0) / filteredData.length || 0,
      completionRate: filteredData.filter(i => i.completed).length / filteredData.length * 100 || 0,
      averageDuration: filteredData.reduce((sum, i) => sum + (i.duration || 0), 0) / filteredData.length || 0,
      violationRate: filteredData.reduce((sum, i) => sum + (i.violations?.length || 0), 0) / filteredData.length || 0
    };

    // Calculate performance trends over time
    const trends = filteredData.map((interview, index) => ({
      session: index + 1,
      score: interview.score || 0,
      responseTime: interview.averageResponseTime || 0,
      violations: interview.violations?.length || 0,
      confidence: interview.confidenceLevel || 0,
      date: interview.timestamp ? new Date(interview.timestamp).toLocaleDateString() : `Session ${index + 1}`
    }));

    // Performance breakdown by category
    const performance = {
      technical: {
        score: filteredData.filter(i => i.type === 'technical').reduce((sum, i) => sum + (i.score || 0), 0) / filteredData.filter(i => i.type === 'technical').length || 0,
        count: filteredData.filter(i => i.type === 'technical').length
      },
      behavioral: {
        score: filteredData.filter(i => i.type === 'behavioral').reduce((sum, i) => sum + (i.score || 0), 0) / filteredData.filter(i => i.type === 'behavioral').length || 0,
        count: filteredData.filter(i => i.type === 'behavioral').length
      },
      mixed: {
        score: filteredData.filter(i => i.type === 'mixed').reduce((sum, i) => sum + (i.score || 0), 0) / filteredData.filter(i => i.type === 'mixed').length || 0,
        count: filteredData.filter(i => i.type === 'mixed').length
      }
    };

    // Enhanced behavioral analysis with advanced metrics
    const behavioral = {
      eyeContact: filteredData.reduce((sum, i) => sum + (i.eyeContactScore || 0), 0) / filteredData.length || 0,
      speechClarity: filteredData.reduce((sum, i) => sum + (i.speechClarityScore || 0), 0) / filteredData.length || 0,
      confidence: filteredData.reduce((sum, i) => sum + (i.confidenceLevel || 0), 0) / filteredData.length || 0,
      engagement: filteredData.reduce((sum, i) => sum + (i.engagementScore || 0), 0) / filteredData.length || 0,
      professionalism: filteredData.reduce((sum, i) => sum + (i.professionalismScore || 0), 0) / filteredData.length || 0,
      // Advanced behavioral metrics
      eyeTrackingAccuracy: filteredData.reduce((sum, i) => sum + (i.eyeTrackingAccuracy || 0), 0) / filteredData.length || 0,
      speechPaceConsistency: filteredData.reduce((sum, i) => sum + (i.speechPaceConsistency || 0), 0) / filteredData.length || 0,
      emotionalStability: filteredData.reduce((sum, i) => sum + (i.emotionalStability || 0), 0) / filteredData.length || 0,
      gestureAppropriatenss: filteredData.reduce((sum, i) => sum + (i.gestureAppropriatenss || 0), 0) / filteredData.length || 0,
      attentionFocus: filteredData.reduce((sum, i) => sum + (i.attentionFocus || 0), 0) / filteredData.length || 0,
      responseCoherence: filteredData.reduce((sum, i) => sum + (i.responseCoherence || 0), 0) / filteredData.length || 0,
      stressIndicators: filteredData.reduce((sum, i) => sum + (i.stressLevel || 0), 0) / filteredData.length || 0
    };

    // Generate insights
    const insights = generateInsights(summary, trends, performance, behavioral);

    return {
      summary,
      trends,
      performance,
      behavioral,
      insights
    };
  }, [interviewData, filterBy, generateInsights]);

  // Format time duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format percentage
  const formatPercentage = (value) => `${Math.round(value)}%`;

  // Export report functionality
  const handleExportReport = () => {
    const reportData = {
      userId,
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: analyticsData.summary,
      insights: analyticsData.insights,
      performance: analyticsData.performance,
      behavioral: analyticsData.behavioral
    };
    
    if (onExportReport) {
      onExportReport(reportData);
    }
  };

  // Enhanced radar chart data for comprehensive behavioral analysis
  const radarData = [
    {
      subject: 'Eye Contact',
      score: analyticsData.behavioral.eyeContact || 0,
      fullMark: 100
    },
    {
      subject: 'Speech Clarity',
      score: analyticsData.behavioral.speechClarity || 0,
      fullMark: 100
    },
    {
      subject: 'Confidence',
      score: analyticsData.behavioral.confidence || 0,
      fullMark: 100
    },
    {
      subject: 'Engagement',
      score: analyticsData.behavioral.engagement || 0,
      fullMark: 100
    },
    {
      subject: 'Professionalism',
      score: analyticsData.behavioral.professionalism || 0,
      fullMark: 100
    },
    {
      subject: 'Eye Tracking',
      score: analyticsData.behavioral.eyeTrackingAccuracy || 0,
      fullMark: 100
    },
    {
      subject: 'Speech Pace',
      score: analyticsData.behavioral.speechPaceConsistency || 0,
      fullMark: 100
    },
    {
      subject: 'Emotional Stability',
      score: analyticsData.behavioral.emotionalStability || 0,
      fullMark: 100
    }
  ];
  
  // Advanced behavioral metrics for detailed analysis
  const advancedBehavioralData = [
    {
      subject: 'Attention Focus',
      score: analyticsData.behavioral.attentionFocus || 0,
      fullMark: 100
    },
    {
      subject: 'Response Coherence',
      score: analyticsData.behavioral.responseCoherence || 0,
      fullMark: 100
    },
    {
      subject: 'Gesture Appropriateness',
      score: analyticsData.behavioral.gestureAppropriatenss || 0,
      fullMark: 100
    },
    {
      subject: 'Stress Management',
      score: Math.max(0, 100 - (analyticsData.behavioral.stressIndicators || 0)),
      fullMark: 100
    }
  ];

  // Performance distribution data
  const performanceDistribution = [
    { name: 'Technical', value: analyticsData.performance.technical.count, score: analyticsData.performance.technical.score },
    { name: 'Behavioral', value: analyticsData.performance.behavioral.count, score: analyticsData.performance.behavioral.score },
    { name: 'Mixed', value: analyticsData.performance.mixed.count, score: analyticsData.performance.mixed.score }
  ].filter(item => item.value > 0);

  return (
    <div className="performance-analytics bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Performance Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive analysis of your interview performance and behavioral patterns
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filters */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Interviews</option>
              <option value="technical">Technical Only</option>
              <option value="behavioral">Behavioral Only</option>
              <option value="mixed">Mixed Interviews</option>
            </select>
            
            {/* View Mode */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="summary">Summary View</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="comparison">Comparison View</option>
            </select>
            
            {/* Export */}
            <button
              onClick={handleExportReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalInterviews || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.summary.averageScore || 0)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.summary.completionRate || 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analyticsData.summary.averageDuration || 0)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trends */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h2>
          
          {analyticsData.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Score (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Confidence (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No interview data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Behavioral Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Behavioral Analysis</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAdvancedMetrics ? 'Basic View' : 'Advanced View'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Behavioral Metrics */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Core Behavioral Metrics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData.slice(0, 5)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Advanced Behavioral Metrics */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Behavioral Metrics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={advancedBehavioralData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Behavioral Insights */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Behavioral Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Eye Tracking Accuracy:</span>
                <span className="font-medium">{Math.round(analyticsData.behavioral.eyeTrackingAccuracy || 0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Speech Pace Consistency:</span>
                <span className="font-medium">{Math.round(analyticsData.behavioral.speechPaceConsistency || 0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Emotional Stability:</span>
                <span className="font-medium">{Math.round(analyticsData.behavioral.emotionalStability || 0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Attention Focus:</span>
                <span className="font-medium">{Math.round(analyticsData.behavioral.attentionFocus || 0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Distribution and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Interview Type Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Distribution</h2>
          
          {performanceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No distribution data available</p>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showInsights ? 'Hide' : 'Show'} Insights
            </button>
          </div>
          
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {analyticsData.insights.length > 0 ? (
                  analyticsData.insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                      >
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${insight.color}20` }}>
                          <Icon className="h-4 w-4" style={{ color: insight.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{insight.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete more interviews to receive AI-powered insights</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detailed Metrics (if detailed view is selected) */}
      {viewMode === 'detailed' && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Response Time Analysis */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Response Time Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatDuration(value), 'Response Time']} />
                  <Bar dataKey="responseTime" fill={COLORS.purple} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Violation Analysis */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Security Violations</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="violations" fill={COLORS.danger} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Performance by Type */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Performance by Type</h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.performance).map(([type, data]) => (
                  data.count > 0 && (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{Math.round(data.score)}%</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;