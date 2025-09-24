import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { VARIANTS, INTERACTIONS, PRESETS } from '../utils/animationUtils';

const themes = [
  { name: 'light', icon: '☀️', label: 'Light' },
  { name: 'dark', icon: '🌙', label: 'Dark' },
  { name: 'glass', icon: '🪟', label: 'Glass' },
];

function setThemeClass(theme) {
  document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-glass');
  document.documentElement.classList.add(`theme-${theme}`);
}

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');
  const [open, setOpen] = useState(false);
  const { getOptimizedVariants, shouldAnimate } = useOptimizedAnimation();

  // Listen for theme changes (cross-tab and in-app)
  useEffect(() => {
    setThemeClass(theme);
    localStorage.setItem('theme', theme);
    // Custom event for in-app theme sync
    window.dispatchEvent(new Event('themechange'));
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => {
      const t = localStorage.getItem('theme') || 'glass';
      setThemeClass(t);
      setTheme(t);
    };
    window.addEventListener('storage', syncTheme);
    window.addEventListener('themechange', syncTheme);
    // On mount, ensure correct theme
    syncTheme();
    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('themechange', syncTheme);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        className="bg-white/80 backdrop-blur-lg border border-blue-200 shadow-xl rounded-full p-4 flex items-center justify-center hover:scale-110 transition-all focus:outline-none"
        {...(shouldAnimate ? INTERACTIONS.button : {})}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle theme switcher"
      >
        <span className="text-2xl">
          {themes.find((t) => t.name === theme)?.icon || '🪟'}
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mt-2 flex flex-col items-end space-y-2"
            {...getOptimizedVariants(PRESETS.dropdown)}
          >
            {themes.map((t) => (
              <motion.button
                key={t.name}
                className={`w-32 flex items-center justify-between px-4 py-2 rounded-xl shadow bg-white/90 border border-blue-100 text-lg font-semibold hover:bg-blue-50 transition-all ${theme === t.name ? 'ring-2 ring-blue-400' : ''}`}
                {...(shouldAnimate ? INTERACTIONS.button : {})}
                onClick={() => { setTheme(t.name); setOpen(false); }}
              >
                <span className="text-xl mr-2">{t.icon}</span>
                {t.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;