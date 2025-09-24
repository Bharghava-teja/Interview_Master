import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Brain,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Zap,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

const QuestionAnalyticsDashboard = ({ 
  questionData = [], 
  interviewData = [],
  onExportReport,
  userId 
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'comparison'
  const [sortBy, setSortBy] = useState('difficulty'); // 'difficulty', 'time', 'score', 'category'

  // Color schemes
  const COLORS = {
    easy: '#10B981',
    medium: '#F59E0B', 
    hard: '#EF4444',
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  // Process question analytics data
  const analyticsData = useMemo(() => {
    if (!questionData || questionData.length === 0) {
      return {
        questionMetrics: [],
        difficultyBreakdown: [],
        categoryPerformance: [],
        timeAnalysis: [],
        performanceTrends: [],
        insights: []
      };
    }

    // Filter data based on selected criteria
    const filteredQuestions = questionData.filter(q => {
      const difficultyMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const categoryMatch = selectedCategory === 'all' || q.category === selectedCategory;
      return difficultyMatch && categoryMatch;
    });

    // Calculate question-level metrics
    const questionMetrics = filteredQuestions.map((question, index) => {
      const responses = question.responses || [];
      const avgScore = responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length 
        : 0;
      const avgTime = responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / responses.length 
        : 0;
      const successRate = responses.length > 0 
        ? (responses.filter(r => (r.score || 0) >= 70).length / responses.length) * 100 
        : 0;

      return {
        id: question.id || index,
        question: question.text || `Question ${index + 1}`,
        category: question.category || 'General',
        difficulty: question.difficulty || 'medium',
        avgScore: Math.round(avgScore),
        avgTime: Math.round(avgTime / 1000), // Convert to seconds
        successRate: Math.round(successRate),
        totalAttempts: responses.length,
        difficultyScore: question.difficultyScore || (question.difficulty === 'easy' ? 1 : question.difficulty === 'medium' ? 2 : 3),
        keywords: question.keywords || [],
        expectedTime: question.expectedTime || 120, // 2 minutes default
        skillsAssessed: question.skillsAssessed || []
      };
    });

    // Difficulty breakdown
    const difficultyBreakdown = ['easy', 'medium', 'hard'].map(difficulty => {
      const questions = questionMetrics.filter(q => q.difficulty === difficulty);
      const avgScore = questions.length > 0 
        ? questions.reduce((sum, q) => sum + q.avgScore, 0) / questions.length 
        : 0;
      const avgTime = questions.length > 0 
        ? questions.reduce((sum, q) => sum + q.avgTime, 0) / questions.length 
        : 0;

      return {
        difficulty,
        count: questions.length,
        avgScore: Math.round(avgScore),
        avgTime: Math.round(avgTime),
        successRate: questions.length > 0 
          ? Math.round(questions.reduce((sum, q) => sum + q.successRate, 0) / questions.length)
          : 0
      };
    }).filter(item => item.count > 0);

    // Category performance
    const categories = [...new Set(questionMetrics.map(q => q.category))];
    const categoryPerformance = categories.map(category => {
      const questions = questionMetrics.filter(q => q.category === category);
      const avgScore = questions.reduce((sum, q) => sum + q.avgScore, 0) / questions.length;
      const avgTime = questions.reduce((sum, q) => sum + q.avgTime, 0) / questions.length;
      
      return {
        category,
        count: questions.length,
        avgScore: Math.round(avgScore),
        avgTime: Math.round(avgTime),
        successRate: Math.round(questions.reduce((sum, q) => sum + q.successRate, 0) / questions.length)
      };
    });

    // Time analysis
    const timeAnalysis = questionMetrics.map(q => ({
      question: q.question.substring(0, 30) + '...',
      actualTime: q.avgTime,
      expectedTime: q.expectedTime,
      efficiency: Math.round((q.expectedTime / Math.max(q.avgTime, 1)) * 100),
      difficulty: q.difficulty
    }));

    // Performance trends (simulated based on difficulty and time)
    const performanceTrends = questionMetrics.map((q, index) => ({
      questionIndex: index + 1,
      score: q.avgScore,
      time: q.avgTime,
      difficulty: q.difficultyScore,
      efficiency: Math.round((q.expectedTime / Math.max(q.avgTime, 1)) * 100)
    }));

    // Generate insights
    const insights = generateQuestionInsights(questionMetrics, difficultyBreakdown, categoryPerformance);

    return {
      questionMetrics,
      difficultyBreakdown,
      categoryPerformance,
      timeAnalysis,
      performanceTrends,
      insights
    };
  }, [questionData, selectedDifficulty, selectedCategory]);

  // Generate AI-powered insights
  const generateQuestionInsights = useCallback((questions, difficulty, categories) => {
    const insights = [];

    // Difficulty analysis
    const hardQuestions = difficulty.find(d => d.difficulty === 'hard');
    if (hardQuestions && hardQuestions.avgScore < 60) {
      insights.push({
        type: 'warning',
        title: 'Hard Questions Challenge',
        description: `Average score on hard questions is ${hardQuestions.avgScore}%. Consider more practice on advanced topics.`,
        icon: AlertCircle,
        color: COLORS.warning
      });
    }

    // Time efficiency
    const inefficientQuestions = questions.filter(q => q.avgTime > q.expectedTime * 1.5);
    if (inefficientQuestions.length > questions.length * 0.3) {
      insights.push({
        type: 'improvement',
        title: 'Time Management',
        description: `${inefficientQuestions.length} questions take significantly longer than expected. Focus on time management.`,
        icon: Clock,
        color: COLORS.warning
      });
    }

    // Category strengths
    const strongestCategory = categories.reduce((prev, current) => 
      (prev.avgScore > current.avgScore) ? prev : current
    );
    if (strongestCategory && strongestCategory.avgScore > 80) {
      insights.push({
        type: 'positive',
        title: 'Category Strength',
        description: `Excellent performance in ${strongestCategory.category} with ${strongestCategory.avgScore}% average score.`,
        icon: Award,
        color: COLORS.success
      });
    }

    // Success rate analysis
    const overallSuccessRate = questions.reduce((sum, q) => sum + q.successRate, 0) / questions.length;
    if (overallSuccessRate > 85) {
      insights.push({
        type: 'positive',
        title: 'High Success Rate',
        description: `${Math.round(overallSuccessRate)}% overall success rate indicates strong preparation.`,
        icon: CheckCircle,
        color: COLORS.success
      });
    }

    return insights;
  }, [COLORS]);

  // Sort questions based on selected criteria
  const sortedQuestions = useMemo(() => {
    return [...analyticsData.questionMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          return b.difficultyScore - a.difficultyScore;
        case 'time':
          return b.avgTime - a.avgTime;
        case 'score':
          return a.avgScore - b.avgScore; // Lower scores first for improvement focus
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  }, [analyticsData.questionMetrics, sortBy]);

  const handleExportReport = useCallback(() => {
    const reportData = {
      summary: {
        totalQuestions: analyticsData.questionMetrics.length,
        averageScore: Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.avgScore, 0) / analyticsData.questionMetrics.length),
        averageTime: Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.avgTime, 0) / analyticsData.questionMetrics.length),
        overallSuccessRate: Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.successRate, 0) / analyticsData.questionMetrics.length)
      },
      difficultyBreakdown: analyticsData.difficultyBreakdown,
      categoryPerformance: analyticsData.categoryPerformance,
      insights: analyticsData.insights,
      detailedQuestions: analyticsData.questionMetrics
    };

    if (onExportReport) {
      onExportReport(reportData);
    } else {
      // Fallback: download as JSON
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [analyticsData, onExportReport]);

  return (
    <div className="question-analytics-dashboard bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Question Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Detailed analysis of question-by-question performance and difficulty patterns
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filters */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="problem-solving">Problem Solving</option>
              <option value="system-design">System Design</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="difficulty">Sort by Difficulty</option>
              <option value="time">Sort by Time</option>
              <option value="score">Sort by Score</option>
              <option value="category">Sort by Category</option>
            </select>
            
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
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.questionMetrics.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
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
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.questionMetrics.length > 0 
                  ? Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.avgScore, 0) / analyticsData.questionMetrics.length)
                  : 0}%
              </p>
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
              <p className="text-sm font-medium text-gray-600">Average Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.questionMetrics.length > 0 
                  ? Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.avgTime, 0) / analyticsData.questionMetrics.length)
                  : 0}s
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
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
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.questionMetrics.length > 0 
                  ? Math.round(analyticsData.questionMetrics.reduce((sum, q) => sum + q.successRate, 0) / analyticsData.questionMetrics.length)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance by Difficulty</h2>
          
          {analyticsData.difficultyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.difficultyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill={COLORS.primary} name="Average Score (%)" />
                <Bar dataKey="avgTime" fill={COLORS.warning} name="Average Time (s)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No question data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance by Category</h2>
          
          {analyticsData.categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill={COLORS.success} name="Average Score (%)" />
                <Bar dataKey="successRate" fill={COLORS.primary} name="Success Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No category data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Efficiency Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Efficiency Analysis</h2>
        
        {analyticsData.timeAnalysis.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={analyticsData.timeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="expectedTime" name="Expected Time" unit="s" />
              <YAxis dataKey="actualTime" name="Actual Time" unit="s" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                name="Questions" 
                data={analyticsData.timeAnalysis} 
                fill={COLORS.primary}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time analysis data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Question List and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Details</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{question.question}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                        {question.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{question.avgScore}%</div>
                    <div className="text-sm text-gray-600">{question.avgTime}s avg</div>
                    <div className="text-xs text-gray-500">{question.totalAttempts} attempts</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Insights</h2>
          
          <div className="space-y-4">
            {analyticsData.insights.length > 0 ? (
              analyticsData.insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                <p>Complete more questions to receive AI-powered insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalyticsDashboard;