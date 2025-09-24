/**
 * Enhanced Theme Transitions Component
 * Provides smooth animated transitions between light, dark, and glass themes
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

// Theme definitions
const THEMES = {
  light: {
    name: 'light',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      accent: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)'
    }
  },
  
  dark: {
    name: 'dark',
    colors: {
      primary: '#60A5FA',
      secondary: '#9CA3AF',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      border: '#334155',
      accent: '#A78BFA',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)'
    },
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(16px)'
    }
  },
  
  glass: {
    name: 'glass',
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      background: 'rgba(255, 255, 255, 0.1)',
      surface: 'rgba(255, 255, 255, 0.2)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(255, 255, 255, 0.3)',
      accent: '#8B5CF6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.15)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)'
    },
    blur: {
      sm: 'blur(8px)',
      md: 'blur(16px)',
      lg: 'blur(32px)'
    },
    backdrop: 'backdrop-blur-md backdrop-saturate-150'
  }
};

// Theme context
const ThemeContext = createContext();

export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTheme, setPreviousTheme] = useState(null);
  
  // Get theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);
  
  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);
  
  const changeTheme = useCallback((newTheme) => {
    if (newTheme === currentTheme || !THEMES[newTheme]) return;
    
    setPreviousTheme(currentTheme);
    setIsTransitioning(true);
    
    // Delay theme change to allow transition animation
    setTimeout(() => {
      setCurrentTheme(newTheme);
      setTimeout(() => {
        setIsTransitioning(false);
        setPreviousTheme(null);
      }, 300);
    }, 150);
  }, [currentTheme]);
  
  const toggleTheme = useCallback(() => {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
  }, [currentTheme, changeTheme]);
  
  const theme = THEMES[currentTheme];
  
  return (
    <ThemeContext.Provider value={{
      currentTheme,
      theme,
      changeTheme,
      toggleTheme,
      isTransitioning,
      previousTheme,
      availableThemes: Object.keys(THEMES)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Animated theme wrapper
export const AnimatedThemeWrapper = ({ children, className = '' }) => {
  const { theme, isTransitioning, previousTheme } = useTheme();
  const { shouldAnimate } = useOptimizedAnimation();
  
  const wrapperVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: 'easeInOut'
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: shouldAnimate ? 0.15 : 0,
        ease: 'easeIn'
      }
    }
  };
  
  return (
    <motion.div
      className={`theme-wrapper ${theme.name} ${className}`}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        transition: shouldAnimate ? 'background-color 0.3s ease, color 0.3s ease' : 'none'
      }}
      variants={wrapperVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

// Theme transition overlay
export const ThemeTransitionOverlay = () => {
  const { isTransitioning, currentTheme, previousTheme } = useTheme();
  const { shouldAnimate } = useOptimizedAnimation();
  
  if (!isTransitioning || !shouldAnimate) return null;
  
  const overlayVariants = {
    initial: { 
      scale: 0,
      borderRadius: '50%',
      opacity: 0
    },
    animate: { 
      scale: 20,
      borderRadius: '0%',
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };
  
  const currentColors = THEMES[currentTheme]?.colors;
  const previousColors = THEMES[previousTheme]?.colors;
  
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="w-32 h-32"
            style={{
              background: `linear-gradient(45deg, ${previousColors?.primary || '#3B82F6'}, ${currentColors?.primary || '#3B82F6'})`,
              borderRadius: '50%'
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Theme-aware component wrapper
export const ThemedComponent = ({ 
  children, 
  variant = 'surface',
  className = '',
  animate = true,
  ...props 
}) => {
  const { theme } = useTheme();
  const { shouldAnimate } = useOptimizedAnimation();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'surface':
        return {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          borderColor: theme.colors.border
        };
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          color: '#FFFFFF'
        };
      case 'glass':
        return {
          backgroundColor: theme.name === 'glass' ? theme.colors.surface : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: theme.blur.md,
          borderColor: theme.colors.border
        };
      default:
        return {
          backgroundColor: theme.colors.background,
          color: theme.colors.text
        };
    }
  };
  
  const componentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldAnimate && animate ? 0.3 : 0,
        ease: 'easeOut'
      }
    }
  };
  
  return (
    <motion.div
      className={className}
      style={{
        ...getVariantStyles(),
        transition: shouldAnimate ? 'all 0.3s ease' : 'none'
      }}
      variants={componentVariants}
      initial="initial"
      animate="animate"
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Theme toggle button
export const ThemeToggleButton = ({ className = '', size = 'md' }) => {
  const { currentTheme, toggleTheme, isTransitioning } = useTheme();
  const { shouldAnimate } = useOptimizedAnimation();
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const buttonVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.1,
      transition: {
        duration: shouldAnimate ? 0.2 : 0,
        ease: 'easeOut'
      }
    },
    tap: { 
      scale: 0.95,
      transition: {
        duration: shouldAnimate ? 0.1 : 0
      }
    },
    transitioning: {
      rotate: 360,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: 'easeInOut'
      }
    }
  };
  
  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        );
      case 'glass':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <motion.button
      className={`${sizes[size]} rounded-full bg-opacity-20 backdrop-blur-sm border border-opacity-30 flex items-center justify-center transition-colors ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      animate={isTransitioning ? "transitioning" : "idle"}
      onClick={toggleTheme}
      disabled={isTransitioning}
      aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'glass' : 'light'} theme`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTheme}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: shouldAnimate ? 0.2 : 0 }}
        >
          {getThemeIcon()}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

// Theme selector component
export const ThemeSelector = ({ className = '' }) => {
  const { currentTheme, changeTheme, availableThemes, isTransitioning } = useTheme();
  const { shouldAnimate } = useOptimizedAnimation();
  
  const selectorVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        staggerChildren: shouldAnimate ? 0.1 : 0
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.2 : 0
      }
    }
  };
  
  return (
    <motion.div
      className={`flex space-x-2 ${className}`}
      variants={selectorVariants}
      initial="hidden"
      animate="visible"
    >
      {availableThemes.map((themeName) => {
        const theme = THEMES[themeName];
        const isActive = currentTheme === themeName;
        
        return (
          <motion.button
            key={themeName}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              isActive ? 'border-white shadow-lg scale-110' : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{
              backgroundColor: theme.colors.primary,
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}
            variants={itemVariants}
            whileHover={{ scale: isActive ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => changeTheme(themeName)}
            disabled={isTransitioning}
            aria-label={`Switch to ${themeName} theme`}
          >
            <span className="sr-only">{themeName} theme</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

// CSS custom properties updater
export const ThemeCSSUpdater = () => {
  const { theme } = useTheme();
  
  useEffect(() => {
    const root = document.documentElement;
    
    // Update CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    Object.entries(theme.blur).forEach(([key, value]) => {
      root.style.setProperty(`--blur-${key}`, value);
    });
    
    if (theme.backdrop) {
      root.style.setProperty('--backdrop', theme.backdrop);
    }
  }, [theme]);
  
  return null;
};

export default {
  ThemeProvider,
  useTheme,
  AnimatedThemeWrapper,
  ThemeTransitionOverlay,
  ThemedComponent,
  ThemeToggleButton,
  ThemeSelector,
  ThemeCSSUpdater
};