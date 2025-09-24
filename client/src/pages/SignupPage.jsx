import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const bgShapes = [
  { style: 'absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400/40 to-indigo-300/30 rounded-full blur-2xl animate-float-slow', delay: 0 },
  { style: 'absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tr from-indigo-400/30 to-blue-200/40 rounded-full blur-2xl animate-float', delay: 0.2 },
];

const SignupPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  // Password validation rules
  const passwordRules = [
    { id: 'length', text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', text: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', text: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', text: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', text: 'One special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  // Check password strength
  const getPasswordStrength = (password) => {
    const passedRules = passwordRules.filter(rule => rule.test(password)).length;
    if (passedRules <= 2) return { strength: 'weak', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (passedRules <= 3) return { strength: 'fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (passedRules <= 4) return { strength: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { strength: 'strong', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem('theme') || 'glass');
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.signup(formData);
      setSuccess('Account created successfully! Please login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-4xl font-extrabold text-center mb-8 text-blue-700 drop-shadow">Sign Up</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-700 text-base font-semibold mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-lg bg-gray-50 shadow-sm text-gray-900 placeholder-gray-500"
                required
              />
            </div>
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
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className={`text-sm font-medium ${passwordStrength.color} mb-2`}>
                    Password Strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/5' :
                        passwordStrength.strength === 'fair' ? 'bg-yellow-500 w-2/5' :
                        passwordStrength.strength === 'good' ? 'bg-blue-500 w-3/5' :
                        'bg-green-500 w-full'
                      }`}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              {(passwordFocused || formData.password) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    {passwordRules.map((rule) => {
                      const isValid = rule.test(formData.password);
                      return (
                        <div key={rule.id} className="flex items-center text-sm">
                          <span className={`mr-2 ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
                            {isValid ? '✓' : '○'}
                          </span>
                          <span className={isValid ? 'text-green-600' : 'text-gray-600'}>
                            {rule.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-2xl shadow-lg text-lg transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </motion.button>
          </form>
          <p className="text-center mt-8 text-base">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Login
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SignupPage;