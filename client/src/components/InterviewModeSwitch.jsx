import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Lock, Video } from 'lucide-react';

const InterviewModeSwitch = ({ isSecureMode, onModeChange, className = '' }) => {
  const handleToggle = () => {
    onModeChange(!isSecureMode);
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Mode Labels */}
      <div className="flex items-center justify-between w-full max-w-xs text-sm font-medium">
        <motion.span 
          className={`flex items-center gap-2 transition-colors duration-300 ${
            !isSecureMode ? 'text-blue-600' : 'text-gray-400'
          }`}
          animate={{ scale: !isSecureMode ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Users className="h-4 w-4" />
          Mock Interview
        </motion.span>
        <motion.span 
          className={`flex items-center gap-2 transition-colors duration-300 ${
            isSecureMode ? 'text-green-600' : 'text-gray-400'
          }`}
          animate={{ scale: isSecureMode ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Shield className="h-4 w-4" />
          Secure Interview
        </motion.span>
      </div>

      {/* 3D Flip Switch */}
      <motion.div
        className="relative w-20 h-10 cursor-pointer"
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Switch Track */}
        <motion.div
          className={`absolute inset-0 rounded-full transition-colors duration-500 ${
            isSecureMode 
              ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-200' 
              : 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-200'
          }`}
          animate={{
            boxShadow: isSecureMode 
              ? '0 4px 20px rgba(34, 197, 94, 0.4)' 
              : '0 4px 20px rgba(59, 130, 246, 0.4)'
          }}
        />

        {/* Switch Handle with 3D Flip Animation */}
        <motion.div
          className="absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
          animate={{
            x: isSecureMode ? 44 : 4,
            rotateY: isSecureMode ? 180 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            duration: 0.6
          }}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Icon that flips with the handle */}
          <motion.div
            animate={{ rotateY: isSecureMode ? 180 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            {isSecureMode ? (
              <Lock className="h-4 w-4 text-green-600" />
            ) : (
              <Video className="h-4 w-4 text-blue-600" />
            )}
          </motion.div>
        </motion.div>

        {/* Glow Effect */}
        <motion.div
          className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${
            isSecureMode 
              ? 'bg-green-400 opacity-30' 
              : 'bg-blue-400 opacity-30'
          }`}
          animate={{
            scale: isSecureMode ? 1.2 : 1.1,
            opacity: isSecureMode ? 0.4 : 0.3,
          }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>

      {/* Mode Description */}
      <motion.div
        className="text-center max-w-sm"
        key={isSecureMode ? 'secure' : 'mock'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {isSecureMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <Shield className="h-5 w-5" />
              Secure Interview Mode
            </div>
            <p className="text-sm text-gray-600">
              Host-controlled secure interviews with end-to-end encryption and advanced monitoring
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
              <Users className="h-5 w-5" />
              Mock Interview Mode
            </div>
            <p className="text-sm text-gray-600">
              Practice interviews with AI feedback and performance analytics
            </p>
          </div>
        )}
      </motion.div>

      {/* Security Badge for Secure Mode */}
      {isSecureMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full text-xs font-medium text-green-700"
        >
          <Shield className="h-3 w-3" />
          Enterprise Security Enabled
        </motion.div>
      )}
    </div>
  );
};

export default InterviewModeSwitch;