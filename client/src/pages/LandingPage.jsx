import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const bgShapes = [
  { style: 'absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/40 to-indigo-300/30 rounded-full blur-3xl animate-float-slow', delay: 0 },
  { style: 'absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/30 to-blue-200/40 rounded-full blur-3xl animate-float', delay: 0.2 },
  { style: 'absolute top-1/2 left-1/2 w-40 h-40 bg-gradient-to-br from-blue-300/30 to-indigo-200/30 rounded-full blur-2xl animate-float-reverse', delay: 0.4 },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'glass');

  useEffect(() => {
    const handler = () => setTheme(localStorage.getItem('theme') || 'glass');
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const containerStagger = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemFade = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        className="relative min-h-screen flex flex-col justify-start items-stretch overflow-hidden"
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

        {/* Subtle background pattern overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, #4f46e5 2px, transparent 2px), radial-gradient(circle at 80% 30%, #2563eb 2px, transparent 2px), radial-gradient(circle at 40% 80%, #6366f1 2px, transparent 2px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* HERO */}
        <section className="relative w-full z-10 pt-8 pb-12 md:pt-12 md:pb-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
            <motion.div
              variants={containerStagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              {/* Left: Text */}
              <motion.div variants={itemFade} className="relative space-y-6">
                <motion.div 
                  className="inline-flex items-center gap-3 glass-card px-4 py-2 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="relative">
                    <span className="h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse" />
                    <span className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-gradient font-bold">AI-Powered Practice Platform</span>
                </motion.div>
                
                <div className="space-y-4">
                  <motion.h1 
                    className="text-5xl md:text-7xl font-black tracking-tight leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    <span className="text-gradient block">Interview</span>
                    <span className="text-gradient block">Master</span>
                  </motion.h1>
                  
                  <motion.p 
                    className="text-xl md:text-2xl font-medium leading-relaxed max-w-2xl" 
                    style={{ color: 'var(--text-secondary)' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {isAuthenticated
                      ? 'Welcome back! Continue your journey to interview excellence with personalized AI coaching and real-time feedback.'
                      : 'Transform your interview performance with AI-driven mock interviews, personalized feedback, and industry-specific practice scenarios.'}
                  </motion.p>
                </div>
                {/* CTAs - Only show for authenticated users */}
                {isAuthenticated && (
                  <motion.div 
                    className="mt-10 flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => navigate('/interview-selection')}
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white gradient-primary rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
                    >
                      <span>Practice</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => navigate('/resume-evaluation')}
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold glass-strong rounded-2xl border-2 transition-all duration-300 group hover:border-opacity-60"
                      style={{ borderColor: 'var(--border-accent)', color: 'var(--text-main)' }}
                    >
                      <span>Evaluate Resume</span>
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>

              {/* Right: Illustration */}
              <motion.div 
                variants={itemFade} 
                className="relative"
                initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ delay: 0.8, duration: 1, type: "spring", stiffness: 100 }}
              >
                {/* Floating elements around the main card */}
                <motion.div 
                  className="absolute -top-8 -left-8 w-16 h-16 rounded-2xl gradient-secondary opacity-80 blur-sm"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div 
                  className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-70 blur-sm"
                  animate={{ 
                    y: [0, 8, 0],
                    x: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
                
                <motion.div
                  className="relative overflow-hidden rounded-3xl glass-strong shadow-2xl border-2"
                  style={{ borderColor: 'var(--border-accent)' }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: -2,
                    rotateX: 2
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Enhanced background gradients */}
                  <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full gradient-primary opacity-20 blur-3xl animate-pulse" />
                  <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full gradient-secondary opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                  
                  <div className="relative aspect-[4/3] w-full p-8">
                    {/* Enhanced SVG illustration */}
                     <svg viewBox="0 0 800 600" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Modern interview practice illustration">
                       <defs>
                         <linearGradient id="primaryGrad" x1="0" x2="1" y1="0" y2="1">
                           <stop offset="0%" stopColor="#3b82f6" />
                           <stop offset="50%" stopColor="#6366f1" />
                           <stop offset="100%" stopColor="#8b5cf6" />
                         </linearGradient>
                         <linearGradient id="secondaryGrad" x1="0" x2="1" y1="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" />
                           <stop offset="100%" stopColor="#06b6d4" />
                         </linearGradient>
                         <linearGradient id="screenGrad" x1="0" x2="0" y1="0" y2="1">
                           <stop offset="0%" stopColor="#f8fafc" />
                           <stop offset="100%" stopColor="#e2e8f0" />
                         </linearGradient>
                         <filter id="glow">
                           <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                           <feMerge> 
                             <feMergeNode in="coloredBlur"/>
                             <feMergeNode in="SourceGraphic"/> 
                           </feMerge>
                         </filter>
                       </defs>
                       
                       {/* Background elements */}
                       <circle cx="150" cy="150" r="80" fill="url(#primaryGrad)" opacity="0.1" />
                       <circle cx="650" cy="450" r="60" fill="url(#secondaryGrad)" opacity="0.1" />
                       
                       {/* Modern laptop */}
                       <rect x="200" y="260" rx="24" ry="24" width="400" height="260" fill="url(#screenGrad)" stroke="#cbd5e1" strokeWidth="2" filter="url(#glow)" />
                       <rect x="220" y="280" width="360" height="200" rx="16" fill="#1e293b" opacity="0.05" />
                       <rect x="240" y="490" width="320" height="16" rx="8" fill="#94a3b8" />
                       
                       {/* Chat interface */}
                       <rect x="260" y="300" width="200" height="40" rx="12" fill="url(#primaryGrad)" opacity="0.8" />
                       <rect x="280" y="310" width="160" height="8" rx="4" fill="white" opacity="0.9" />
                       <rect x="280" y="322" width="120" height="8" rx="4" fill="white" opacity="0.7" />
                       
                       <rect x="340" y="360" width="240" height="40" rx="12" fill="#f1f5f9" stroke="#e2e8f0" />
                       <rect x="360" y="370" width="180" height="8" rx="4" fill="#64748b" opacity="0.6" />
                       <rect x="360" y="382" width="140" height="8" rx="4" fill="#64748b" opacity="0.4" />
                       
                       <rect x="260" y="420" width="180" height="40" rx="12" fill="url(#secondaryGrad)" opacity="0.8" />
                       <rect x="280" y="430" width="140" height="8" rx="4" fill="white" opacity="0.9" />
                       <rect x="280" y="442" width="100" height="8" rx="4" fill="white" opacity="0.7" />
                       
                       {/* Modern person avatar */}
                       <circle cx="120" cy="280" r="60" fill="url(#primaryGrad)" filter="url(#glow)" />
                       <circle cx="120" cy="270" r="20" fill="white" opacity="0.9" />
                       <path d="M 90 320 Q 120 300 150 320 L 150 380 Q 120 400 90 380 Z" fill="url(#primaryGrad)" opacity="0.8" />
                       
                       {/* AI assistant */}
                       <circle cx="680" cy="200" r="45" fill="url(#secondaryGrad)" filter="url(#glow)" />
                       <circle cx="670" cy="190" r="8" fill="white" opacity="0.9" />
                       <circle cx="690" cy="190" r="8" fill="white" opacity="0.9" />
                       <path d="M 665 210 Q 680 220 695 210" stroke="white" strokeWidth="3" fill="none" opacity="0.9" />
                       
                       {/* Floating UI elements */}
                       <rect x="650" y="260" width="80" height="30" rx="15" fill="url(#secondaryGrad)" opacity="0.6" />
                       <circle cx="665" cy="275" r="4" fill="white" />
                       <rect x="675" y="270" width="40" height="4" rx="2" fill="white" opacity="0.8" />
                       <rect x="675" y="278" width="30" height="4" rx="2" fill="white" opacity="0.6" />
                       
                       {/* Decorative elements */}
                       <circle cx="680" cy="480" r="12" fill="url(#primaryGrad)" opacity="0.6" />
                       <circle cx="720" cy="500" r="8" fill="url(#secondaryGrad)" opacity="0.6" />
                       <circle cx="100" cy="450" r="6" fill="url(#primaryGrad)" opacity="0.4" />
                      <circle cx="700" cy="560" r="10" fill="#60a5fa" />
                    </svg>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="relative z-10 py-16 md:py-24">
          <div className="w-full px-4 sm:px-8 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-3xl p-[2px] bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 shadow-xl">
                <div
                  className="rounded-3xl p-8 md:p-12 lg:p-16 bg-white/70 backdrop-blur"
                  style={{ background: 'var(--glass)' }}
                >
                  <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-blue-700 drop-shadow">
                    Why Choose Interview Master?
                  </h2>
                  <motion.div
                    variants={containerStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10"
                  >
                    {[
                      { icon: '💬', title: 'Improve Communication', desc: 'Practice realistic scenarios to sharpen verbal and non‑verbal skills.' },
                      { icon: '💪', title: 'Build Confidence', desc: 'Safe, repeatable sessions that reduce anxiety before the big day.' },
                      { icon: '📊', title: 'Instant Feedback', desc: 'Actionable insights on answers, delivery, and pacing—instantly.' },
                      { icon: '📈', title: 'Track Progress', desc: 'See trends over time with clear metrics and recommendations.' },
                    ].map((card, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemFade}
                        className="text-center rounded-2xl p-6 md:p-7 lg:p-8 bg-white/70 backdrop-blur border border-blue-100 shadow-md hover:shadow-xl transition-all duration-200"
                        style={{ background: 'var(--glass)' }}
                      >
                        <div className="text-4xl mb-4">{card.icon}</div>
                        <h3 className="text-xl font-semibold text-blue-800 mb-2">{card.title}</h3>
                        <p className="text-gray-700">{card.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="relative z-10 py-16 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-blue-700 drop-shadow">
              How It Works
            </h2>
            <motion.ol
              variants={containerStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10"
            >
              {[
                {
                  title: 'Choose your interview type',
                  desc: 'Select “Technical” for skills-based prep or “Main Professional Interview” for resume-driven conversation.',
                  icon: (
                    <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M5 12h14" />
                      <path d="M7 18h10" />
                    </svg>
                  ),
                },
                {
                  title: 'Get tailored questions',
                  desc: 'We generate questions matched to your role and choice—so practice feels relevant.',
                  icon: (
                    <svg className="h-10 w-10 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.3-4.3" />
                      <path d="M11 8a3 3 0 0 1 3 3c0 2-3 2-3 4" />
                      <circle cx="11" cy="17" r="0.75" />
                    </svg>
                  ),
                },
                {
                  title: 'Receive instant feedback',
                  desc: 'See strengths, gaps, and clear tips to improve your next answer immediately.',
                  icon: (
                    <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l4-4 4 4 5-5" />
                    </svg>
                  ),
                },
              ].map((step, index) => (
                <motion.li
                  key={index}
                  variants={itemFade}
                  className="rounded-2xl p-6 md:p-7 lg:p-8 bg-white/70 backdrop-blur border border-blue-100 shadow-md hover:shadow-xl transition-all duration-200"
                  style={{ background: 'var(--glass)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">{step.title}</h3>
                      <p className="mt-1 text-gray-700">{step.desc}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
            {/* Removed bottom CTA per request */}
          </div>
        </section>


      </motion.div>
    </AnimatePresence>
  );
};

export default LandingPage;