/**
 * Enhanced Theme Context System
 * Provides comprehensive theme management with dark mode, high contrast, and accessibility features
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Theme configuration
const THEMES = {
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#64748b',
        inverse: '#ffffff'
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        focus: '#3b82f6'
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    }
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    colors: {
      primary: {
        50: '#172554',
        100: '#1e3a8a',
        200: '#1e40af',
        300: '#1d4ed8',
        400: '#2563eb',
        500: '#3b82f6',
        600: '#60a5fa',
        700: '#93c5fd',
        800: '#bfdbfe',
        900: '#dbeafe',
        950: '#eff6ff'
      },
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155'
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
        inverse: '#0f172a'
      },
      border: {
        primary: '#334155',
        secondary: '#475569',
        focus: '#60a5fa'
      },
      status: {
        success: '#22c55e',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      }
    }
  },
  highContrast: {
    name: 'high-contrast',
    displayName: 'High Contrast',
    colors: {
      primary: {
        50: '#000000',
        100: '#000000',
        200: '#000000',
        300: '#000000',
        400: '#000000',
        500: '#000000',
        600: '#ffffff',
        700: '#ffffff',
        800: '#ffffff',
        900: '#ffffff',
        950: '#ffffff'
      },
      background: {
        primary: '#ffffff',
        secondary: '#f0f0f0',
        tertiary: '#e0e0e0'
      },
      text: {
        primary: '#000000',
        secondary: '#000000',
        tertiary: '#333333',
        inverse: '#ffffff'
      },
      border: {
        primary: '#000000',
        secondary: '#333333',
        focus: '#0000ff'
      },
      status: {
        success: '#008000',
        warning: '#ff8c00',
        error: '#ff0000',
        info: '#0000ff'
      }
    }
  }
};

// Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [systemPreference, setSystemPreference] = useState('light');
  const [useSystemPreference, setUseSystemPreference] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Detect system preferences
  useEffect(() => {
    // Dark mode preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    updateSystemPreference(darkModeQuery);
    darkModeQuery.addEventListener('change', updateSystemPreference);

    // Reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (e) => {
      setReducedMotion(e.matches);
    };
    
    updateReducedMotion(reducedMotionQuery);
    reducedMotionQuery.addEventListener('change', updateReducedMotion);

    // High contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const updateHighContrast = (e) => {
      setHighContrast(e.matches);
    };
    
    updateHighContrast(highContrastQuery);
    highContrastQuery.addEventListener('change', updateHighContrast);

    return () => {
      darkModeQuery.removeEventListener('change', updateSystemPreference);
      reducedMotionQuery.removeEventListener('change', updateReducedMotion);
      highContrastQuery.removeEventListener('change', updateHighContrast);
    };
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedUseSystem = localStorage.getItem('useSystemPreference') === 'true';
    
    if (savedUseSystem) {
      setUseSystemPreference(true);
      setCurrentTheme(systemPreference);
    } else if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, [systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = useSystemPreference ? systemPreference : currentTheme;
    const finalTheme = highContrast ? 'highContrast' : effectiveTheme;
    
    // Apply theme class to document
    document.documentElement.className = `theme-${finalTheme}`;
    
    // Apply CSS custom properties
    const theme = THEMES[finalTheme];
    if (theme) {
      const root = document.documentElement;
      
      // Apply color variables
      Object.entries(theme.colors).forEach(([category, colors]) => {
        if (typeof colors === 'object') {
          Object.entries(colors).forEach(([shade, value]) => {
            root.style.setProperty(`--color-${category}-${shade}`, value);
          });
        } else {
          root.style.setProperty(`--color-${category}`, colors);
        }
      });
      
      // Apply accessibility variables
      root.style.setProperty('--reduced-motion', reducedMotion ? '1' : '0');
      root.style.setProperty('--high-contrast', highContrast ? '1' : '0');
    }
  }, [currentTheme, useSystemPreference, systemPreference, highContrast, reducedMotion]);

  // Theme change with transition
  const changeTheme = useCallback(async (newTheme) => {
    if (newTheme === currentTheme && !useSystemPreference) return;
    
    setIsTransitioning(true);
    
    // Add transition class for smooth theme change
    if (!reducedMotion) {
      document.documentElement.classList.add('theme-transitioning');
    }
    
    // Small delay to ensure transition class is applied
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setCurrentTheme(newTheme);
    setUseSystemPreference(false);
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('useSystemPreference', 'false');
    
    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, reducedMotion ? 0 : 300);
  }, [currentTheme, useSystemPreference, reducedMotion]);

  // Toggle system preference
  const toggleSystemPreference = useCallback(() => {
    const newUseSystem = !useSystemPreference;
    setUseSystemPreference(newUseSystem);
    localStorage.setItem('useSystemPreference', newUseSystem.toString());
    
    if (newUseSystem) {
      setCurrentTheme(systemPreference);
    }
  }, [useSystemPreference, systemPreference]);

  // Get current theme object
  const getCurrentTheme = useCallback(() => {
    const effectiveTheme = useSystemPreference ? systemPreference : currentTheme;
    const finalTheme = highContrast ? 'highContrast' : effectiveTheme;
    return THEMES[finalTheme];
  }, [currentTheme, useSystemPreference, systemPreference, highContrast]);

  // Theme utilities
  const isDark = useCallback(() => {
    const theme = getCurrentTheme();
    return theme.name === 'dark' || theme.name === 'high-contrast';
  }, [getCurrentTheme]);

  const getThemeColor = useCallback((path) => {
    const theme = getCurrentTheme();
    const pathArray = path.split('.');
    let color = theme.colors;
    
    for (const key of pathArray) {
      color = color?.[key];
      if (!color) break;
    }
    
    return color || '#000000';
  }, [getCurrentTheme]);

  const value = {
    // Current state
    currentTheme: useSystemPreference ? systemPreference : currentTheme,
    theme: getCurrentTheme(),
    isTransitioning,
    useSystemPreference,
    systemPreference,
    reducedMotion,
    highContrast,
    
    // Available themes
    availableThemes: Object.values(THEMES),
    
    // Actions
    changeTheme,
    toggleSystemPreference,
    
    // Utilities
    isDark,
    getThemeColor,
    
    // Theme checks
    isLight: () => getCurrentTheme().name === 'light',
    isDarkMode: () => getCurrentTheme().name === 'dark',
    isHighContrast: () => getCurrentTheme().name === 'high-contrast'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Transition Component
export const ThemeTransition = ({ children }) => {
  const { isTransitioning, reducedMotion } = useTheme();
  
  if (reducedMotion) {
    return children;
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isTransitioning ? 'transitioning' : 'stable'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced Theme Switcher Component
export const ThemeSwitcher = ({ 
  showSystemOption = true, 
  showLabels = true,
  size = 'md',
  className = '' 
}) => {
  const {
    currentTheme,
    availableThemes,
    useSystemPreference,
    changeTheme,
    toggleSystemPreference,
    reducedMotion
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const sizes = {
    sm: 'p-1 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const buttonVariants = {
    hover: { scale: reducedMotion ? 1 : 1.05 },
    tap: { scale: reducedMotion ? 1 : 0.95 }
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };

  const getThemeIcon = (themeName) => {
    switch (themeName) {
      case 'light':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'high-contrast':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        className={`
          flex items-center gap-2 rounded-lg border border-gray-300 bg-white
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700
          ${sizes[size]}
        `}
        onClick={() => setIsOpen(!isOpen)}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {getThemeIcon(currentTheme)}
        {showLabels && (
          <span className="text-gray-700 dark:text-gray-300">
            {useSystemPreference ? 'System' : 
             availableThemes.find(t => t.name === currentTheme)?.displayName}
          </span>
        )}
        <motion.svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
            variants={!reducedMotion ? dropdownVariants : {}}
            initial={!reducedMotion ? 'closed' : false}
            animate={!reducedMotion ? 'open' : false}
            exit={!reducedMotion ? 'closed' : false}
            onBlur={() => setIsOpen(false)}
          >
            {showSystemOption && (
              <motion.button
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${useSystemPreference ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                `}
                onClick={() => {
                  toggleSystemPreference();
                  setIsOpen(false);
                }}
                whileHover={!reducedMotion ? { x: 4 } : {}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                System
              </motion.button>
            )}
            
            {availableThemes.map((theme) => (
              <motion.button
                key={theme.name}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${currentTheme === theme.name && !useSystemPreference ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                `}
                onClick={() => {
                  changeTheme(theme.name);
                  setIsOpen(false);
                }}
                whileHover={!reducedMotion ? { x: 4 } : {}}
              >
                {getThemeIcon(theme.name)}
                {theme.displayName}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default {
  ThemeProvider,
  useTheme,
  ThemeTransition,
  ThemeSwitcher
};