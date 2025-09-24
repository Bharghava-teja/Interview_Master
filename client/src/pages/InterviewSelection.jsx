import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GuidedTour from '../components/GuidedTour';
import { useOnboarding } from '../hooks/useOnboarding';
import { 
  ARIA_ROLES, 
  KEYS, 
  AccessibleButton 
} from '../utils/accessibility';

const InterviewSelection = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('resume');
  const { onboardingPreferences } = useOnboarding();
  const [showTour, setShowTour] = useState(false);
  
  // Auto-show tour for users who completed dashboard tour but not this one
  useEffect(() => {
    if (onboardingPreferences.dashboardTourCompleted && !onboardingPreferences.interviewSelectionTourCompleted) {
      setShowTour(true);
    }
  }, [onboardingPreferences]);
  
  // Handle tour completion
  const handleTourComplete = () => {
    setShowTour(false);
  };

  const interviewOptions = [
    {
      id: 'resume',
      title: 'Resume-based Questions',
      description: 'Professional Q&A based on your experience and background',
      icon: '📋',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      features: [
        'Experience-based behavioral questions',
        'Project discussion and problem-solving',
        'Career goals and motivation assessment',
        'Professional development feedback'
      ],
      duration: '20-40 minutes',
      route: '/resume-interview'
    },
    {
      id: 'mock',
      title: 'Mock Interview',
      description: 'Complete interview simulation with real-time feedback',
      icon: '🎯',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      features: [
        'Full interview simulation experience',
        'Real-time feedback and scoring',
        'Professional interview environment',
        'Comprehensive performance analysis'
      ],
      duration: '30-45 minutes',
      route: '/mock-interview'
    },
    {
      id: 'industry',
      title: 'Industry-Specific Tests',
      description: 'Specialized assessments tailored for specific tech roles',
      icon: '🏢',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      features: [
        'Role-specific question sets (Frontend, Backend, Full-Stack)',
        'Industry-standard evaluation criteria',
        'Comprehensive skill assessment',
        'Professional development insights'
      ],
      duration: '45-60 minutes',
      route: '/industry-tests'
    }
  ];

  const handleStartInterview = (option) => {
    navigate(option.route);
  };

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-20 pb-12">
      
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 
            id="page-title"
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
          >
            Choose Your Interview Type
          </h1>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            aria-describedby="page-title"
          >
            Select the interview format that best matches your preparation needs
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          data-tour="difficulty-selector"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          role={ARIA_ROLES.TABLIST}
          aria-label="Interview type selection"
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            {interviewOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => setSelectedTab(option.id)}
                onKeyDown={(e) => {
                  if (e.key === KEYS.ARROW_LEFT && index > 0) {
                    e.preventDefault();
                    setSelectedTab(interviewOptions[index - 1].id);
                  } else if (e.key === KEYS.ARROW_RIGHT && index < interviewOptions.length - 1) {
                    e.preventDefault();
                    setSelectedTab(interviewOptions[index + 1].id);
                  }
                }}
                role={ARIA_ROLES.TAB}
                aria-selected={selectedTab === option.id}
                aria-controls={`panel-${option.id}`}
                id={`tab-${option.id}`}
                tabIndex={selectedTab === option.id ? 0 : -1}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedTab === option.id
                    ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{option.icon}</span>
                  <span className="hidden sm:inline">{option.title}</span>
                  <span className="sm:hidden">{option.title.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <main id="main-content">
          <motion.div
            data-tour="interview-options"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
          {interviewOptions.map((option) => (
            <motion.div
              key={option.id}
              data-tour={`${option.id}-option`}
              variants={itemVariants}
              role={ARIA_ROLES.TABPANEL}
              id={`panel-${option.id}`}
              aria-labelledby={`tab-${option.id}`}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                selectedTab === option.id
                  ? `border-${option.color.split('-')[1]}-500 shadow-${option.color.split('-')[1]}-100`
                  : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${option.color} text-white p-6 rounded-t-2xl`}>
                <div className="flex items-center justify-between">
                  <div className="text-4xl" aria-hidden="true">{option.icon}</div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Duration: {option.duration}</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mt-4">{option.title}</h3>
                <p className="text-sm opacity-90 mt-2">{option.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <ul className="space-y-3 mb-6" aria-label={`${option.title} features`}>
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" aria-hidden="true"></div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <AccessibleButton
                  onClick={() => handleStartInterview(option)}
                  ariaLabel={`Start ${option.title} interview - ${option.description}`}
                  className={`w-full bg-gradient-to-r ${option.color} hover:from-${option.color.split('-')[1]}-600 hover:to-${option.color.split('-')[1]}-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-${option.color.split('-')[1]}-400`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start {option.title}
                  </motion.div>
                </AccessibleButton>
              </div>

              {/* Selection Indicator */}
              {selectedTab === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
        </main>

        
      </div>
      
      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          tourType="interviewSelection"
          autoStart={true}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
        />
      )}
    </div>
  );
};

export default InterviewSelection;
