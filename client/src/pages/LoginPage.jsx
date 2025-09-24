import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import InterviewModeSwitch from '../components/InterviewModeSwitch';
import SecureInterviewBrand from '../components/SecureInterviewBrand';

const bgShapes = [
  { style: 'absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400/40 to-indigo-300/30 rounded-full blur-2xl animate-float-slow', delay: 0 },
  { style: 'absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tr from-indigo-400/30 to-blue-200/40 rounded-full blur-2xl animate-float', delay: 0.2 },
];

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');
  const [isSecureMode, setIsSecureMode] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem('theme') || 'glass');
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModeChange = (secureMode) => {
    setIsSecureMode(secureMode);
    setError(''); // Clear any existing errors when switching modes
    setConnectionStatus('idle'); // Reset connection status when switching modes
    setLoading(false); // Reset loading state
  };

  const handleSecureInterviewLogin = () => {
    // Manual login for Secure Interview mode
    setLoading(true);
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      setConnectionStatus('connected');
      setLoading(false);
      // Navigate to secure interview interface
      navigate('/secure-interview');
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setConnectionStatus('connecting');
    
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryAttempt(attempt);
        
        const response = await authAPI.login(formData);
        const { accessToken, user } = response.data.data;
        
        login(user, accessToken);
        setConnectionStatus('connected');
        navigate('/');
        return;
        
      } catch (err) {
        console.log(`Login attempt ${attempt}/${maxRetries} failed:`, err.message);
        
        // Check if it's a network/server error that should be retried
        const shouldRetry = (
          err.code === 'ECONNABORTED' ||
          err.code === 'NETWORK_ERROR' ||
          err.response?.status >= 500 ||
          !err.response
        );
        
        if (shouldRetry && attempt < maxRetries) {
          setError(`Connection issue detected. Retrying... (${attempt}/${maxRetries})`);
          setConnectionStatus('retrying');
          
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        // Final attempt failed or non-retryable error
        setConnectionStatus('failed');
        
        if (err.response?.status === 401) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (err.response?.status === 429) {
          setError('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (shouldRetry) {
          setError('Unable to connect to server. Please check your internet connection and try again.');
        } else {
          setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
        break;
      }
    }
    
    setLoading(false);
    setRetryAttempt(0);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        className="relative min-h-screen flex items-center justify-center px-2 overflow-hidden"
        style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {bgShapes.map((shape, i) => (
          <motion.div
            key={i}
            className={shape.style}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: shape.delay, duration: 1.2, type: 'spring' }}
            aria-hidden
          />
        ))}
        <motion.div
          className="bg-white/80 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-lg border border-blue-100 backdrop-blur-lg relative z-10"
          style={{ background: 'var(--glass)', color: 'var(--text-main)' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Interview Mode Switch */}
          <div className="mb-8">
            <InterviewModeSwitch 
              isSecureMode={isSecureMode}
              onModeChange={handleModeChange}
            />
          </div>

          <AnimatePresence mode="wait">
            {!isSecureMode ? (
              <motion.div
                key="mock-interview-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <h2 className="text-4xl font-extrabold text-center mb-8 text-blue-700 drop-shadow">Login</h2>
                
                {/* Connection Status Indicator */}
                {connectionStatus !== 'idle' && (
                  <div className={`px-4 py-3 rounded mb-4 text-sm ${
                    connectionStatus === 'connecting' || connectionStatus === 'retrying' 
                      ? 'bg-blue-100 border border-blue-400 text-blue-700'
                      : connectionStatus === 'connected'
                      ? 'bg-green-100 border border-green-400 text-green-700'
                      : 'bg-red-100 border border-red-400 text-red-700'
                  }`}>
                    {connectionStatus === 'connecting' && 'Connecting to server...'}
                    {connectionStatus === 'retrying' && `Retrying connection... (${retryAttempt}/3)`}
                    {connectionStatus === 'connected' && 'Connected successfully!'}
                    {connectionStatus === 'failed' && 'Connection failed'}
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-gray-700 text-base font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-lg bg-gray-50 shadow-sm text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-base font-semibold mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-lg bg-gray-50 pr-12 shadow-sm text-gray-900 placeholder-gray-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none text-2xl"
                        tabIndex={-1}
                        aria-label="Toggle password visibility"
                      >
                        {/* {showPassword ? '👁️' : '👁️‍🗨️'} */}
                      </button>
                    </div>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl shadow-lg text-lg transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </motion.button>
                </form>
                <p className="text-center mt-8 text-base">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                    Sign up
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                 key="secure-interview-mode"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.5, ease: 'easeInOut' }}
                 className="text-center space-y-6"
               >
                 {/* Secure Interview Branding */}
                 <SecureInterviewBrand className="mb-6" />
                 
                 {/* Connection Status for Secure Mode */}
                 {connectionStatus !== 'idle' && (
                   <div className={`px-4 py-3 rounded mb-4 text-sm ${
                     connectionStatus === 'connecting' 
                       ? 'bg-green-100 border border-green-400 text-green-700'
                       : connectionStatus === 'connected'
                       ? 'bg-green-100 border border-green-400 text-green-700'
                       : 'bg-red-100 border border-red-400 text-red-700'
                   }`}>
                     {connectionStatus === 'connecting' && 'Initializing secure connection...'}
                     {connectionStatus === 'connected' && 'Secure connection established!'}
                     {connectionStatus === 'failed' && 'Connection failed'}
                   </div>
                 )}
                 
                 <div className="space-y-4">
                   <div className="flex items-center justify-center space-x-2 text-green-600">
                     <motion.div
                       animate={{ rotate: loading ? 360 : 0 }}
                       transition={{ duration: 2, repeat: loading ? Infinity : 0, ease: 'linear' }}
                       className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full"
                     />
                     <span className="font-semibold">
                       {loading ? 'Connecting to secure environment...' : 'Ready for secure interview'}
                     </span>
                   </div>
                   
                   <p className="text-gray-600 max-w-md mx-auto">
                     Click the button below to connect to the secure interview environment 
                     with end-to-end encryption and advanced security monitoring.
                   </p>
                   
                   {/* Manual Login Button */}
                   {connectionStatus === 'idle' && !loading && (
                     <motion.button
                       onClick={handleSecureInterviewLogin}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                     >
                       <span>Connect to Secure Interview</span>
                     </motion.button>
                   )}
                   
                   {connectionStatus === 'connecting' && (
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                       <p className="font-semibold">🔄 Establishing secure connection...</p>
                       <p className="text-sm">Please wait while we set up your secure environment.</p>
                     </div>
                   )}
                   
                   {connectionStatus === 'connected' && (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
                     >
                       <p className="font-semibold">✓ Secure connection established</p>
                       <p className="text-sm">Redirecting to secure interview environment...</p>
                     </motion.div>
                   )}
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginPage;