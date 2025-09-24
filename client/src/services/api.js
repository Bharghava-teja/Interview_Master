import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  retry: 3, // Number of retries
  retryDelay: 1000, // Delay between retries
});

// Add retry logic and token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add retry count to config
    config.retryCount = config.retryCount || 0;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration and implement retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Handle network errors and timeouts with retry
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || 
        error.response?.status >= 500 || !error.response) {
      
      if (config && config.retryCount < (config.retry || 3)) {
        config.retryCount += 1;
        
        console.log(`Retrying request (${config.retryCount}/${config.retry || 3}): ${config.url}`);
        
        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, (config.retryDelay || 1000) * config.retryCount)
        );
        
        return api(config);
      }
    }
    
    // Handle authentication errors
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      console.log('Authentication failed, clearing tokens');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updatePassword: (passwordData) => api.put('/users/password', passwordData),
};

// Enhanced Interview APIs
export const interviewAPI = {
  // Get MCQs with category and difficulty support
  getMcqs: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.count) queryParams.append('count', params.count);
    
    const url = queryParams.toString() ? `/mcqs?${queryParams.toString()}` : '/mcqs';
    return api.get(url);
  },
  
  // Get coding challenge
  getCodingChallenge: () => api.get('/coding'),
  
  // Run code execution
  runCode: (payload) => api.post('/run-code', payload),
  
  // Submit comprehensive feedback
  submitFeedback: (payload) => api.post('/feedback', payload),
  
  // Get exam history
  getExamHistory: () => api.get('/exam/history'),
  
  // Get specific exam report
  getExamReport: (examId) => api.get(`/exam/report/${examId}`),
  
  // Log security violations
  logViolation: (violation) => api.post('/exam/violation', violation),
  
  // Save exam progress
  saveExamProgress: (progress) => api.post('/exam/progress', progress),
  
  // Get exam progress
  getExamProgress: (examId) => api.get(`/exam/progress/${examId}`),
};

// Exam-specific APIs
export const examAPI = {
  // Start new exam
  startExam: (examConfig) => api.post('/exam/start', examConfig),
  
  // Submit exam section
  submitSection: (examId, section, data) => api.post(`/exam/${examId}/section/${section}`, data),
  
  // Complete exam
  completeExam: (examId, data) => api.post(`/exam/${examId}/complete`, data),
  
  // Get exam analytics
  getAnalytics: (examId) => api.get(`/exam/${examId}/analytics`),
  
  // Export exam report
  exportReport: (examId, format = 'pdf') => api.get(`/exam/${examId}/export?format=${format}`),
};

// Analytics and reporting APIs
export const analyticsAPI = {
  // Get user performance analytics
  getUserAnalytics: () => api.get('/analytics/user'),
  
  // Get category performance
  getCategoryPerformance: (category) => api.get(`/analytics/category/${category}`),
  
  // Get difficulty performance
  getDifficultyPerformance: (difficulty) => api.get(`/analytics/difficulty/${difficulty}`),
  
  // Get improvement trends
  getImprovementTrends: (timeframe = '30d') => api.get(`/analytics/trends?timeframe=${timeframe}`),
};

export default api;