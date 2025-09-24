/**
 * Industry-Specific Test System
 * Provides specialized test modules for different roles with role-specific questions and evaluation criteria
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code, Database, Server, Smartphone, BarChart3, Settings,
  Brain, Globe, Shield, Cpu, Cloud, GitBranch,
  CheckCircle, XCircle, Clock, Trophy, Target,
  Play, Pause, RotateCcw, ArrowRight, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMixedQuestions, getQuestionStats } from '../data/industryQuestions';

// Industry roles configuration
const INDUSTRY_ROLES = {
  frontend: {
    id: 'frontend',
    title: 'Frontend Developer',
    icon: Globe,
    color: 'blue',
    description: 'React, Vue, Angular, JavaScript, CSS, HTML, UI/UX',
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript', 'Redux', 'Webpack', 'Responsive Design'],
    testDuration: 45,
    questionCount: 25
  },
  backend: {
    id: 'backend',
    title: 'Backend Developer',
    icon: Server,
    color: 'green',
    description: 'Node.js, Python, Java, APIs, Databases, System Design',
    skills: ['Node.js', 'Python', 'Java', 'REST APIs', 'SQL', 'NoSQL', 'Microservices', 'System Design'],
    testDuration: 50,
    questionCount: 30
  },
  fullstack: {
    id: 'fullstack',
    title: 'Full-Stack Developer',
    icon: Code,
    color: 'purple',
    description: 'Frontend + Backend + DevOps fundamentals',
    skills: ['React', 'Node.js', 'JavaScript', 'Python', 'SQL', 'Git', 'Docker', 'AWS'],
    testDuration: 60,
    questionCount: 35
  },
  devops: {
    id: 'devops',
    title: 'DevOps Engineer',
    icon: Settings,
    color: 'orange',
    description: 'CI/CD, Docker, Kubernetes, AWS, Infrastructure',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform', 'Linux', 'Monitoring', 'Security'],
    testDuration: 55,
    questionCount: 28
  },
  datascience: {
    id: 'datascience',
    title: 'Data Scientist',
    icon: BarChart3,
    color: 'indigo',
    description: 'Python, R, Machine Learning, Statistics, Analytics',
    skills: ['Python', 'R', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'SQL', 'Visualization'],
    testDuration: 50,
    questionCount: 25
  },
  mobile: {
    id: 'mobile',
    title: 'Mobile Developer',
    icon: Smartphone,
    color: 'pink',
    description: 'React Native, Flutter, iOS, Android Development',
    skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile UI', 'App Store', 'Performance', 'Testing'],
    testDuration: 45,
    questionCount: 25
  }
};



const IndustrySpecificTests = () => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [testState, setTestState] = useState('selection'); // selection, instructions, active, completed
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testResults, setTestResults] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState([]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            handleTestComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(INDUSTRY_ROLES[roleId]);
    setTestState('instructions');
  };

  const startTest = () => {
    const role = selectedRole;
    // Generate questions based on role
    const questions = getMixedQuestions(role.id, 5, 15, 5); // 5 easy, 15 medium, 5 hard
    setCurrentQuestions(questions);
    setTimeRemaining(role.testDuration * 60); // Convert minutes to seconds
    setCurrentQuestion(0);
    setAnswers({});
    setTestState('active');
    setIsTimerActive(true);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < currentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleTestComplete();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleTestComplete = useCallback(() => {
    setIsTimerActive(false);
    
    // Calculate results
    let correctAnswers = 0;
    let totalQuestions = currentQuestions.length;
    let categoryScores = {};
    
    currentQuestions.forEach(question => {
      const category = question.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      categoryScores[category].total++;
      
      if (question.type === 'mcq' && answers[question.id] === question.correct) {
        correctAnswers++;
        categoryScores[category].correct++;
      } else if (question.type === 'coding' && answers[question.id]) {
        // For coding questions, give partial credit if there's an attempt
        correctAnswers += 0.5;
        categoryScores[category].correct += 0.5;
      } else if (question.type === 'system-design' && answers[question.id]) {
        // For system design, give partial credit if there's an attempt
        correctAnswers += 0.7;
        categoryScores[category].correct += 0.7;
      }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const results = {
      score,
      correctAnswers: Math.round(correctAnswers),
      totalQuestions,
      categoryScores,
      role: selectedRole.title,
      completedAt: new Date().toISOString(),
      timeSpent: (selectedRole.testDuration * 60) - timeRemaining
    };
    
    setTestResults(results);
    setTestState('completed');
    
    // Store results in localStorage
    const existingResults = JSON.parse(localStorage.getItem('industryTestResults') || '[]');
    existingResults.push(results);
    localStorage.setItem('industryTestResults', JSON.stringify(existingResults));
  }, [selectedRole, answers, timeRemaining, currentQuestions]);

  const resetTest = () => {
    setSelectedRole(null);
    setTestState('selection');
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(0);
    setTestResults(null);
    setIsTimerActive(false);
    setCurrentQuestions([]);
  };

  const renderRoleSelection = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Industry-Specific Technical Tests
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Choose your role to take a specialized technical assessment designed for your field.
          Each test includes role-specific questions and evaluation criteria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(INDUSTRY_ROLES).map((role) => {
          const IconComponent = role.icon;
          const stats = getQuestionStats(role.id);
          return (
            <motion.div
              key={role.id}
              className={`bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-${role.color}-500 cursor-pointer transition-all duration-300`}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="p-6">
                <div className={`w-12 h-12 bg-${role.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent className={`w-6 h-6 text-${role.color}-600`} />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                
                <p className="text-gray-600 mb-4 text-sm">
                  {role.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {role.testDuration} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Target className="w-4 h-4 mr-2" />
                    25 questions ({stats.total} available)
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Brain className="w-4 h-4 mr-2" />
                    Easy: {stats.easy}, Medium: {stats.medium}, Hard: {stats.hard}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {role.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 bg-${role.color}-50 text-${role.color}-700 text-xs rounded-full`}
                    >
                      {skill}
                    </span>
                  ))}
                  {role.skills.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{role.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 bg-${selectedRole.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <selectedRole.icon className={`w-8 h-8 text-${selectedRole.color}-600`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedRole.title} Assessment
          </h2>
          <p className="text-gray-600">
            Specialized technical test for {selectedRole.title.toLowerCase()} positions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-3" />
                <span>Duration: {selectedRole.testDuration} minutes</span>
              </div>
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-500 mr-3" />
                <span>Questions: {selectedRole.questionCount}</span>
              </div>
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-gray-500 mr-3" />
                <span>Mixed difficulty levels</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Skills Tested</h3>
            <div className="flex flex-wrap gap-2">
              {selectedRole.skills.map((skill, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 bg-${selectedRole.color}-50 text-${selectedRole.color}-700 text-sm rounded-full`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h4 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Once started, the timer cannot be paused</li>
            <li>• You can navigate between questions freely</li>
            <li>• All questions must be answered to complete the test</li>
            <li>• Results will be available immediately after completion</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setTestState('selection')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Roles
          </button>
          <button
            onClick={startTest}
            className={`px-8 py-3 bg-${selectedRole.color}-600 text-white rounded-lg hover:bg-${selectedRole.color}-700 transition-colors flex items-center gap-2`}
          >
            <Play className="w-5 h-5" />
            Start Test
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveTest = () => {
    const question = currentQuestions[currentQuestion];
    
    if (!question) {
      return <div>No questions available for this role.</div>;
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedRole.title} Assessment
              </h2>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {currentQuestions.length}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500">Time Remaining</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentQuestion + 1) / currentQuestions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`bg-${selectedRole.color}-600 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${((currentQuestion + 1) / currentQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 bg-${selectedRole.color}-100 text-${selectedRole.color}-700 text-xs rounded-full`}>
                {question.category}
              </span>
              <span className={`px-2 py-1 ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              } text-xs rounded-full`}>
                {question.difficulty}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {question.question}
            </h3>
          </div>

          {question.type === 'mcq' && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === index
                      ? `border-${selectedRole.color}-500 bg-${selectedRole.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index}
                    checked={answers[question.id] === index}
                    onChange={() => handleAnswer(question.id, index)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[question.id] === index
                      ? `border-${selectedRole.color}-500 bg-${selectedRole.color}-500`
                      : 'border-gray-300'
                  }`}>
                    {answers[question.id] === index && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'coding' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Code Template:</h4>
                <pre className="text-sm text-gray-800 font-mono">
                  {question.template}
                </pre>
              </div>
              <textarea
                className="w-full h-40 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Write your solution here..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
              />
            </div>
          )}

          {question.type === 'system-design' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Requirements:</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  {question.requirements.map((req, index) => (
                    <li key={index}>• {req}</li>
                  ))}
                </ul>
              </div>
              <textarea
                className="w-full h-60 p-4 border border-gray-300 rounded-lg"
                placeholder="Describe your system design approach, architecture, and key components..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          
          <div className="flex gap-2">
            {currentQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? `bg-${selectedRole.color}-600 text-white`
                    : answers[currentQuestions[index].id] !== undefined
                    ? `bg-${selectedRole.color}-100 text-${selectedRole.color}-700`
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentQuestion === currentQuestions.length - 1 ? (
            <button
              onClick={handleTestComplete}
              className={`flex items-center gap-2 px-6 py-3 bg-${selectedRole.color}-600 text-white rounded-lg hover:bg-${selectedRole.color}-700 transition-colors`}
            >
              Complete Test
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className={`flex items-center gap-2 px-6 py-3 bg-${selectedRole.color}-600 text-white rounded-lg hover:bg-${selectedRole.color}-700 transition-colors`}
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const getScoreColor = (score) => {
      if (score >= 80) return 'green';
      if (score >= 60) return 'yellow';
      return 'red';
    };

    const scoreColor = getScoreColor(testResults.score);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className={`w-20 h-20 bg-${scoreColor}-100 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Trophy className={`w-10 h-10 text-${scoreColor}-600`} />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Test Completed!
          </h2>
          
          <p className="text-gray-600 mb-8">
            {testResults.role} Assessment Results
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className={`text-3xl font-bold text-${scoreColor}-600 mb-2`}>
                {testResults.score}%
              </div>
              <div className="text-gray-600">Overall Score</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {testResults.correctAnswers}/{testResults.totalQuestions}
              </div>
              <div className="text-gray-600">Correct Answers</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {formatTime(testResults.timeSpent)}
              </div>
              <div className="text-gray-600">Time Spent</div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className={`text-lg font-semibold mb-2 ${
              testResults.score >= 80 ? 'text-green-600' :
              testResults.score >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {
                testResults.score >= 80 ? 'Excellent Performance!' :
                testResults.score >= 60 ? 'Good Performance!' :
                'Needs Improvement'
              }
            </div>
            <p className="text-gray-600">
              {
                testResults.score >= 80 ? 'You demonstrated strong expertise in this role.' :
                testResults.score >= 60 ? 'You have a solid foundation with room for growth.' :
                'Consider reviewing the key concepts and practicing more.'
              }
            </p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetTest}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Take Another Test
            </button>
            <button
              onClick={() => window.print()}
              className={`px-6 py-3 bg-${selectedRole.color}-600 text-white rounded-lg hover:bg-${selectedRole.color}-700 transition-colors`}
            >
              Download Results
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {testState === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderRoleSelection()}
          </motion.div>
        )}
        
        {testState === 'instructions' && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderInstructions()}
          </motion.div>
        )}
        
        {testState === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveTest()}
          </motion.div>
        )}
        
        {testState === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndustrySpecificTests;