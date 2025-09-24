import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const bgShapes = [
  { style: 'absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-400/40 to-indigo-300/30 rounded-full blur-2xl animate-float-slow', delay: 0 },
  { style: 'absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tr from-indigo-400/30 to-blue-200/40 rounded-full blur-2xl animate-float', delay: 0.2 },
];

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');
  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem('theme') || 'glass');
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await userAPI.updatePassword(passwordData);
      setSuccess('Password updated successfully!');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
          className="bg-white/80 rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-12 border border-blue-100 backdrop-blur-lg relative z-10 bg-card"
          style={{ background: 'var(--glass)', color: 'var(--text-main)' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="flex justify-center mb-6">
            <motion.span
              className="text-5xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', type: 'tween' }}
            >
              👤
            </motion.span>
          </div>
          <h1 className="text-4xl font-extrabold text-blue-700 mb-8 text-center drop-shadow">Profile</h1>
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
          <motion.div
            className="space-y-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900">{user?.name}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900">{user?.email}</div>
            </div>
          </motion.div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4 text-blue-700">Change Password</h3>
            {!showPasswordForm ? (
              <motion.button
                onClick={() => setShowPasswordForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Change Password
              </motion.button>
            ) : (
              <motion.form
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </div>
          <div className="border-t pt-6 mt-6">
            <motion.button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Profile;