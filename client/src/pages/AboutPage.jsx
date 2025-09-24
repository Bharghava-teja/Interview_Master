import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AboutPage = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');
  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem('theme') || 'glass');
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/90 rounded-2xl shadow-2xl max-w-3xl w-full p-10 md:p-16 text-center border border-blue-100" style={{ background: 'var(--glass)', color: 'var(--text-main)' }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-6 drop-shadow-sm">About Interview Master</h1>
          <p className="text-lg md:text-xl mb-8">
            <span className="font-semibold text-blue-600">Interview Master</span> is your all-in-one platform for mastering job interviews. Whether you're a student, a professional, or a career switcher, our app helps you practice, improve, and gain confidence with:
          </p>
          <ul className="text-left mb-8 space-y-3 mx-auto max-w-xl">
            <li><span className="font-bold text-blue-600">• Mock Interviews:</span> Simulate real interview scenarios for technical, behavioral, and system design rounds.</li>
            <li><span className="font-bold text-blue-600">• AI-Powered Feedback:</span> Get instant, actionable feedback to improve your answers and communication.</li>
            <li><span className="font-bold text-blue-600">• Progress Tracking:</span> Visualize your growth and identify areas for improvement over time.</li>
            <li><span className="font-bold text-blue-600">• Scam Detection:</span> Stay safe with our upcoming scam detection features for remote interviews.</li>
          </ul>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <div className="flex-1 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-6 shadow-md border border-blue-200" style={{ background: 'var(--glass)' }}>
              <h2 className="text-2xl font-bold text-blue-700 mb-2">Why Choose Us?</h2>
              <ul className="list-disc list-inside text-left space-y-1">
                <li>Modern, distraction-free interface</li>
                <li>Realistic interview experience</li>
                <li>Secure and private</li>
                <li>Continuous updates and new features</li>
              </ul>
            </div>
            <div className="flex-1 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl p-6 shadow-md border border-blue-200" style={{ background: 'var(--glass)' }}>
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">Our Mission</h2>
              <p>
                To empower every job seeker to ace their interviews and land their dream job, with confidence and skill.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AboutPage;