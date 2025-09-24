import React from 'react';
import { motion } from 'framer-motion';

const FeaturesPage = () => {
  const features = [
    {
      icon: '🚀',
      title: 'Real-time Feedback',
      description: 'Get instant feedback on your performance with detailed analytics and improvement suggestions.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🎯',
      title: 'Personalized Learning',
      description: 'Adaptive learning paths tailored to your skill level and career goals.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your improvement with comprehensive progress reports and performance metrics.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '🤝',
      title: 'Mock Interviews',
      description: 'Practice with realistic interview scenarios and get evaluated by industry experts.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '💡',
      title: 'Smart Recommendations',
      description: 'AI-powered suggestions for topics to focus on based on your performance patterns.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy measures.',
      color: 'from-gray-600 to-gray-800'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Powerful Features
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Discover the comprehensive set of tools and features designed to accelerate your interview preparation and boost your confidence.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 h-full">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover Border Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 text-white max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Trusted by Thousands</h2>
            <p className="text-xl opacity-90">Join our community of successful candidates</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
              <div className="text-4xl font-black mb-2">10K+</div>
              <div className="text-lg opacity-90">Successful Interviews</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
              <div className="text-4xl font-black mb-2">95%</div>
              <div className="text-lg opacity-90">Success Rate</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
              <div className="text-4xl font-black mb-2">24/7</div>
              <div className="text-lg opacity-90">Support Available</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesPage;