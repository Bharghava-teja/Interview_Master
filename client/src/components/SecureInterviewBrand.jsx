import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Zap } from 'lucide-react';

const SecureInterviewBrand = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`flex flex-col items-center space-y-4 ${className}`}
    >
      {/* Main Brand Logo */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Main Logo Circle */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center">
          {/* Inner Shield */}
          <motion.div
            className="relative"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="h-10 w-10 text-white drop-shadow-lg" />
            {/* Lock Overlay */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Lock className="h-4 w-4 text-green-100" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Brand Text */}
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          SecureInterview
        </h3>
        <p className="text-sm text-gray-500 font-medium">Enterprise Edition</p>
      </motion.div>

      {/* Security Features Badge */}
      <motion.div
        className="flex items-center space-x-4 px-4 py-2 bg-green-50 border border-green-200 rounded-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex items-center space-x-1 text-green-700">
          <Eye className="h-3 w-3" />
          <span className="text-xs font-medium">AI Monitoring</span>
        </div>
        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
        <div className="flex items-center space-x-1 text-green-700">
          <Zap className="h-3 w-3" />
          <span className="text-xs font-medium">E2E Encrypted</span>
        </div>
        <div className="w-1 h-1 bg-green-400 rounded-full"></div>
        <div className="flex items-center space-x-1 text-green-700">
          <Shield className="h-3 w-3" />
          <span className="text-xs font-medium">Secure</span>
        </div>
      </motion.div>

      {/* Powered By Badge */}
      <motion.div
        className="text-xs text-gray-400 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        Powered by Advanced Security Protocol
      </motion.div>
    </motion.div>
  );
};

export default SecureInterviewBrand;