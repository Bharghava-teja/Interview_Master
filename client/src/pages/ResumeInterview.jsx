import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ResumeInterview = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [score, setScore] = useState(null);

  // Professional interview questions based on experience level
  const interviewQuestions = [
    {
      id: 1,
      category: 'Experience',
      question: "Can you walk me through your most recent project and the technical challenges you faced?",
      type: 'open-ended',
      timeLimit: 300, // 5 minutes
      tips: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Focus on your specific contributions",
        "Mention technologies and methodologies used"
      ]
    },
    {
      id: 2,
      category: 'Problem Solving',
      question: "Describe a situation where you had to solve a complex technical problem under pressure. What was your approach?",
      type: 'open-ended',
      timeLimit: 240, // 4 minutes
      tips: [
        "Explain your systematic approach",
        "Highlight your analytical thinking",
        "Show how you handle stress"
      ]
    },
    {
      id: 3,
      category: 'Leadership',
      question: "Have you ever led a team or mentored junior developers? How did you handle conflicts or challenges?",
      type: 'open-ended',
      timeLimit: 300, // 5 minutes
      tips: [
        "Provide specific examples",
        "Show your leadership style",
        "Demonstrate conflict resolution skills"
      ]
    },
    {
      id: 4,
      category: 'Learning',
      question: "How do you stay updated with the latest technologies and industry trends?",
      type: 'open-ended',
      timeLimit: 180, // 3 minutes
      tips: [
        "Mention specific resources you use",
        "Show your passion for learning",
        "Give examples of recent learning"
      ]
    },
    {
      id: 5,
      category: 'Career Goals',
      question: "Where do you see yourself in 3-5 years, and how does this role align with your career goals?",
      type: 'open-ended',
      timeLimit: 240, // 4 minutes
      tips: [
        "Be realistic and specific",
        "Show alignment with company goals",
        "Demonstrate long-term thinking"
      ]
    },
    {
      id: 6,
      category: 'Technical Skills',
      question: "What's your strongest technical skill, and how have you applied it to solve real business problems?",
      type: 'open-ended',
      timeLimit: 300, // 5 minutes
      tips: [
        "Choose a skill you're confident in",
        "Provide concrete business impact",
        "Show ROI of your technical skills"
      ]
    },
    {
      id: 7,
      category: 'Adaptability',
      question: "Tell me about a time when you had to quickly learn a new technology or framework for a project.",
      type: 'open-ended',
      timeLimit: 240, // 4 minutes
      tips: [
        "Show your learning process",
        "Demonstrate adaptability",
        "Highlight successful outcomes"
      ]
    },
    {
      id: 8,
      category: 'Collaboration',
      question: "Describe a situation where you had to work with a difficult team member or stakeholder. How did you handle it?",
      type: 'open-ended',
      timeLimit: 300, // 5 minutes
      tips: [
        "Focus on professional approach",
        "Show emotional intelligence",
        "Highlight positive outcomes"
      ]
    }
  ];

  // Timer effect
  useEffect(() => {
    if (!examStarted || examCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examCompleted]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer input
  const handleAnswerInput = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: {
        answer,
        timestamp: Date.now(),
        wordCount: answer.split(/\s+/).filter(word => word.length > 0).length
      }
    }));
  };

  // Navigation
  const goToQuestion = (index) => {
    if (index >= 0 && index < interviewQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit exam
  const handleSubmit = () => {
    const answeredQuestions = Object.keys(userAnswers).length;
    const totalQuestions = interviewQuestions.length;
    const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);
    
    // Simple scoring based on completion and answer length
    let totalScore = 0;
    Object.values(userAnswers).forEach(answer => {
      if (answer.answer && answer.answer.trim().length > 50) {
        totalScore += 10; // 10 points for substantial answers
      } else if (answer.answer && answer.answer.trim().length > 20) {
        totalScore += 5; // 5 points for basic answers
      }
    });

    const finalScore = Math.min(100, totalScore);
    
    setScore({
      completionRate,
      answeredQuestions,
      totalQuestions,
      finalScore,
      averageAnswerLength: Object.values(userAnswers).reduce((acc, ans) => acc + (ans.wordCount || 0), 0) / answeredQuestions || 0
    });
    setExamCompleted(true);
  };

  // Start exam
  const startExam = () => {
    setExamStarted(true);
    setTimeLeft(40 * 60);
  };

  // Reset exam
  const resetExam = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(40 * 60);
    setExamStarted(false);
    setExamCompleted(false);
    setScore(null);
  };

  // Configuration screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Resume-based Interview
            </h1>
            <p className="text-xl text-gray-600">
              Professional Q&A based on your experience and background
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">What to Expect</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 text-lg">•</span>
                    <span>8 professional interview questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 text-lg">•</span>
                    <span>40 minutes total time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 text-lg">•</span>
                    <span>Open-ended responses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 text-lg">•</span>
                    <span>Tips and guidance provided</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Categories</h3>
                <div className="space-y-2">
                  {Array.from(new Set(interviewQuestions.map(q => q.category))).map(category => (
                    <div key={category} className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <span className="text-gray-600">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startExam}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all duration-200 text-lg"
              >
                Start Resume Interview
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results screen
  if (examCompleted && score) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Resume Interview Completed!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">{score.finalScore}%</div>
                <p className="text-gray-600">Overall Score</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">{score.completionRate}%</div>
                <p className="text-gray-600">Completion Rate</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Questions Answered:</span>
                  <p className="text-gray-800">{score.answeredQuestions}/{score.totalQuestions}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Average Answer Length:</span>
                  <p className="text-gray-800">{Math.round(score.averageAnswerLength)} words</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Time Used:</span>
                  <p className="text-gray-800">{formatTime(40 * 60 - timeLeft)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetExam}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
              >
                Practice Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/interview-selection')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
              >
                Choose Different Interview
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main interview interface
  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const userAnswer = userAnswers[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">Resume Interview</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
                <span>•</span>
                <span className="font-mono text-lg font-bold text-purple-600">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/interview-selection')}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Exit
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg transition-all duration-200"
              >
                Submit Interview
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Navigation</h3>
              <div className="grid grid-cols-4 lg:grid-cols-1 gap-2">
                {interviewQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                      index === currentQuestionIndex
                        ? 'bg-purple-500 text-white'
                        : userAnswers[interviewQuestions[index]?.id]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Question Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {currentQuestion.category}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {Math.floor(currentQuestion.timeLimit / 60)} min
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {currentQuestion.question}
                    </h2>
                  </div>

                  {/* Tips Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 Tips for answering:</h3>
                    <ul className="space-y-1">
                      {currentQuestion.tips.map((tip, index) => (
                        <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Answer Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer:
                      {userAnswer && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({userAnswer.wordCount || 0} words)
                        </span>
                      )}
                    </label>
                    <textarea
                      value={userAnswer?.answer || ''}
                      onChange={(e) => handleAnswerInput(currentQuestion.id, e.target.value)}
                      placeholder="Type your detailed answer here..."
                      className="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={prevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        currentQuestionIndex === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === interviewQuestions.length - 1}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        currentQuestionIndex === interviewQuestions.length - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeInterview;
