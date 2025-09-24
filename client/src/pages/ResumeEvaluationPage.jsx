import React from 'react';
import { motion } from 'framer-motion';
import ResumeEvaluation from '../components/ResumeEvaluation';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ResumeEvaluationPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      <div className="container mx-auto px-4 py-8">
        <ResumeEvaluation />
      </div>
    </motion.div>
  );
};

export default ResumeEvaluationPage;