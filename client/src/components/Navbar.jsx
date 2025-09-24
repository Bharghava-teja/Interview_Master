import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AccessibleMainNav, 
  AccessibleMobileMenu, 
  AccessibleButton 
} from '../utils/accessibility';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 120,
        damping: 25,
        staggerChildren: 0.08
      }
    }
  };

  const logoAnimation = {
    hover: { 
      scale: 1.08,
      rotate: [0, -2, 2, 0],
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 12,
        rotate: { type: 'tween', duration: 0.3, ease: 'easeInOut' }
      }
    }
  };

  const buttonHover = {
    hover: { 
      scale: 1.05,
      y: -2,
      boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
      transition: { type: 'spring', stiffness: 400, damping: 15 }
    },
    tap: { scale: 0.95, y: 0 }
  };

  // Navigation items based on authentication status
  const navItems = isAuthenticated ? [
    { 
      name: 'Home', 
      path: '/', 
      icon: '',
      description: 'Back to homepage'
    },
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: '',
      description: 'Analytics & insights'
    },
    { 
      name: 'Resume Evaluation', 
      path: '/resume-evaluation', 
      icon: '',
      description: 'Evaluate your resume'
    },
    { 
      name: 'History', 
      path: '/history', 
      icon: '',
      description: 'Your interview history'
    },
    { 
      name: 'About', 
      path: '/about', 
      icon: '',
      description: 'About the platform'
    },
    { 
      name: 'contact', 
      path: '/contact', 
      icon: '',
      description: 'Feedback & Support'
    }
  ] : [];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 shadow-xl border-b border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white/80 dark:bg-gray-900/80 shadow-lg border-b border-gray-200/30 dark:border-gray-700/30'
      } backdrop-blur-xl`}
      style={{ 
        background: scrolled 
          ? 'var(--glass-strong)' 
          : 'var(--glass)',
        borderColor: 'var(--border-primary)'
      }}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <motion.div
            className="flex items-center space-x-3"
            variants={logoAnimation}
            whileHover="hover"
          >
            <Link 
              to="/" 
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
              onClick={() => handleNavigation('/')}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:rotate-3">
                  <span className="text-white font-black text-xl tracking-tight">IM</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg">
                  <div className="w-full h-full rounded-full bg-white/30 animate-ping"></div>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  Interview Master
                </h1>
                <p className="text-xs font-medium opacity-70 -mt-1" style={{ color: 'var(--text-secondary)' }}>
                  AI-Powered Practice Platform
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Only show for authenticated users */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-5 ml-auto">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      active
                        ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg'
                        : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                    }`}
                    style={{
                      color: active ? 'white' : 'var(--text-primary)',
                      backgroundColor: active ? undefined : 'transparent'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={item.description}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </span>
                    {active && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-600/20 -z-10"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Authentication Buttons */}
          <div className="hidden md:flex items-center space-x-3 ml-auto">
            {!isAuthenticated ? (
              <>
                <motion.div variants={buttonHover} whileHover="hover">
                  <Link
                    to="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                </motion.div>
                <motion.div variants={buttonHover} whileHover="hover">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 font-semibold rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Sign in
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={buttonHover} whileHover="hover">
                  <Link
                    to="/profile"
                    className="px-4 py-2.5 font-medium rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    👤 Profile
                  </Link>
                </motion.div>
                <motion.div variants={buttonHover} whileHover="hover">
                  <button
                    onClick={logout}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2"
                  >
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <motion.div {...buttonHover} className="inline-block md:hidden">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-3 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>✨</span>
                    Get Started
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </motion.div>
            ) : (
              <div className="md:hidden flex items-center gap-3">
                <motion.div {...buttonHover} className="inline-block">
                  <Link
                    to="/profile"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 text-lg flex items-center gap-2 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span>👤</span>
                      Profile
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </motion.div>
                <motion.button
                  {...buttonHover}
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold px-5 py-3 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-rose-300 text-sm flex items-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>🚪</span>
                    Logout
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </div>
            )}
            {/* Mobile menu button */}
            <motion.button
              className="md:hidden p-3 rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onClick={() => setMobileOpen(!mobileOpen)}
              variants={buttonHover}
              whileHover="hover"
              whileTap={{ scale: 0.95 }}
              aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileOpen}
              style={{ color: 'var(--text-primary)' }}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center relative">
                <motion.span 
                  className="block h-0.5 w-6 bg-current rounded-full"
                  animate={{
                    rotate: mobileOpen ? 45 : 0,
                    y: mobileOpen ? 6 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span 
                  className="block h-0.5 w-6 bg-current rounded-full mt-1.5"
                  animate={{
                    opacity: mobileOpen ? 0 : 1,
                    x: mobileOpen ? -10 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span 
                  className="block h-0.5 w-6 bg-current rounded-full mt-1.5"
                  animate={{
                    rotate: mobileOpen ? -45 : 0,
                    y: mobileOpen ? -6 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.button>
          </div>
        </div>
        {/* Enhanced Mobile Menu */}
        <motion.div
          className="md:hidden overflow-hidden"
          initial={false}
          animate={{
            height: mobileOpen ? 'auto' : 0,
            opacity: mobileOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="px-4 pt-4 pb-6 space-y-2" style={{ 
            background: 'var(--glass-strong)',
            borderTop: '1px solid var(--border-primary)'
          }}>
            {/* Only show navigation items for authenticated users */}
            {isAuthenticated && navItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <motion.button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 ${
                    active
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                  }`}
                  style={{
                    color: active ? 'white' : 'var(--text-primary)'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: mobileOpen ? 1 : 0, 
                    x: mobileOpen ? 0 : -20 
                  }}
                  transition={{ 
                    delay: mobileOpen ? index * 0.1 : 0,
                    duration: 0.3 
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    <p className="text-xs opacity-70 mt-0.5">{item.description}</p>
                  </div>
                </motion.button>
              );
            })}
            
            {/* Mobile Auth Section */}
            <motion.div 
              className={`${isAuthenticated ? 'pt-4 border-t' : 'pt-4'} space-y-2`}
              style={{ borderColor: isAuthenticated ? 'var(--border-primary)' : 'transparent' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: mobileOpen ? 1 : 0 }}
              transition={{ delay: mobileOpen ? 0.4 : 0, duration: 0.3 }}
            >
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavigation('/signup')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="w-full px-4 py-3 font-medium rounded-xl transition-all duration-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;