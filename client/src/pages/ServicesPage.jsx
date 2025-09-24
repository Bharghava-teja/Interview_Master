import React from 'react';
import { motion } from 'framer-motion';

const ServicesPage = () => {
  const services = [
    {
      icon: '🎯',
      title: 'Technical Interviews',
      description: 'Comprehensive technical interview preparation with coding challenges and system design questions.',
      features: ['Live Coding Sessions', 'Algorithm Practice', 'System Design', 'Code Review']
    },
    {
      icon: '📝',
      title: 'MCQ Assessments',
      description: 'Multiple choice questions covering various technical topics and programming concepts.',
      features: ['Timed Assessments', 'Instant Feedback', 'Progress Tracking', 'Topic Coverage']
    },
    {
      icon: '📄',
      title: 'Resume Review',
      description: 'Professional resume analysis and optimization for technical positions.',
      features: ['ATS Optimization', 'Keyword Analysis', 'Format Review', 'Content Suggestions']
    },
    {
      icon: '🤖',
      title: 'AI-Powered Feedback',
      description: 'Get intelligent feedback and suggestions powered by advanced AI algorithms.',
      features: ['Real-time Analysis', 'Personalized Tips', 'Performance Metrics', 'Improvement Plans']
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive interview preparation services designed to help you succeed in your next technical interview.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of candidates who have successfully prepared for their interviews with our platform.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesPage;