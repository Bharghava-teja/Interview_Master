import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Code, MessageSquare, Shuffle, AlertTriangle, Clock, Video, Mic, Maximize, Monitor } from 'lucide-react';
import MockInterviewSimulator from '../components/MockInterviewSimulator';
import FullscreenRequiredModal from '../components/FullscreenRequiredModal';
import SecurityWarning from '../components/SecurityWarning';
import ViolationLog from '../components/ViolationLog';
import { ExamProvider } from '../contexts/ExamContext';
import { useAuth } from '../context/AuthContext';
import { ExamSecurityProvider, useExamSecurity } from '../contexts/ExamSecurityManager';
import { toast } from 'react-hot-toast';

const MockInterviewPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // Use the new ExamSecurityManager
  const {
    cameraStream,
    microphoneStream,
    screenStream,
    cameraPermissionGranted,
    microphonePermissionGranted,
    screenSharePermissionGranted,
    fullscreenPermissionGranted,
    cameraError,
    microphoneError,
    screenShareError,
    isRequestingCamera,
    isRequestingMicrophone,
    isRequestingScreenShare,
    startCamera,
    startMicrophone,
    startScreenShare,
    requestFullscreen,
    violations,
    isMonitoring,
    showSecurityWarning,
    warningMessage,
    startMonitoring,
    stopMonitoring,
    cleanup
  } = useExamSecurity();
  
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'technical');
  const [selectedDuration, setSelectedDuration] = useState(parseInt(searchParams.get('duration')) || 3600000);
  const [showSimulator, setShowSimulator] = useState(false);
  const [examId, setExamId] = useState(null);
  const [interviewResults, setInterviewResults] = useState(null);
  const [setupPhase, setSetupPhase] = useState('selection'); // 'selection', 'guidelines', 'camera_setup', 'ready'
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [fullscreenEnforced, setFullscreenEnforced] = useState(false);
  const [fullscreenRetryCount, setFullscreenRetryCount] = useState(0);
  const [showViolationLog, setShowViolationLog] = useState(false);
  const maxFullscreenRetries = 3;


  // Interview type configurations
  const INTERVIEW_TYPES = {
    technical: {
      title: 'Technical Interview',
      description: 'Focus on coding skills, algorithms, and technical problem-solving',
      icon: Code,
      color: 'blue',
      features: [
        'Algorithm and data structure questions',
        'Code review and optimization',
        'System design discussions',
        'Technical problem-solving'
      ]
    },
    behavioral: {
      title: 'Behavioral Interview',
      description: 'Assess soft skills, communication, and cultural fit',
      icon: MessageSquare,
      color: 'green',
      features: [
        'STAR method questions',
        'Leadership and teamwork scenarios',
        'Conflict resolution situations',
        'Career motivation and goals'
      ]
    },
    mixed: {
      title: 'Mixed Interview',
      description: 'Combination of technical and behavioral questions',
      icon: Shuffle,
      color: 'purple',
      features: [
        'Balanced technical and soft skills assessment',
        'Real-world scenario discussions',
        'Problem-solving with communication focus',
        'Comprehensive evaluation'
      ]
    }
  };

  // Handle fullscreen modal actions
  const handleFullscreenEnabled = () => {
    // This function is called when fullscreen is successfully enabled
    // The actual fullscreen request is handled by the FullscreenRequiredModal
    // and detected by the event listeners in requestFullscreenPermission
    setShowFullscreenModal(false);
  };

  // Cleanup camera stream
  const cleanupCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupCameraStream();
    };
  }, [cameraStream]);

  const handleFullscreenCancel = () => {
    if (window.fullscreenPromiseResolve) {
      window.fullscreenPromiseResolve(false);
      delete window.fullscreenPromiseResolve;
    }
  };

  // Duration options
  const DURATION_OPTIONS = [
    { value: 1800000, label: '30 minutes', description: 'Quick assessment' },
    { value: 2700000, label: '45 minutes', description: 'Standard interview' },
    { value: 3600000, label: '1 hour', description: 'Comprehensive interview' },
    { value: 5400000, label: '1.5 hours', description: 'Extended technical interview' },
    { value: 7200000, label: '2 hours', description: 'Full assessment' }
  ];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: `/mock-interview?type=${selectedType}&duration=${selectedDuration}`,
          message: 'Please log in to access the mock interview simulator'
        }
      });
    }
  }, [isAuthenticated, navigate, selectedType, selectedDuration]);

  // Enhanced fullscreen monitoring with persistent enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
      
      // Update fullscreen permission based on actual fullscreen state
      if (isCurrentlyFullscreen && !fullscreenPermissionGranted) {
        setFullscreenRetryCount(0); // Reset retry count on successful fullscreen
        toast.success('Fullscreen mode enabled');
      } else if (!isCurrentlyFullscreen && fullscreenPermissionGranted) {
        
        // If fullscreen enforcement is active, try to re-enter fullscreen
        if (fullscreenEnforced && fullscreenRetryCount < maxFullscreenRetries) {
          setTimeout(async () => {
            try {
              await requestFullscreenPermission();
              setFullscreenRetryCount(prev => prev + 1);
            } catch (error) {
              console.warn('Failed to re-enter fullscreen:', error);
              if (fullscreenRetryCount >= maxFullscreenRetries - 1) {
                toast.error('Unable to maintain fullscreen mode. Interview may be affected.');
                setFullscreenEnforced(false);
              }
            }
          }, 1000); // Wait 1 second before retry
        } else if (setupPhase === 'ready' || showSimulator) {
          toast.error('Fullscreen mode exited. Please re-enter fullscreen to continue.');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [fullscreenPermissionGranted, setupPhase, fullscreenEnforced, fullscreenRetryCount, showSimulator]);

  // Generate exam ID
  useEffect(() => {
    if (isAuthenticated && user) {
      setExamId(`mock_${user.id}_${Date.now()}`);
    }
  }, [isAuthenticated, user]);

  // Start interview
  const handleStartInterview = () => {
    if (!examId) {
      toast.error('Failed to initialize interview session');
      return;
    }
    
    // Enforce fullscreen if enabled
    if (fullscreenEnforced && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
    
    setShowSimulator(true);
    toast.success('Mock interview started! Good luck!');
  };

  // Handle interview completion
  const handleInterviewComplete = async (results) => {
    try {
      // Stop security monitoring
      stopMonitoring();
      
      // Add violations to results
      const enhancedResults = {
        ...results,
        securityViolations: violations,
        violationCount: violations.length,
        highSeverityViolations: violations.filter(v => v.severity === 'high').length
      };
      
      setInterviewResults(enhancedResults);
      setShowSimulator(false);
      
      // Show violation log if there are violations
      if (violations.length > 0) {
        setShowViolationLog(true);
      }
      
      // Here you would typically save results to backend
      // await api.post('/api/v1/mock-interviews', enhancedResults);
      
      toast.success('Interview completed successfully!');
      
    } catch (error) {
      console.error('Failed to save interview results:', error);
      toast.error('Failed to save interview results');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
      cleanup();
    };
  }, [stopMonitoring, cleanup]);

  // Handle security violations
  const handleViolationDetected = (violation) => {
    console.warn('Security violation detected:', violation);
    
    // Show appropriate warning based on violation severity
    if (violation.severity === 'critical') {
      toast.error(`Critical violation: ${violation.type}`);
    } else if (violation.severity === 'high') {
      toast.error(`Security warning: ${violation.type}`);
    } else {
      toast(`Security notice: ${violation.type}`, { icon: '⚠️' });
    }
  };

  // Setup flow handlers
  const handleProceedToGuidelines = () => {
    if (selectedType && selectedDuration) {
      // Enforce fullscreen if enabled
      if (fullscreenEnforced && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error);
      }
      setSetupPhase('guidelines');
    } else {
      toast.error('Please select interview type and duration first');
    }
  };

  const handleProceedToCameraSetup = () => {
    // Enforce fullscreen if enabled
    if (fullscreenEnforced && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
    setSetupPhase('camera_setup');
  };

  const requestCameraPermission = async () => {
    const success = await startCamera();
    if (success) {
      setShowCameraPreview(true);
      toast.success('Camera access granted');
      return true;
    } else {
      if (cameraError) {
        toast.error(cameraError);
      }
      return false;
    }
  };

  const requestMicrophonePermission = async () => {
    const success = await startMicrophone();
    if (success) {
      toast.success('Microphone access granted');
      return true;
    } else {
      if (microphoneError) {
        toast.error(microphoneError);
      }
      return false;
    }
  };

  const requestScreenSharePermission = async () => {
    const success = await startScreenShare();
    if (success) {
      toast.success('Screen share access granted');
      return true;
    } else {
      if (screenShareError) {
        toast.error(screenShareError);
      }
      return false;
    }
  };

  const requestFullscreenPermission = async () => {
    const success = await requestFullscreen();
    if (success) {
      toast.success('Fullscreen access granted');
      return true;
    } else {
      toast.error('Fullscreen access denied');
      return false;
    }
  };

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Go back to selection
  const handleBackToSelection = () => {
    // Enforce fullscreen if enabled
    if (fullscreenEnforced && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
    setShowSimulator(false);
    setInterviewResults(null);
  };

  // Helper function to enforce fullscreen on phase transitions
  const handleSetupPhaseChange = (phase) => {
    // Enforce fullscreen if enabled
    if (fullscreenEnforced && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
    setSetupPhase(phase);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show simulator
  if (showSimulator) {
    return (
      <ExamProvider>
        <MockInterviewSimulator
          interviewType={selectedType}
          duration={selectedDuration}
          examId={examId}
          onInterviewComplete={handleInterviewComplete}
          onViolationDetected={handleViolationDetected}
          existingCameraStream={cameraStream}
          fullscreenEnforced={fullscreenEnforced}
        />
      </ExamProvider>
    );
  }

  // Show results
  if (interviewResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <motion.div 
            className="glass-strong rounded-3xl p-8 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <motion.h1 
                  className="text-3xl md:text-4xl font-bold mb-3 text-gradient"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Interview Results
                </motion.h1>
                <motion.p 
                  className="text-lg"
                  style={{ color: 'var(--text-secondary)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {INTERVIEW_TYPES[selectedType].title} • {formatDuration(selectedDuration)}
                </motion.p>
              </div>
              
              <motion.button
                onClick={handleBackToSelection}
                className="gradient-primary text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ArrowLeft className="h-5 w-5" />
                New Interview
              </motion.button>

            </div>
          </motion.div>

          {/* Enhanced Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Completion Rate Card */}
            <motion.div 
              className="glass-card rounded-3xl p-8 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Completion Rate</h3>
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <motion.div 
                className="text-4xl font-bold text-gradient mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              >
                {Math.round(interviewResults.metrics.completionRate)}%
              </motion.div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Interview completion</div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            
            {/* Questions Answered Card */}
            <motion.div 
              className="glass-card rounded-3xl p-8 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Questions Answered</h3>
                <div className="w-12 h-12 rounded-2xl gradient-secondary flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <motion.div 
                className="text-4xl font-bold text-gradient mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              >
                {interviewResults.metrics.questionsAnswered}
              </motion.div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total responses</div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            
            {/* Average Response Time Card */}
            <motion.div 
              className="glass-card rounded-3xl p-8 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Avg Response Time</h3>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <motion.div 
                className="text-4xl font-bold text-gradient mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
              >
                {formatDuration(interviewResults.metrics.averageResponseTime)}
              </motion.div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Per question</div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            
            {/* Security Score Card */}
            <motion.div 
              className="glass-card rounded-3xl p-8 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Security Score</h3>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  interviewResults.metrics.violationCount === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  interviewResults.metrics.violationCount <= 2 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <motion.div 
                className={`text-4xl font-bold mb-2 ${
                  interviewResults.metrics.violationCount === 0 ? 'text-gradient' :
                  interviewResults.metrics.violationCount <= 2 ? 'text-gradient' :
                  'text-gradient'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
              >
                {interviewResults.metrics.violationCount === 0 ? 'Perfect' :
                 interviewResults.metrics.violationCount <= 2 ? 'Good' : 'Poor'}
              </motion.div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Integrity level</div>
              <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                interviewResults.metrics.violationCount === 0 ? 'bg-gradient-to-br from-green-500/5 to-emerald-500/5' :
                interviewResults.metrics.violationCount <= 2 ? 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5' :
                'bg-gradient-to-br from-red-500/5 to-pink-500/5'
              }`} />
            </motion.div>
          </div>

          {/* Enhanced Detailed Results */}
          <motion.div 
            className="glass-strong rounded-3xl p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-8 text-gradient text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              Interview Responses
            </motion.h2>
            
            <div className="space-y-8">
              {interviewResults.responses.map((response, index) => (
                <motion.div 
                  key={index} 
                  className="glass-card rounded-2xl p-6 group hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6 + index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  {/* Question number badge */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  {/* Question */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full gradient-secondary"></div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Question</h3>
                    </div>
                    <p className="text-base leading-relaxed pl-5" style={{ color: 'var(--text-secondary)' }}>
                      {response.question}
                    </p>
                  </div>
                  
                  {/* Answer */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full gradient-primary"></div>
                      <h4 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>Your Answer</h4>
                    </div>
                    <div className="glass-card rounded-xl p-4 ml-5">
                      <p className="text-base leading-relaxed" style={{ color: 'var(--text-main)' }}>
                        {response.answer}
                      </p>
                    </div>
                  </div>
                  
                  {/* Response time */}
                  <div className="flex items-center justify-between pl-5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Response time:</span>
                    </div>
                    <span className="text-sm font-bold text-gradient">
                      {formatDuration(response.responseTime)}
                    </span>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show guidelines phase
  if (setupPhase === 'guidelines') {
    return (
      <div className="min-h-screen p-4" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="glass-strong rounded-3xl p-8 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold mb-4 text-gradient"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                Interview Guidelines & Rules
              </motion.h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Please read and understand these important guidelines before proceeding
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-bold mb-4 text-gradient flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  Security Requirements
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Full-screen mode is mandatory - prevents tab switching and ensures focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Camera and microphone access required for monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Face must be visible and clearly detected at all times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Fullscreen will be activated after granting camera/microphone permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>Two-tier violation system: Warning → Auto-submission</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-bold mb-4 text-gradient flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  Interview Process
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Questions will be presented sequentially</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Screen recording will capture your entire session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Speak clearly and maintain eye contact with camera</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Complete evaluation will be provided at the end</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-xl font-bold mb-4 text-gradient flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  Selected Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      {React.createElement(INTERVIEW_TYPES[selectedType].icon, { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-main)' }}>
                        {INTERVIEW_TYPES[selectedType].title}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Interview Type
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-main)' }}>
                        {formatDuration(selectedDuration)}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Duration
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              
            </div>

            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => handleSetupPhaseChange('selection')}
                className="px-6 py-3 rounded-2xl font-semibold glass-card hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Selection
              </motion.button>
              <motion.button
                onClick={handleProceedToCameraSetup}
                className="px-8 py-3 rounded-2xl font-semibold gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Setup
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show camera setup phase
  if (setupPhase === 'camera_setup') {
    return (
      <div className="min-h-screen p-4" style={{ background: 'var(--bg-main)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="glass-strong rounded-3xl p-8 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold mb-4 text-gradient"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                Camera & Microphone Setup
              </motion.h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Grant permissions and verify your setup before starting the interview
              </p>
            </div>

            {/* Camera Preview Section */}
            {showCameraPreview && cameraStream && (
              <motion.div 
                className="glass-card rounded-2xl p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-bold mb-4 text-gradient text-center">Camera Preview</h3>
                <div className="relative max-w-md mx-auto">
                  <video
                    ref={(video) => {
                      if (video && cameraStream) {
                        video.srcObject = cameraStream;
                        video.play().catch(error => {
                          console.error('Error playing video:', error);
                          // Retry after a short delay
                          setTimeout(() => {
                            video.play().catch(retryError => {
                              console.warn('Video play retry failed:', retryError);
                            });
                          }, 100);
                        });
                      }
                    }}
                    className="w-full h-64 bg-gray-900 rounded-xl object-cover shadow-lg"
                    muted
                    playsInline
                    autoPlay
                  />
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live
                  </div>
                </div>
                <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
                  Make sure your face is clearly visible and well-lit
                </p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    cameraPermissionGranted ? 'gradient-primary' : 'glass-card'
                  }`}>
                    <Video className={`w-8 h-8 ${
                      cameraPermissionGranted ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gradient">Camera Access</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Required for face verification and monitoring
                  </p>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    cameraPermissionGranted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cameraPermissionGranted ? 'Permission Granted' : 'Permission Required'}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    microphonePermissionGranted ? 'gradient-primary' : 'glass-card'
                  }`}>
                    <Mic className={`w-8 h-8 ${
                      microphonePermissionGranted ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gradient">Microphone Access</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Required for audio recording and analysis
                  </p>
                  {microphoneError && (
                    <p className="text-red-500 text-sm mb-2">{microphoneError}</p>
                  )}
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    microphonePermissionGranted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {microphonePermissionGranted ? 'Permission Granted' : 'Permission Required'}
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    fullscreenPermissionGranted ? 'gradient-primary' : 'glass-card'
                  }`}>
                    <Maximize className={`w-8 h-8 ${
                      fullscreenPermissionGranted ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gradient">Fullscreen Mode</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Required for security and focus during interview
                  </p>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    fullscreenPermissionGranted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {fullscreenPermissionGranted ? 'Fullscreen Active' : 'Will be requested'}
                  </div>
                </div>
              </motion.div>
              
              {/* Screen Share Permission */}
              <motion.div 
                className="glass-card rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    screenSharePermissionGranted ? 'gradient-primary' : 'glass-card'
                  }`}>
                    <Monitor className={`w-8 h-8 ${
                      screenSharePermissionGranted ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gradient">Screen Share</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Required for screen monitoring during interview
                  </p>
                  {screenShareError && (
                    <p className="text-red-500 text-sm mb-2">{screenShareError}</p>
                  )}
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    screenSharePermissionGranted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {screenSharePermissionGranted ? 'Permission Granted' : 'Permission Required'}
                  </div>
                  {screenSharePermissionGranted && (
                    <p className="mt-3 text-sm text-green-600">
                      ✓ Screen sharing active
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="text-center mb-8">
              <motion.div 
                className="glass-card rounded-2xl p-6 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-lg font-bold mb-4 text-gradient">Setup Instructions</h3>
                <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>Click "Grant All Permissions" to allow camera, microphone, and fullscreen access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>Ensure your face is clearly visible and well-lit</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>Test your microphone to ensure clear audio</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">4.</span>
                    <span>Click F11 for fullscreen mode, then click Grant Permissions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 font-bold">5.</span>
                    <span>Once all permissions are granted, you can start the interview</span>
                  </div>
                </div>
                
              </motion.div>
            </div>

            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => setSetupPhase('guidelines')}
                className="px-6 py-3 rounded-2xl font-semibold glass-card hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Guidelines
              </motion.button>
              <motion.button
                onClick={() => setShowSimulator(true)}
                disabled={false}
                className="px-8 py-3 rounded-2xl font-semibold transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Interview
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show ready phase
  if (setupPhase === 'ready') {
    // Directly start the interview instead of showing ready phase
    setShowSimulator(true);
    toast.success('Starting interview...');
    return null;
  }

  // Show selection interface
  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-3 glass-card px-6 py-3 mb-6">
            <div className="relative">
              <div className="w-4 h-4 rounded-full gradient-primary animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 rounded-full gradient-primary animate-ping opacity-75" />
            </div>
            <span className="text-gradient font-bold text-sm uppercase tracking-wider">AI-Powered Interview Practice</span>
          </div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="text-gradient block">Mock Interview</span>
            <span className="text-gradient block">Simulator</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Master your interview skills with realistic AI-powered simulations, instant feedback, and comprehensive performance analytics.
          </motion.p>
        </motion.div>

        {/* Enhanced Interview Type Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gradient">Choose Your Interview Type</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Select the type of interview that matches your preparation goals</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(INTERVIEW_TYPES).map(([type, config], index) => {
              const Icon = config.icon;
              const isSelected = selectedType === type;
              
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedType(type)}
                  className={`cursor-pointer rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden ${
                    isSelected 
                      ? 'glass-strong border-2 shadow-2xl' 
                      : 'glass-card border-2 hover:shadow-xl'
                  }`}
                  style={{
                    borderColor: isSelected ? 'var(--border-accent)' : 'var(--border-main)'
                  }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div 
                      className="absolute top-4 right-4 w-6 h-6 rounded-full gradient-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  
                  {/* Icon and title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-2xl transition-all duration-300 ${
                      isSelected ? 'gradient-primary' : 'glass-card'
                    }`}>
                      <Icon className={`h-8 w-8 transition-colors duration-300 ${
                        isSelected ? 'text-white' : 'text-gradient'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gradient group-hover:scale-105 transition-transform duration-300">
                      {config.title}
                    </h3>
                  </div>
                  
                  <p className="mb-6 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {config.description}
                  </p>
                  
                  {/* Features list */}
                  <ul className="space-y-3">
                    {config.features.map((feature, featureIndex) => (
                      <motion.li 
                        key={featureIndex} 
                        className="text-sm flex items-start gap-3"
                        style={{ color: 'var(--text-main)' }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 + featureIndex * 0.05 }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-all duration-300 ${
                          isSelected ? 'gradient-primary' : 'bg-gradient-to-r from-blue-400 to-purple-500'
                        }`} />
                        <span className="leading-relaxed">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Duration Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gradient">Choose Duration</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Select how long you want your interview session to be</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {DURATION_OPTIONS.map((option, index) => {
              const isSelected = selectedDuration === option.value;
              
              return (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: 1.4 + index * 0.1, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -4,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`cursor-pointer rounded-2xl p-6 text-center transition-all duration-300 group relative overflow-hidden ${
                    isSelected 
                      ? 'glass-strong border-2 shadow-xl' 
                      : 'glass-card border-2 hover:shadow-lg'
                  }`}
                  style={{
                    borderColor: isSelected ? 'var(--border-accent)' : 'var(--border-main)'
                  }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div 
                      className="absolute top-3 right-3 w-5 h-5 rounded-full gradient-primary flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  
                  {/* Clock icon */}
                  <motion.div 
                    className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isSelected ? 'gradient-primary' : 'glass-card'
                    }`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg className={`w-6 h-6 transition-colors duration-300 ${
                      isSelected ? 'text-white' : 'text-gradient'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  
                  {/* Duration label */}
                  <motion.div 
                    className={`text-xl font-bold mb-2 transition-all duration-300 ${
                      isSelected ? 'text-gradient' : 'text-gradient'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {option.label}
                  </motion.div>
                  
                  {/* Description */}
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {option.description}
                  </div>
                  
                  {/* Recommended badge for 1 hour */}
                  {option.value === 3600000 && (
                    <motion.div 
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold gradient-secondary text-white"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6 + index * 0.1 }}
                    >
                      Recommended
                    </motion.div>
                  )}
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Start Button */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ 
              scale: selectedType && selectedDuration ? 1.05 : 1,
              y: selectedType && selectedDuration ? -2 : 0
            }}
            whileTap={{ scale: selectedType && selectedDuration ? 0.95 : 1 }}
            onClick={handleProceedToGuidelines}
            disabled={!selectedType || !selectedDuration}
            className={`relative px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden group ${
              selectedType && selectedDuration
                ? 'gradient-primary text-white shadow-2xl hover:shadow-3xl'
                : 'glass-card cursor-not-allowed opacity-50'
            }`}
            style={{
              boxShadow: selectedType && selectedDuration 
                ? '0 20px 40px rgba(59, 130, 246, 0.3)' 
                : 'none'
            }}
          >
            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-3">
              {selectedType && selectedDuration ? (
                <>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <ArrowLeft className="w-6 h-6 rotate-180" />
                  </motion.div>
                  <span>Proceed to Guidelines</span>
                  <motion.svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  <span>Select Type & Duration</span>
                </>
              )}
            </div>
            
            {/* Animated background for enabled state */}
            {examId && (
              <>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ borderRadius: 'inherit' }}
                />
                <motion.div 
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{ borderRadius: 'inherit' }}
                />
                {/* Shimmer effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}
          </motion.button>
          
          {/* Helper text */}
          <motion.p 
            className="mt-4 text-sm"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Selected: {INTERVIEW_TYPES[selectedType].title} • {formatDuration(selectedDuration)}
          </motion.p>
        </motion.div>
      </div>
      
      {/* Security Warning Modal */}
       {showSecurityWarning && (
         <SecurityWarning
           message={warningMessage}
           onDismiss={() => {}}
         />
       )}
      
      {/* Violation Log Modal */}
      {showViolationLog && (
        <ViolationLog
          violations={violations}
          onClose={() => setShowViolationLog(false)}
        />
      )}
      
      {/* Fullscreen Required Modal */}
      <FullscreenRequiredModal
        isVisible={showFullscreenModal}
        onFullscreenEnabled={handleFullscreenEnabled}
        onCancel={handleFullscreenCancel}
        isRetrying={false}
      />
    </div>
  );
};

// Wrapper component with ExamSecurityProvider
const MockInterviewPage = () => {
  return (
    <ExamSecurityProvider>
      <MockInterviewPageContent />
    </ExamSecurityProvider>
  );
};

export default MockInterviewPage;