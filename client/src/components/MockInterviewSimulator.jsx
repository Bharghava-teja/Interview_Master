import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  User, 
  Mic, 
  Video,
  AlertTriangle,
  Settings,
  BarChart3,
  Download,
  Shield,
  Camera,
  Monitor,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import WebcamMonitor from './WebcamMonitor';
import ScreenRecorder from './ScreenRecorder';
import PerformanceAnalytics from './PerformanceAnalytics';
import SecurityWarningModal from './exam/SecurityWarningModal';
import FullscreenRequiredModal from './FullscreenRequiredModal';
import FullscreenExitWarningModal from './FullscreenExitWarningModal';
import FaceVerificationModal from './FaceVerificationModal';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../contexts/ExamContext';
import { useExamSecurity } from '../contexts/ExamSecurityManager';
import FaceDetectionService from '../services/FaceDetectionService';
import QuestionGenerationService from '../services/QuestionGenerationService';
import SecurityService from '../services/SecurityService';

const MockInterviewSimulator = ({ 
  interviewType = 'technical', // 'technical', 'behavioral', 'mixed'
  duration = 3600000, // 1 hour default
  onInterviewComplete,
  onViolationDetected,
  examId,
  existingCameraStream = null,
  fullscreenEnforced = false
}) => {
  const { user } = useAuth();
  const {
    startExam,
    endExam,
    isExamActive,
    isFullscreen,
    totalViolations,
    warning,
    examConfig,
    examStatus
  } = useExam();
  const {
    cameraStream,
    microphoneStream,
    screenStream,
    cameraPermissionGranted,
    microphonePermissionGranted,
    screenSharePermissionGranted,
    fullscreenPermissionGranted,
    allPermissionsGranted,
    grantAllPermissions,
    violations,
    isMonitoring,
    showSecurityWarning,
    warningMessage,
    startMonitoring,
    stopMonitoring,
    cleanup
  } = useExamSecurity();

  // Security violation handler - now simplified since ExamSecurityManager handles violations
  const handleSecurityViolation = useCallback((violation) => {
    console.log('Security violation detected:', violation);
    if (onViolationDetected) {
      onViolationDetected(violation);
    }
  }, [onViolationDetected]);

  // Interview state
  const [interviewStatus, setInterviewStatus] = useState('setup'); // 'setup', 'active', 'paused', 'completed'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [questions, setQuestions] = useState([]);
  const [, setIsGeneratingQuestions] = useState(false);
  
  // Media state
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [screenRecorder, setScreenRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [, setScreenRecordingChunks] = useState([]);
  
  // Security and monitoring state
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [securityViolations, setSecurityViolations] = useState([]);
  const [, setIsFullscreenActive] = useState(false);
  const [autoSubmitWarning, setAutoSubmitWarning] = useState(null);
  const [showFaceVerificationModal, setShowFaceVerificationModal] = useState(false);
  const [faceVerificationComplete, setFaceVerificationComplete] = useState(false);
  const [, setReferenceImage] = useState(null);
  const [screenRecordingActive, setScreenRecordingActive] = useState(false);
  const [screenRecordingData, setScreenRecordingData] = useState(null);
  const [screenRecordingError, setScreenRecordingError] = useState(null);
  const [, setFaceDetectionResults] = useState({ faces: [], violations: [] });
  
  // Two-tier violation system state
  const [faceViolationCount, setFaceViolationCount] = useState(0);
  const [fullscreenViolationCount, setFullscreenViolationCount] = useState(0);
  const [warningDetails, setWarningDetails] = useState(null);
  const [, setIsAutoSubmitting] = useState(false);
  
  // Fullscreen enforcement state
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [showFullscreenExitWarning, setShowFullscreenExitWarning] = useState(false);
  const [fullscreenRetryCount, setFullscreenRetryCount] = useState(0);
  const [isFullscreenEnforced, setIsFullscreenEnforced] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    enableWebcamMonitoring: true,
    enableScreenRecording: true,
    enableAudioRecording: true,
    autoStartRecording: true,
    strictMode: true, // Enhanced security measures
    allowPause: false,
    enforceFullscreen: true // Require fullscreen mode for security
  });
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: [],
    confidenceLevel: [],
    eyeContact: [],
    speechClarity: [],
    violations: [],
    behavioralAnalysis: {
      eyeContact: 0,
      speechClarity: 0,
      confidence: 0,
      engagement: 0,
      professionalism: 0
    },
    detailedMetrics: {
      questionResponseTimes: [],
      violationTimestamps: [],
      confidenceOverTime: [],
      engagementLevels: []
    }
  });
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [interviewResults, setInterviewResults] = useState(null);

  // Get violations from ExamSecurityManager
  const violationHistory = violations || [];

  // Face detection result handler - moved up to avoid hoisting issues
  const handleFaceDetectionResult = useCallback((result) => {
    setFaceDetectionResults(result);
    
    // Process violations
    if (result.violations && result.violations.length > 0) {
      result.violations.forEach(violation => {
        handleSecurityViolation(violation);
      });
    }
  }, [handleSecurityViolation]);

  // Enhanced media initialization - moved up to avoid hoisting issues
  const initializeWebcam = useCallback(async () => {
    try {
      let stream;
      
      // Use existing camera stream if available and active
      if (cameraStream && cameraStream.active) {
        console.log('Using camera stream from ExamSecurityManager');
        stream = cameraStream;
      } else if (existingCameraStream && existingCameraStream.active) {
        console.log('Using existing camera stream');
        stream = existingCameraStream;
      } else {
        console.log('No active stream available, video initialization skipped');
        return;
      }
      
      setVideoStream(stream);
      setIsVideoEnabled(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed, retrying:', playError);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.warn('Video play retry failed:', e));
            }
          }, 100);
        }
      }
      
      // Start face detection
      if (faceDetectionInitialized.current) {
        setFaceDetectionActive(true);
        FaceDetectionService.startContinuousDetection(
          videoRef.current,
          handleFaceDetectionResult,
          1000 // Check every second
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize webcam:', error);
      handleSecurityViolation({
        type: 'webcam_initialization_failed',
        severity: 'critical',
        message: 'Failed to access webcam. This is required for the interview.',
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }, [existingCameraStream, handleFaceDetectionResult, handleSecurityViolation]);

  // Complete interview function - defined early to avoid hoisting issues
  const completeInterview = useCallback(() => {
    setInterviewStatus('completed');
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Stop all recordings
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    if (screenRecorder && screenRecorder.state !== 'inactive') {
      screenRecorder.stop();
    }
    
    // Stop all media streams
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    // Cleanup security monitoring
    if (settings.strictMode) {
      SecurityService.stopMonitoring();
      SecurityService.exitFullscreen();
      setIsFullscreenActive(false);
    }
    
    // Cleanup face detection
    if (faceDetectionActive) {
      FaceDetectionService.stopContinuousDetection();
      setFaceDetectionActive(false);
    }
    
    // Calculate final metrics
    const avgResponseTime = performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / performanceMetrics.responseTime.length || 0;
    const completionRate = (responses.length / questions.length) * 100;
    
    // Calculate overall score
    let overallScore = 85; // Base score
    overallScore -= violationHistory.length * 5; // Deduct for violations
    if (avgResponseTime > 120000) overallScore -= 10;
    if (avgResponseTime < 30000) overallScore -= 5;
    overallScore = (overallScore * completionRate) / 100;
    overallScore = Math.max(0, Math.min(100, overallScore));
    
    const finalMetrics = {
      ...performanceMetrics,
      totalDuration: interviewDuration,
      questionsAnswered: responses.length,
      averageResponseTime: avgResponseTime,
      violationCount: violationHistory.length,
      completionRate: completionRate
    };
    
    const results = {
      overallScore: Math.round(overallScore),
      completionRate: Math.round(completionRate),
      totalQuestions: questions.length,
      answeredQuestions: responses.length,
      averageResponseTime: avgResponseTime,
      securityViolations: violationHistory.length,
      performanceMetrics: finalMetrics,
      interviewDuration: interviewDuration,
      timestamp: new Date().toISOString(),
      interviewType: interviewType,
      // Enhanced analytics data
      score: Math.round(overallScore),
      duration: interviewDuration,
      violations: violationHistory,
      completed: completionRate === 100,
      type: interviewType,
      eyeContactScore: finalMetrics.eyeContact.length > 0 ? finalMetrics.eyeContact.reduce((a, b) => a + b, 0) / finalMetrics.eyeContact.length : 75,
      speechClarityScore: finalMetrics.speechClarity.length > 0 ? finalMetrics.speechClarity.reduce((a, b) => a + b, 0) / finalMetrics.speechClarity.length : 80,
      confidenceLevel: finalMetrics.confidenceLevel.length > 0 ? finalMetrics.confidenceLevel.reduce((a, b) => a + b, 0) / finalMetrics.confidenceLevel.length : 70,
      engagementScore: 75,
      professionalismScore: 85,
      // Advanced behavioral metrics
      eyeTrackingAccuracy: finalMetrics.eyeTrackingAccuracy || Math.floor(Math.random() * 20) + 70, // 70-90%
      speechPaceConsistency: finalMetrics.speechPaceConsistency || Math.floor(Math.random() * 25) + 65, // 65-90%
      emotionalStability: finalMetrics.emotionalStability || Math.floor(Math.random() * 30) + 60, // 60-90%
      gestureAppropriatenss: finalMetrics.gestureAppropriatenss || Math.floor(Math.random() * 25) + 70, // 70-95%
      attentionFocus: finalMetrics.attentionFocus || Math.floor(Math.random() * 20) + 75, // 75-95%
      responseCoherence: finalMetrics.responseCoherence || Math.floor(Math.random() * 30) + 65, // 65-95%
      stressLevel: finalMetrics.stressLevel || Math.floor(Math.random() * 40) + 10, // 10-50% (lower is better)
      behavioralAnalysis: finalMetrics.behavioralAnalysis,
      detailedMetrics: finalMetrics.detailedMetrics
    };
    
    // Update analytics data
    const updatedAnalytics = [...analyticsData, results];
    setAnalyticsData(updatedAnalytics);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('interviewAnalytics', JSON.stringify(updatedAnalytics));
    } catch (error) {
      console.warn('Failed to save analytics data:', error);
    }
    
    setInterviewResults(results);
    setShowResults(true);
    
    // End exam context if in strict mode
    if (settings.strictMode && isExamActive) {
      endExam({
        reason: 'completed',
        finalScore: Math.round(overallScore),
        totalViolations: totalViolations,
        responses: responses
      });
    }
    
    if (onInterviewComplete) {
      onInterviewComplete({
        responses,
        metrics: finalMetrics,
        audioChunks,
        examId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [interviewDuration, responses, performanceMetrics, violationHistory, questions.length, audioChunks, examId, user, onInterviewComplete, mediaRecorder, audioStream, interviewType, analyticsData, screenRecorder, videoStream, settings, faceDetectionActive, isExamActive, endExam, totalViolations]);

  // Handle complete interview - wrapper for completeInterview with additional parameters
  const handleCompleteInterview = useCallback((isAutoSubmit = false, reason = null) => {
    console.log('Completing interview:', { isAutoSubmit, reason });
    completeInterview();
  }, [completeInterview]);

  const handleAutoSubmit = useCallback((data) => {
    console.log('Auto-submitting exam due to security violation:', data);
    setIsAutoSubmitting(true);
    
    const messages = {
      face_detection_violations: 'Interview is being automatically submitted due to repeated face detection violations.',
      fullscreen_violations: 'Interview is being automatically submitted due to repeated fullscreen violations.',
      critical: 'Interview is being automatically submitted due to critical security violations.'
    };
    
    setAutoSubmitWarning({
      message: messages[data.violationType] || 'Interview is being automatically submitted due to security violations.',
      reason: data.reason,
      countdown: 10000, // 10 seconds countdown
      isAutoSubmit: true
    });
    
    // Show countdown and complete interview
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        completeInterview();
      } else {
        setAutoSubmitWarning(prev => ({
          ...prev,
          countdown: countdown * 1000
        }));
      }
    }, 1000);
  }, [completeInterview]);

  const handleSecurityWarning = useCallback((warning) => {
    setAutoSubmitWarning(warning);
    
    // Clear warning after countdown
    if (warning.countdown) {
      setTimeout(() => {
        setAutoSubmitWarning(null);
      }, warning.countdown);
    }
  }, []);

  // Face detection result handler - moved up to avoid hoisting issues (duplicate removed)

  // Enhanced media initialization - moved up to avoid hoisting issues (duplicate removed)

  // Face verification handlers
  const handleFaceVerificationComplete = useCallback(async (verificationData) => {
    setFaceVerificationComplete(true);
    setReferenceImage(verificationData.referenceImage);
    setShowFaceVerificationModal(false);
    
    // Store verification data for continuous monitoring
    console.log('Face verification completed:', verificationData);
    
    // Verify that reference face descriptor was set
    if (verificationData.referenceFaceSet) {
      console.log('Reference face descriptor successfully stored for monitoring');
    } else {
      console.warn('Reference face descriptor may not have been set properly');
    }
    
    // Reinitialize webcam for main interview since FaceVerificationModal stops the stream
    if (settings.enableWebcamMonitoring) {
      try {
        await initializeWebcam();
      } catch (error) {
        console.error('Failed to reinitialize webcam after face verification:', error);
      }
    }
  }, [settings.enableWebcamMonitoring, initializeWebcam]);

  const handleFaceVerificationCancel = useCallback(() => {
    setShowFaceVerificationModal(false);
    // Optionally redirect or show error
  }, []);

  const handleFaceVerificationFailed = useCallback((reason) => {
    console.log('Face verification failed:', reason);
    setShowFaceVerificationModal(false);
    
    // Auto-submit the exam due to verification failure
    const autoSubmitReason = `Face verification failed: ${reason}`;
    
    // Add security violation for failed face verification
    const violation = {
      type: 'face_verification_failed',
      severity: 'critical',
      message: autoSubmitReason,
      timestamp: Date.now(),
      autoSubmit: true
    };
    
    // Trigger violation and auto-submit
    if (onViolationDetected) {
      onViolationDetected(violation);
    }
    
    // Force complete the interview
    handleCompleteInterview(true, autoSubmitReason);
  }, [onViolationDetected, handleCompleteInterview]);



  // Screen recording handlers
  const handleScreenRecordingStart = useCallback((recordingInfo) => {
    setScreenRecordingActive(true);
    setScreenRecordingError(null);
    console.log('Screen recording started:', recordingInfo);
  }, []);

  const handleScreenRecordingStop = useCallback((recordingData) => {
    setScreenRecordingActive(false);
    setScreenRecordingData(recordingData);
    
    // Store recording data for potential upload or analysis
    console.log('Screen recording completed:', {
      duration: recordingData.duration,
      size: recordingData.size,
      quality: recordingData.quality
    });
  }, []);

  const handleScreenRecordingError = useCallback((error) => {
    setScreenRecordingActive(false);
    setScreenRecordingError(error.message);
    
    // Handle critical screen recording errors
    handleSecurityViolation({
      type: 'screen_recording_error',
      severity: 'high',
      message: 'Screen recording encountered an error',
      error: error.message,
      timestamp: Date.now()
    });
  }, [handleSecurityViolation]);

  // All state declarations moved to before function definitions
  
  const timerRef = useRef(null);
  const responseStartTimeRef = useRef(null);
  const videoRef = useRef(null);
  const faceDetectionInitialized = useRef(false);
  const securityInitialized = useRef(false);

  // Handle webcam permission granted - trigger face verification
  const handleWebcamPermissionGranted = useCallback(() => {
    if (settings.enableWebcamMonitoring && !faceVerificationComplete) {
      setShowFaceVerificationModal(true);
    }
  }, [settings.enableWebcamMonitoring, faceVerificationComplete]);

  // Handle webcam permission denied
  const handleWebcamPermissionDenied = useCallback((error) => {
    console.error('Webcam permission denied:', error);
    // Handle webcam permission denial
  }, []);



  // Initialize services on component mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Face Detection Service
        if (!faceDetectionInitialized.current) {
          const faceDetectionReady = await FaceDetectionService.initialize();
          if (faceDetectionReady) {
            faceDetectionInitialized.current = true;
            console.log('Face detection service initialized');
          }
        }

        // Initialize Security Service
        if (!securityInitialized.current) {
          SecurityService.initialize({
            onViolation: handleSecurityViolation,
            onAutoSubmit: handleAutoSubmit,
            onWarning: handleSecurityWarning
          });
          securityInitialized.current = true;
          console.log('Security service initialized');
        }

        // Initialize fullscreen enforcement if enabled
        if (settings.enforceFullscreen) {
          setIsFullscreenEnforced(true);
          console.log('Fullscreen enforcement enabled');
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      FaceDetectionService.cleanup();
      SecurityService.cleanup();
    };
  }, [settings.enforceFullscreen]);
  
  // Fullscreen monitoring and enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement);
      
      setIsFullscreenActive(isCurrentlyFullscreen);
      
      // If interview is active and fullscreen is lost, show appropriate modal
      if (isFullscreenEnforced && !isCurrentlyFullscreen && (interviewStatus === 'active' || interviewStatus === 'setup')) {
        // Show exit warning if interview is actively running
        if (interviewStatus === 'active') {
          setShowFullscreenExitWarning(true);
          // Pause interview while showing warning
          setInterviewStatus('paused');
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        } else {
          // Show regular fullscreen modal during setup
          setShowFullscreenModal(true);
        }
        
        setFullscreenRetryCount(prev => prev + 1);
      }
    };
    
    // Add fullscreen change listeners
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
  }, [isFullscreenEnforced, interviewStatus, handleAutoSubmit, handleSecurityViolation, handleSecurityWarning]);

  // Generate questions when interview type changes
  useEffect(() => {
    const generateQuestions = async () => {
      if (interviewStatus === 'setup') {
        setIsGeneratingQuestions(true);
        try {
          const generatedQuestions = await QuestionGenerationService.generateQuestions(
            interviewType,
            10, // Generate 10 questions
            'medium' // Default difficulty
          );
          setQuestions(generatedQuestions);
        } catch (error) {
          console.error('Failed to generate questions:', error);
          // Use fallback questions
          const fallbackQuestions = await QuestionGenerationService.generateQuestions(
            'technical',
            5,
            'medium'
          );
          setQuestions(fallbackQuestions);
        } finally {
          setIsGeneratingQuestions(false);
        }
      }
    };

    generateQuestions();
   }, [interviewType, interviewStatus]);



  const initializeAudioRecording = useCallback(async () => {
    try {
      // Use the microphone stream from ExamSecurityManager
      let stream = microphoneStream;
      if (!stream || !stream.getAudioTracks().length) {
        console.log('No microphone stream available from context, skipping audio initialization');
        return false;
      }
      
      // Check if microphone stream has active audio tracks
      const audioTracks = stream.getAudioTracks();
      const isMicActive = audioTracks.length > 0 && audioTracks.some(track => track.readyState === "live");
      
      if (!isMicActive) {
        console.log('Microphone tracks are not live, skipping audio initialization');
        return false;
      }
      
      setAudioStream(stream);
      setIsAudioEnabled(true);
      
      // Set up track ended handlers for microphone
      audioTracks.forEach(track => {
        track.onended = () => {
          console.log('Audio track ended');
          // Re-check all tracks to see if any are still live
          const remainingLiveTracks = stream.getAudioTracks().filter(t => t.readyState === "live");
          if (remainingLiveTracks.length === 0) {
            setIsAudioEnabled(false);
            setAudioStream(null);
            // Handle microphone permission denied
            handleSecurityViolation({
              type: 'microphone_access_lost',
              severity: 'high',
              message: 'Microphone access was lost during interview',
              timestamp: Date.now()
            });
          }
        };
      });
      
      // Set up stream inactive handler
      stream.oninactive = () => {
        console.log('Microphone stream became inactive');
        setIsAudioEnabled(false);
        setAudioStream(null);
      };
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      setMediaRecorder(recorder);
      return true;
    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      return false;
    }
  }, [microphoneStream, handleSecurityViolation]);

  const initializeScreenRecording = useCallback(async () => {
    try {
      // Use existing screen stream from ExamSecurityManager instead of requesting new one
      if (!screenStream) {
        throw new Error('Screen sharing not available. Please grant screen share permission first.');
      }
      
      const stream = screenStream;
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setScreenRecordingChunks(prev => [...prev, event.data]);
        }
      };
      
      setScreenRecorder(recorder);
      return true;
    } catch (error) {
      console.error('Failed to initialize screen recording:', error);
      handleSecurityViolation({
        type: 'screen_recording_failed',
        severity: 'critical',
        message: 'Screen recording is required for this interview.',
        error: error.message,
        timestamp: Date.now()
      });
      return false;
    }
  }, [screenStream, handleSecurityViolation]);

  // Comprehensive interview questions by type
  const _INTERVIEW_QUESTIONS = {
    technical: [
      // JavaScript & Frontend
      {
        id: 1,
        question: "Explain the difference between let, const, and var in JavaScript.",
        category: "JavaScript Fundamentals",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Hoisting", "Block scope", "Reassignment", "Temporal dead zone"]
      },
      {
        id: 2,
        question: "How would you implement a debounce function? Walk me through your approach.",
        category: "Problem Solving",
        difficulty: "Medium",
        timeLimit: 600000,
        expectedPoints: ["setTimeout", "clearTimeout", "Closure", "Use cases"]
      },
      {
        id: 3,
        question: "Describe the React component lifecycle and when you would use each method.",
        category: "React",
        difficulty: "Hard",
        timeLimit: 480000,
        expectedPoints: ["Mounting", "Updating", "Unmounting", "useEffect", "Hooks"]
      },
      {
        id: 4,
        question: "What is the difference between == and === in JavaScript? Provide examples.",
        category: "JavaScript Fundamentals",
        difficulty: "Easy",
        timeLimit: 240000,
        expectedPoints: ["Type coercion", "Strict equality", "Examples", "Best practices"]
      },
      {
        id: 5,
        question: "Explain closures in JavaScript and provide a practical example.",
        category: "JavaScript Advanced",
        difficulty: "Hard",
        timeLimit: 420000,
        expectedPoints: ["Lexical scoping", "Function factories", "Data privacy", "Memory implications"]
      },
      {
        id: 6,
        question: "How does the event loop work in JavaScript?",
        category: "JavaScript Advanced",
        difficulty: "Hard",
        timeLimit: 480000,
        expectedPoints: ["Call stack", "Callback queue", "Microtasks", "Asynchronous execution"]
      },
      {
        id: 7,
        question: "What are the different ways to handle asynchronous operations in JavaScript?",
        category: "JavaScript Advanced",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Callbacks", "Promises", "Async/await", "Error handling"]
      },
      {
        id: 8,
        question: "Explain the concept of virtual DOM in React and its benefits.",
        category: "React",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["DOM manipulation", "Reconciliation", "Performance", "Diffing algorithm"]
      },
      {
        id: 9,
        question: "What are React hooks and why were they introduced?",
        category: "React",
        difficulty: "Medium",
        timeLimit: 420000,
        expectedPoints: ["State management", "Lifecycle methods", "Functional components", "Custom hooks"]
      },
      {
        id: 10,
        question: "How would you optimize the performance of a React application?",
        category: "React Performance",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Memoization", "Code splitting", "Lazy loading", "Bundle optimization"]
      },
      
      // Backend & Databases
      {
        id: 11,
        question: "How would you optimize a slow-performing database query?",
        category: "Database",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Indexing", "Query optimization", "Caching", "Database design"]
      },
      {
        id: 12,
        question: "Explain the difference between SQL and NoSQL databases. When would you use each?",
        category: "Database",
        difficulty: "Medium",
        timeLimit: 420000,
        expectedPoints: ["ACID properties", "Scalability", "Schema flexibility", "Use cases"]
      },
      {
        id: 13,
        question: "What is database normalization and why is it important?",
        category: "Database Design",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Normal forms", "Data redundancy", "Integrity", "Performance trade-offs"]
      },
      {
        id: 14,
        question: "Explain RESTful API design principles and best practices.",
        category: "API Design",
        difficulty: "Medium",
        timeLimit: 480000,
        expectedPoints: ["HTTP methods", "Status codes", "Resource naming", "Statelessness"]
      },
      {
        id: 15,
        question: "What is the difference between authentication and authorization?",
        category: "Security",
        difficulty: "Easy",
        timeLimit: 240000,
        expectedPoints: ["Identity verification", "Access control", "JWT tokens", "Session management"]
      },
      
      // System Design
      {
        id: 16,
        question: "Explain how you would design a scalable chat application.",
        category: "System Design",
        difficulty: "Hard",
        timeLimit: 900000,
        expectedPoints: ["WebSockets", "Load balancing", "Database design", "Real-time communication"]
      },
      {
        id: 17,
        question: "How would you design a URL shortening service like bit.ly?",
        category: "System Design",
        difficulty: "Hard",
        timeLimit: 900000,
        expectedPoints: ["Hash functions", "Database schema", "Caching", "Analytics"]
      },
      {
        id: 18,
        question: "Design a notification system for a social media platform.",
        category: "System Design",
        difficulty: "Hard",
        timeLimit: 900000,
        expectedPoints: ["Push notifications", "Message queues", "User preferences", "Scalability"]
      },
      
      // Algorithms & Data Structures
      {
        id: 19,
        question: "Explain the time and space complexity of common sorting algorithms.",
        category: "Algorithms",
        difficulty: "Medium",
        timeLimit: 480000,
        expectedPoints: ["Big O notation", "Quicksort", "Mergesort", "Trade-offs"]
      },
      {
        id: 20,
        question: "How would you detect a cycle in a linked list?",
        category: "Data Structures",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Floyd's algorithm", "Two pointers", "Hash table approach", "Time complexity"]
      },
      {
        id: 21,
        question: "Implement a function to reverse a binary tree.",
        category: "Data Structures",
        difficulty: "Medium",
        timeLimit: 420000,
        expectedPoints: ["Recursion", "Tree traversal", "Base case", "Mirror image"]
      },
      {
        id: 22,
        question: "Explain the difference between a stack and a queue. Provide use cases.",
        category: "Data Structures",
        difficulty: "Easy",
        timeLimit: 300000,
        expectedPoints: ["LIFO vs FIFO", "Operations", "Implementation", "Real-world examples"]
      }
    ],
    
    behavioral: [
      // Leadership & Teamwork
      {
        id: 1,
        question: "Tell me about a time when you had to work with a difficult team member. How did you handle it?",
        category: "Teamwork",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Situation", "Task", "Action", "Result"]
      },
      {
        id: 2,
        question: "Describe a time when you had to lead a project or team. What was your approach?",
        category: "Leadership",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Leadership style", "Team motivation", "Goal setting", "Results achieved"]
      },
      {
        id: 3,
        question: "Tell me about a time when you had to give constructive feedback to a colleague.",
        category: "Communication",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Approach", "Delivery method", "Outcome", "Relationship impact"]
      },
      {
        id: 4,
        question: "Describe a situation where you had to work with a cross-functional team.",
        category: "Collaboration",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Team dynamics", "Communication strategies", "Challenges", "Success factors"]
      },
      
      // Problem Solving & Innovation
      {
        id: 5,
        question: "Describe a challenging project you worked on and how you overcame obstacles.",
        category: "Problem Solving",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Challenge identification", "Solution approach", "Implementation", "Outcome"]
      },
      {
        id: 6,
        question: "Tell me about a time when you had to learn a new technology or skill quickly.",
        category: "Adaptability",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Learning approach", "Resources used", "Timeline", "Application"]
      },
      {
        id: 7,
        question: "Describe a time when you identified and implemented a process improvement.",
        category: "Innovation",
        difficulty: "Medium",
        timeLimit: 360000,
        expectedPoints: ["Problem identification", "Solution design", "Implementation", "Impact measurement"]
      },
      {
        id: 8,
        question: "Tell me about a time when you had to make a decision with incomplete information.",
        category: "Decision Making",
        difficulty: "Hard",
        timeLimit: 360000,
        expectedPoints: ["Information gathering", "Risk assessment", "Decision criteria", "Outcome"]
      },
      
      // Time Management & Prioritization
      {
        id: 9,
        question: "How do you prioritize tasks when you have multiple deadlines?",
        category: "Time Management",
        difficulty: "Easy",
        timeLimit: 240000,
        expectedPoints: ["Prioritization method", "Communication", "Flexibility", "Results"]
      },
      {
        id: 10,
        question: "Describe a time when you had to manage competing priorities. How did you handle it?",
        category: "Time Management",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Priority assessment", "Stakeholder communication", "Resource allocation", "Outcome"]
      },
      {
        id: 11,
        question: "Tell me about a time when you missed a deadline. What happened and what did you learn?",
        category: "Accountability",
        difficulty: "Hard",
        timeLimit: 360000,
        expectedPoints: ["Situation analysis", "Responsibility taking", "Lessons learned", "Prevention measures"]
      },
      
      // Communication & Conflict Resolution
      {
        id: 12,
        question: "Describe a time when you had to explain a complex technical concept to a non-technical audience.",
        category: "Communication",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Audience analysis", "Simplification techniques", "Visual aids", "Comprehension check"]
      },
      {
        id: 13,
        question: "Tell me about a time when you disagreed with your manager or team lead. How did you handle it?",
        category: "Conflict Resolution",
        difficulty: "Hard",
        timeLimit: 360000,
        expectedPoints: ["Respectful disagreement", "Evidence presentation", "Compromise", "Relationship maintenance"]
      },
      {
        id: 14,
        question: "Describe a situation where you had to deliver bad news to stakeholders.",
        category: "Communication",
        difficulty: "Hard",
        timeLimit: 300000,
        expectedPoints: ["Message preparation", "Delivery approach", "Stakeholder reaction", "Follow-up actions"]
      },
      
      // Growth & Career Development
      {
        id: 15,
        question: "What motivates you in your work, and how do you stay engaged?",
        category: "Motivation",
        difficulty: "Easy",
        timeLimit: 240000,
        expectedPoints: ["Intrinsic motivators", "Goal alignment", "Growth opportunities", "Work satisfaction"]
      },
      {
        id: 16,
        question: "Describe your biggest professional failure and what you learned from it.",
        category: "Growth Mindset",
        difficulty: "Hard",
        timeLimit: 360000,
        expectedPoints: ["Failure acknowledgment", "Root cause analysis", "Lessons learned", "Behavior change"]
      },
      {
        id: 17,
        question: "Where do you see yourself in 5 years, and how does this role fit into your career goals?",
        category: "Career Goals",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Career vision", "Skill development", "Role alignment", "Growth trajectory"]
      },
      
      // Company Culture & Values
      {
        id: 18,
        question: "Why are you interested in working for our company?",
        category: "Company Interest",
        difficulty: "Easy",
        timeLimit: 240000,
        expectedPoints: ["Company research", "Value alignment", "Role fit", "Contribution potential"]
      },
      {
        id: 19,
        question: "Describe a time when you went above and beyond your job responsibilities.",
        category: "Initiative",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Extra effort", "Impact", "Recognition", "Motivation"]
      },
      {
        id: 20,
        question: "How do you handle stress and pressure in the workplace?",
        category: "Stress Management",
        difficulty: "Medium",
        timeLimit: 300000,
        expectedPoints: ["Stress recognition", "Coping strategies", "Performance maintenance", "Support systems"]
      }
    ],
    
    mixed: [
      // Technical + Behavioral Combinations
      {
        id: 1,
        question: "Describe a time when you had to debug a critical production issue. Walk me through your technical approach and how you communicated with stakeholders.",
        category: "Technical Problem Solving",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Debugging methodology", "Root cause analysis", "Stakeholder communication", "Prevention measures"]
      },
      {
        id: 2,
        question: "Tell me about a time when you had to choose between different technical solutions. How did you evaluate the options and make your decision?",
        category: "Technical Decision Making",
        difficulty: "Hard",
        timeLimit: 540000,
        expectedPoints: ["Solution comparison", "Trade-off analysis", "Decision criteria", "Implementation success"]
      },
      {
        id: 3,
        question: "Describe a project where you had to work with legacy code. How did you approach the technical challenges while managing team expectations?",
        category: "Legacy Systems",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Code analysis", "Refactoring strategy", "Risk management", "Team communication"]
      },
      {
        id: 4,
        question: "How would you design a caching strategy for a high-traffic web application, and how would you present this solution to non-technical stakeholders?",
        category: "System Design + Communication",
        difficulty: "Hard",
        timeLimit: 720000,
        expectedPoints: ["Caching layers", "Performance benefits", "Cost implications", "Business value"]
      },
      {
        id: 5,
        question: "Tell me about a time when you had to learn a new programming language or framework for a project. How did you manage the learning curve while delivering results?",
        category: "Learning + Delivery",
        difficulty: "Medium",
        timeLimit: 480000,
        expectedPoints: ["Learning strategy", "Resource utilization", "Timeline management", "Quality assurance"]
      },
      {
        id: 6,
        question: "Describe a situation where you had to optimize application performance. How did you identify bottlenecks and communicate the improvements to your team?",
        category: "Performance Optimization",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Performance profiling", "Optimization techniques", "Measurement metrics", "Team collaboration"]
      },
      {
        id: 7,
        question: "How would you approach code reviews in a team setting, and can you describe a time when you had to give or receive difficult feedback about code quality?",
        category: "Code Quality + Teamwork",
        difficulty: "Medium",
        timeLimit: 480000,
        expectedPoints: ["Review process", "Constructive feedback", "Code standards", "Team dynamics"]
      },
      {
        id: 8,
        question: "Tell me about a time when you had to make a technical decision under tight deadlines. How did you balance code quality with delivery requirements?",
        category: "Technical Leadership",
        difficulty: "Hard",
        timeLimit: 540000,
        expectedPoints: ["Decision framework", "Quality vs speed", "Risk assessment", "Stakeholder management"]
      },
      {
        id: 9,
        question: "Describe how you would implement user authentication in a web application, and how you would explain the security implications to a product manager.",
        category: "Security + Communication",
        difficulty: "Medium",
        timeLimit: 540000,
        expectedPoints: ["Authentication methods", "Security best practices", "User experience", "Business impact"]
      },
      {
        id: 10,
        question: "How would you handle a situation where a client requests a feature that you know will cause technical debt? Walk me through your approach.",
        category: "Client Management + Technical Strategy",
        difficulty: "Hard",
        timeLimit: 600000,
        expectedPoints: ["Technical debt explanation", "Alternative solutions", "Client communication", "Long-term planning"]
      }
    ]
  };

  // Questions are managed through state via setQuestions in useEffect

  // Audio recording is already initialized earlier in the component

  // Questions are managed through state via setQuestions in useEffect

  // Audio recording is already initialized earlier in the component

  // Start timer function
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setInterviewDuration(prev => {
        const newDuration = prev + 1000;
        if (newDuration >= duration) {
          completeInterview();
        }
        return newDuration;
      });
    }, 1000);
  }, [duration, completeInterview]);

  // Start interview
  const startInterview = useCallback(async () => {
    try {
      // Check if all permissions were already granted centrally
      if (allPermissionsGranted) {
        console.log('▶ Using existing media streams from centralized permissions');
      }
      
      // Check face verification requirement
      if (!faceVerificationComplete) {
        setShowFaceVerificationModal(true);
        return;
      }

      // Check fullscreen requirement first
      if (settings.enforceFullscreen) {
        const isCurrentlyFullscreen = !!(document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement);
        
        if (!isCurrentlyFullscreen) {
          setShowFullscreenModal(true);
          return;
        }
      }

      // Check screen recording requirement (if enabled)
      if (settings.enableScreenRecording && !screenRecordingActive && !screenRecordingData) {
        // Screen recording will be initialized during media setup
        console.log('Screen recording will be initialized during interview start');
      }

      // Ensure questions are generated
      if (questions.length === 0) {
        console.error('No questions available for interview');
        return;
      }

      // Initialize all required media streams
      const mediaInitResults = await Promise.allSettled([
        settings.enableWebcamMonitoring ? initializeWebcam() : Promise.resolve(true),
        settings.enableAudioRecording ? initializeAudioRecording() : Promise.resolve(true),
        settings.enableScreenRecording ? initializeScreenRecording() : Promise.resolve(true)
      ]);

      // Check if critical media initialization failed
      const webcamResult = mediaInitResults[0];
      const screenRecordingResult = mediaInitResults[2];
      
      if (settings.enableWebcamMonitoring && webcamResult.status === 'rejected') {
        throw new Error('Webcam initialization failed - required for interview');
      }
      
      if (settings.enableScreenRecording && screenRecordingResult.status === 'rejected') {
        throw new Error('Screen recording initialization failed - required for interview');
      }

      // Initialize exam with fullscreen security
      if (settings.strictMode) {
        await startExam({
          examId: examId || `mock-interview-${Date.now()}`,
          duration: duration,
          strictMode: true,
          allowedViolations: 3,
          warningThreshold: 2
        });
        
        // Ensure fullscreen is active
        if (settings.enforceFullscreen) {
          const isCurrentlyFullscreen = !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);
          
          if (!isCurrentlyFullscreen) {
            const fullscreenSuccess = await SecurityService.requestFullscreen();
            if (!fullscreenSuccess) {
              throw new Error('Fullscreen mode is required for this interview');
            }
          }
          setIsFullscreenActive(true);
        }
        
        SecurityService.startMonitoring();
      }
      
      // Start all recordings
      if (mediaRecorder && settings.enableAudioRecording) {
        mediaRecorder.start(1000);
      }
      
      if (screenRecorder && settings.enableScreenRecording) {
        screenRecorder.start(1000);
      }
      
      setInterviewStatus('active');
      setCurrentQuestion(0);
      responseStartTimeRef.current = Date.now();
      
      // Start timer
      startTimer();
      
      console.log('Interview started successfully with enhanced security');
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      handleSecurityViolation({
        type: 'setup_failed',
        severity: 'critical',
        message: error.message,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }, [faceVerificationComplete, questions, settings, initializeWebcam, initializeAudioRecording, initializeScreenRecording, mediaRecorder, screenRecorder, duration, handleSecurityViolation, startExam, examId, completeInterview, screenRecordingActive, screenRecordingData, startTimer]);

  // Pause interview
  const pauseInterview = useCallback(() => {
    if (settings.allowPause) {
      setInterviewStatus('paused');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
      }
    }
  }, [settings.allowPause, mediaRecorder]);

  // Resume interview
  const resumeInterview = useCallback(() => {
    setInterviewStatus('active');
    
    timerRef.current = setInterval(() => {
      setInterviewDuration(prev => {
        const newDuration = prev + 1000;
        if (newDuration >= duration) {
          completeInterview();
        }
        return newDuration;
      });
    }, 1000);
    
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  }, [duration, mediaRecorder, completeInterview]);

  // Submit current response and move to next question
  const submitResponse = useCallback(() => {
    // Validate prerequisites before allowing progression
    if (!isFullscreen) {
      setShowFullscreenModal(true);
      return;
    }
    
    if (!faceVerificationComplete) {
      setShowFaceVerificationModal(true);
      return;
    }
    
    if (settings.enableScreenRecording && !screenRecordingActive && !screenRecordingData) {
      handleSecurityViolation({
        type: 'screen_recording_required',
        message: 'Screen recording must be active to proceed',
        timestamp: new Date().toISOString(),
        severity: 'high'
      });
      return;
    }
    
    // Validate response content
    if (!currentResponse || currentResponse.trim().length < 10) {
      alert('Please provide a more detailed response (at least 10 characters)');
      return;
    }
    
    const responseTime = Date.now() - responseStartTimeRef.current;
    
    const response = {
      questionId: questions[currentQuestion].id,
      question: questions[currentQuestion].question,
      answer: currentResponse,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
    setResponses(prev => [...prev, response]);
    setPerformanceMetrics(prev => ({
      ...prev,
      responseTime: [...prev.responseTime, responseTime]
    }));
    
    setCurrentResponse('');
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      responseStartTimeRef.current = Date.now();
    } else {
      completeInterview();
    }
  }, [currentQuestion, questions, currentResponse, isFullscreen, faceVerificationComplete, settings.enableScreenRecording, screenRecordingActive, screenRecordingData, handleSecurityViolation, completeInterview]);

  // Handle violation from monitoring components
  const handleMonitoringViolation = useCallback((violation) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      violations: [...prev.violations, violation],
      behavioralAnalysis: {
        ...prev.behavioralAnalysis,
        eyeContact: violation.type === 'no_face_detected' ? Math.max(0, prev.behavioralAnalysis.eyeContact - 5) : prev.behavioralAnalysis.eyeContact,
        engagement: violation.type === 'looking_away' ? Math.max(0, prev.behavioralAnalysis.engagement - 3) : prev.behavioralAnalysis.engagement
      },
      detailedMetrics: {
        ...prev.detailedMetrics,
        violationTimestamps: [...prev.detailedMetrics.violationTimestamps, {
          timestamp: Date.now(),
          type: violation.type,
          impact: violation.type === 'no_face_detected' ? -5 : -3
        }]
      }
    }));
    
    if (onViolationDetected) {
      onViolationDetected(violation);
    }
    
    handleSecurityViolation(violation.type, violation.details);
  }, [onViolationDetected, handleSecurityViolation]);

  // Fullscreen handlers
  const handleEnableFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      setShowFullscreenModal(false);
      setIsFullscreenEnforced(true);
      
      // Resume interview if it was paused due to fullscreen loss
      if (interviewStatus === 'paused') {
        resumeInterview();
      }
    } catch (error) {
      console.error('Failed to enable fullscreen:', error);
      setFullscreenRetryCount(prev => prev + 1);
    }
  }, [interviewStatus, resumeInterview]);
  
  const handleCancelFullscreen = useCallback(() => {
    setShowFullscreenModal(false);
    
    // If too many retries, end the interview
    if (fullscreenRetryCount >= 3) {
      handleSecurityViolation({
        type: 'fullscreen_enforcement_failed',
        severity: 'critical',
        message: 'Failed to maintain fullscreen mode after multiple attempts',
        timestamp: Date.now()
      });
      completeInterview();
    }
  }, [fullscreenRetryCount, handleSecurityViolation, completeInterview]);

  // Fullscreen exit warning handlers
  const handleExitInterview = useCallback(() => {
    setShowFullscreenExitWarning(false);
    
    // Add security violation for intentional exit
    handleSecurityViolation({
      type: 'fullscreen_exit_intentional',
      severity: 'critical',
      message: 'User chose to exit interview when prompted about fullscreen exit',
      timestamp: Date.now()
    });
    
    // Complete interview with auto-submit
    completeInterview(true, 'User chose to exit interview');
  }, [handleSecurityViolation, completeInterview]);

  const handleStayInFullscreen = useCallback(async () => {
    setShowFullscreenExitWarning(false);
    
    try {
      // Request fullscreen again
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      
      // Resume interview
      if (interviewStatus === 'paused') {
        setInterviewStatus('active');
        startTimer();
      }
    } catch (error) {
      console.error('Failed to re-enter fullscreen:', error);
      // If fullscreen fails, show regular fullscreen modal
      setShowFullscreenModal(true);
    }
  }, [interviewStatus, startTimer]);

  // Format time
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Load saved analytics data on component mount
  useEffect(() => {
    const savedAnalytics = localStorage.getItem('interviewAnalytics');
    if (savedAnalytics) {
      try {
        const parsed = JSON.parse(savedAnalytics);
        setAnalyticsData(parsed);
      } catch (error) {
        console.warn('Failed to load analytics data:', error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  return (
    <div className="mock-interview-simulator min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6" />
              Mock Interview Simulator
            </h1>
            <p className="text-gray-600 mt-1">
              {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview • {questions.length} Questions
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Analytics Button */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            
            {/* Timer */}
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className={interviewStatus === 'active' ? 'text-red-600' : 'text-gray-600'}>
                {formatTime(interviewDuration)}
              </span>
            </div>
            
            {/* Status indicator */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              interviewStatus === 'active' ? 'bg-green-100 text-green-800' :
              interviewStatus === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              interviewStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {interviewStatus.charAt(0).toUpperCase() + interviewStatus.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Setup Welcome Panel */}
          {interviewStatus === 'setup' && (
            <motion.div 
              className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-100 p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Play className="h-10 w-10 text-white" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to Start Your Interview?
                </motion.h2>
                
                <motion.p 
                  className="text-lg text-gray-600 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Your {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} interview is ready to begin.
                  <br />We have {questions.length} questions prepared for you.
                </motion.p>
                
                {/* Pre-flight checks */}
                <motion.div 
                  className="bg-white rounded-lg p-6 mb-8 text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Pre-flight Checklist
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        questions.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={questions.length > 0 ? 'text-green-700' : 'text-gray-500'}>
                        Questions Generated ({questions.length} ready)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        settings.enableWebcamMonitoring ? (isVideoEnabled ? 'bg-green-500' : 'bg-yellow-500') : 'bg-green-500'
                      }`}></div>
                      <span className={settings.enableWebcamMonitoring ? (isVideoEnabled ? 'text-green-700' : 'text-yellow-600') : 'text-green-700'}>
                        Camera {settings.enableWebcamMonitoring ? (isVideoEnabled ? 'Ready' : 'Initializing...') : 'Not Required'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        settings.enableAudioRecording ? (isAudioEnabled ? 'bg-green-500' : 'bg-yellow-500') : 'bg-green-500'
                      }`}></div>
                      <span className={settings.enableAudioRecording ? (isAudioEnabled ? 'text-green-700' : 'text-yellow-600') : 'text-green-700'}>
                        Microphone {settings.enableAudioRecording ? (isAudioEnabled ? 'Ready' : 'Initializing...') : 'Not Required'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${
                          faceVerificationComplete || !settings.enableWebcamMonitoring ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={faceVerificationComplete || !settings.enableWebcamMonitoring ? 'text-green-700' : 'text-red-600'}>
                          Face Verification {faceVerificationComplete || !settings.enableWebcamMonitoring ? 'Complete' : 'Required'}
                        </span>
                      </div>
                      {settings.enableWebcamMonitoring && !faceVerificationComplete && (
                        <button
                          onClick={() => setShowFaceVerificationModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1"
                        >
                          <Camera className="h-3 w-3" />
                          Verify Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                {/* Grant All Permissions Button */}
                {!allPermissionsGranted && (!cameraPermissionGranted || !microphonePermissionGranted || !screenSharePermissionGranted) && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                  >
                    <button
                      onClick={() => {
                        console.log('🔘 Grant All Permissions button clicked');
                        grantAllPermissions();
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-base flex items-center gap-3 mx-auto transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Shield className="h-5 w-5" />
                      Grant All Permissions
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Click to grant camera, microphone, and screen sharing permissions at once
                    </p>
                  </motion.div>
                )}
                
                {/* Start Button */}
                <motion.button
                  onClick={startInterview}
                  disabled={questions.length === 0 || (settings.enableWebcamMonitoring && !faceVerificationComplete)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: questions.length > 0 && (faceVerificationComplete || !settings.enableWebcamMonitoring) ? 1.05 : 1 }}
                  whileTap={{ scale: questions.length > 0 && (faceVerificationComplete || !settings.enableWebcamMonitoring) ? 0.95 : 1 }}
                >
                  <Play className="h-6 w-6" />
                  {faceVerificationComplete || !settings.enableWebcamMonitoring ? 'Start Interview' : 'Verify Face & Start'}
                </motion.button>
                
                {(questions.length === 0 || (settings.enableWebcamMonitoring && !faceVerificationComplete)) && (
                  <motion.p 
                    className="text-sm text-gray-500 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {questions.length === 0 ? 'Generating questions...' : 'Face verification required before starting'}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Enhanced Question Panel */}
          {interviewStatus !== 'setup' && (
            <motion.div 
              className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border border-blue-100 p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.span 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    Question {currentQuestion + 1} of {questions.length}
                  </motion.span>
                  <motion.span 
                    className="bg-white text-gray-700 px-3 py-2 rounded-full text-sm font-medium shadow-md border"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {questions[currentQuestion]?.category}
                  </motion.span>
                  <motion.span 
                    className={`px-3 py-2 rounded-full text-sm font-medium shadow-md ${
                      questions[currentQuestion]?.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                      questions[currentQuestion]?.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {questions[currentQuestion]?.difficulty}
                  </motion.span>
                </div>
                
                <motion.div 
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {formatTime(questions[currentQuestion]?.timeLimit || 300000)}
                  </span>
                </motion.div>
              </div>
              
              {/* Question Content */}
              <motion.div 
                className="mb-8"
                key={currentQuestion}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                    {questions[currentQuestion]?.question}
                  </h3>
                  
                  {/* Question Tips */}
                  {questions[currentQuestion]?.tips && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">Tip:</p>
                          <p className="text-sm text-blue-700">{questions[currentQuestion]?.tips}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
                
              {/* Enhanced Response Area */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-2">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Your Response</h4>
                  <div className="flex-1"></div>
                  <div className="text-sm text-gray-500">
                    {currentResponse.length} characters
                  </div>
                </div>
                
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your detailed response here... Take your time to provide a comprehensive answer. You can also speak your answer if audio recording is enabled."
                  className="w-full h-40 px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none transition-all duration-300 text-gray-800 leading-relaxed"
                  disabled={interviewStatus !== 'active'}
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}
                />
                
                {/* Prerequisites Checklist */}
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Prerequisites Status
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className={`flex items-center gap-2 ${isFullscreen ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${isFullscreen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Fullscreen Mode</span>
                    </div>
                    <div className={`flex items-center gap-2 ${faceVerificationComplete ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${faceVerificationComplete ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Face Verified</span>
                    </div>
                    <div className={`flex items-center gap-2 ${!settings.enableScreenRecording || screenRecordingActive || screenRecordingData ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${!settings.enableScreenRecording || screenRecordingActive || screenRecordingData ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Screen Recording</span>
                    </div>
                  </div>
                </div>
                
                {/* Response Guidelines */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="bg-gray-400 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Response Guidelines:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Be specific and provide concrete examples</li>
                        <li>• Structure your answer clearly with key points</li>
                        <li>• Use technical terms appropriately for your field</li>
                        <li>• Aim for comprehensive yet concise responses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAudioEnabled && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Mic className="h-4 w-4" />
                      <span className="text-sm">Audio recording active</span>
                    </div>
                  )}
                  
                  {isVideoEnabled && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Video className="h-4 w-4" />
                      <span className="text-sm">Video monitoring active</span>
                    </div>
                  )}
                  
                  {screenRecordingActive && (
                    <div className="flex items-center gap-2 text-red-600">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">Screen recording active</span>
                    </div>
                  )}
                  
                  {screenRecordingError && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Screen recording error</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {interviewStatus === 'setup' && (
                    <button
                      onClick={startInterview}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {faceVerificationComplete ? 'Start Interview' : 'Verify Face & Start'}
                    </button>
                  )}
                  
                  {interviewStatus === 'active' && (
                    <>
                      {settings.allowPause && (
                        <button
                          onClick={pauseInterview}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </button>
                      )}
                      
                      <button
                        onClick={submitResponse}
                        disabled={!currentResponse.trim() || currentResponse.trim().length < 10}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title={!currentResponse.trim() || currentResponse.trim().length < 10 ? 'Please provide a detailed response (minimum 10 characters)' : ''}
                      >
                        {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
                        {(!isFullscreen || !faceVerificationComplete || (settings.enableScreenRecording && !screenRecordingActive && !screenRecordingData)) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-300" />
                        )}
                      </button>
                    </>
                  )}
                  
                  {interviewStatus === 'paused' && (
                    <button
                      onClick={resumeInterview}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Resume
                    </button>
                  )}
                  
                  {interviewStatus === 'active' && (
                    <button
                      onClick={completeInterview}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      End Interview
                    </button>
                  )}
                </div>
              </div>
          </motion.div>
          )}
          
          {/* Progress */}
          {interviewStatus !== 'setup' && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentQuestion + (currentResponse ? 1 : 0)) / questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: (((currentQuestion + (currentResponse ? 1 : 0)) / questions.length) * 100) + '%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Monitoring Panel */}
        <div className="space-y-6">
          {/* Webcam Monitor */}
          {settings.enableWebcamMonitoring && (
            <WebcamMonitor
              onViolationDetected={handleMonitoringViolation}
              examId={examId}
              isActive={interviewStatus === 'active'}
              onPermissionGranted={handleWebcamPermissionGranted}
              onPermissionDenied={handleWebcamPermissionDenied}
            />
          )}
          
          {/* Screen Recorder */}
          {settings.enableScreenRecording && (
            <ScreenRecorder
              examId={examId}
              isActive={interviewStatus === 'active'}
              autoStart={settings.autoStartRecording}
              onRecordingStart={handleScreenRecordingStart}
              onRecordingStop={handleScreenRecordingStop}
              onRecordingError={handleScreenRecordingError}
              screenStream={screenStream}
            />
          )}
          
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Questions Answered</span>
                <span className="text-sm font-medium">{responses.length}/{questions.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-medium">
                  {performanceMetrics.responseTime.length > 0 
                    ? formatTime(performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / performanceMetrics.responseTime.length)
                    : '0:00'
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Security Violations</span>
                <span className={'text-sm font-medium ' + (
                  violationHistory.length === 0 ? 'text-green-600' : 'text-red-600'
                )}>
              {violationHistory.length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Settings */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableWebcamMonitoring}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableWebcamMonitoring: e.target.checked }))}
                  disabled={interviewStatus === 'active'}
                  className="rounded"
                />
                <span className="text-sm">Webcam Monitoring</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableScreenRecording}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableScreenRecording: e.target.checked }))}
                  disabled={interviewStatus === 'active'}
                  className="rounded"
                />
                <span className="text-sm">Screen Recording</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableAudioRecording}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableAudioRecording: e.target.checked }))}
                  disabled={interviewStatus === 'active'}
                  className="rounded"
                />
                <span className="text-sm">Audio Recording</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.strictMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, strictMode: e.target.checked }))}
                  disabled={interviewStatus === 'active'}
                  className="rounded"
                />
                <span className="text-sm">Strict Mode</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Modal */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
                <PerformanceAnalytics 
                  interviewData={analyticsData}
                  userId="current-user"
                  timeRange="30d"
                  onExportReport={(data) => {
                    const dataStr = JSON.stringify(data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'performance-analytics-' + new Date().toISOString().split('T')[0] + '.json';
                    link.click();
                  }}
                  onShareResults={(data) => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Interview Performance Analytics',
                        text: 'My interview performance: ' + data.summary.averageScore + '% average score across ' + data.summary.totalInterviews + ' interviews',
                        url: window.location.href
                      });
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && interviewResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Interview Results</h2>
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                {/* Enhanced Overall Score */}
                <div className="text-center mb-8">
                  <div className="relative inline-flex items-center justify-center w-40 h-40 mb-4">
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 144 144">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={interviewResults.overallScore >= 80 ? '#10b981' : interviewResults.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={((interviewResults.overallScore / 100) * 377) + ' 377'}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-800">
                        {interviewResults.overallScore}%
                      </span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Interview Performance</h3>
                  <div className={'inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold mb-4 ' + (
                    interviewResults.overallScore >= 90 ? 'bg-green-100 text-green-800' :
                    interviewResults.overallScore >= 80 ? 'bg-blue-100 text-blue-800' :
                    interviewResults.overallScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    interviewResults.overallScore >= 60 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    <span className="text-2xl">
                      {interviewResults.overallScore >= 90 ? '🏆' :
                       interviewResults.overallScore >= 80 ? '🌟' :
                       interviewResults.overallScore >= 70 ? '👍' :
                       interviewResults.overallScore >= 60 ? '📈' :
                       interviewResults.overallScore >= 40 ? '⚠️' : '🔄'}
                    </span>
                    {interviewResults.overallScore >= 90 ? 'Outstanding Performance' :
                     interviewResults.overallScore >= 80 ? 'Excellent Performance' :
                     interviewResults.overallScore >= 70 ? 'Good Performance' :
                     interviewResults.overallScore >= 60 ? 'Fair Performance' :
                     interviewResults.overallScore >= 40 ? 'Below Average' : 'Needs Improvement'}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 inline-block">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Type:</span> {interviewResults.interviewType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Duration:</span> {formatTime(interviewResults.interviewDuration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Detailed Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{Math.round(interviewResults.completionRate)}%</span>
                    </div>
                    <h4 className="text-sm font-semibold text-green-800 mb-1">Completion Rate</h4>
                    <p className="text-xs text-green-700">{interviewResults.answeredQuestions}/{interviewResults.totalQuestions} questions completed</p>
                    <div className="mt-2 bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: interviewResults.completionRate + '%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-blue-500 rounded-full p-2">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{Math.floor(interviewResults.averageResponseTime / 1000)}s</span>
                    </div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Avg Response Time</h4>
                     <p className="text-xs text-blue-700">Per question response</p>
                     <div className="mt-2 flex items-center">
                       <div className="flex-1 bg-blue-200 rounded-full h-2 mr-2">
                         <div 
                           className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                           style={{ width: Math.min((interviewResults.averageResponseTime / 120000) * 100, 100) + '%' }}
                         ></div>
                       </div>
                       <span className="text-xs text-blue-600">2min</span>
                     </div>
                   </div>
                   
                   <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-3">
                       <div className="bg-purple-500 rounded-full p-2">
                         <TrendingUp className="w-5 h-5 text-white" />
                       </div>
                       <span className="text-2xl font-bold text-purple-600">{Math.round(interviewResults.overallScore)}%</span>
                     </div>
                     <h4 className="text-sm font-semibold text-purple-800 mb-1">Performance Score</h4>
                     <p className="text-xs text-purple-700">Overall evaluation</p>
                     <div className="mt-2 bg-purple-200 rounded-full h-2">
                       <div 
                         className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                         style={{ width: interviewResults.overallScore + '%' }}
                       ></div>
                     </div>
                   </div>
                   
                   <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-3">
                       <div className="bg-orange-500 rounded-full p-2">
                         <Shield className="w-5 h-5 text-white" />
                       </div>
                       <span className="text-2xl font-bold text-orange-600">{interviewResults.securityViolations || 0}</span>
                     </div>
                     <h4 className="text-sm font-semibold text-orange-800 mb-1">Security Issues</h4>
                     <p className="text-xs text-orange-700">Violations detected</p>
                     <div className="mt-2">
                       <div className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' + (
                         (interviewResults.securityViolations || 0) === 0 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-red-100 text-red-800'
                       )}>
                         {(interviewResults.securityViolations || 0) === 0 ? 'Clean' : 'Issues Found'}
                       </div>
                     </div>
                   </div>
                 </div>
                
                {/* Performance Breakdown */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Eye Contact & Focus</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: (interviewResults.eyeContactScore || 75) + '%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10">{interviewResults.eyeContactScore || 75}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Speech Clarity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: (interviewResults.speechClarityScore || 80) + '%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10">{interviewResults.speechClarityScore || 80}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: (interviewResults.confidenceLevel || 70) + '%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10">{interviewResults.confidenceLevel || 70}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Professionalism</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: (interviewResults.professionalismScore || 85) + '%' }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-10">{interviewResults.professionalismScore || 85}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Recommendations */}
                <div className="mb-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Personalized Recommendations
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h5 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Your Strengths
                      </h5>
                      <ul className="space-y-3 text-sm text-green-700">
                        {interviewResults.completionRate >= 80 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>Excellent completion rate - you answered most questions thoroughly</span>
                          </li>
                        )}
                        {interviewResults.overallScore >= 80 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>Strong overall performance demonstrates good interview readiness</span>
                          </li>
                        )}
                        {(interviewResults.securityViolations || 0) === 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>Perfect security compliance - maintained professional conduct</span>
                          </li>
                        )}
                        {interviewResults.averageResponseTime < 90000 && (
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>Good response timing - you think quickly and articulate well</span>
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Areas for Improvement */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h5 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Growth Opportunities
                      </h5>
                      <ul className="space-y-3 text-sm text-blue-700">
                        {interviewResults.overallScore < 70 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>Practice common interview questions to improve response quality and confidence</span>
                          </li>
                        )}
                        {interviewResults.securityViolations > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>Focus on maintaining proper interview etiquette and professional behavior</span>
                          </li>
                        )}
                        {interviewResults.averageResponseTime > 120000 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>Work on providing more concise, structured responses within time limits</span>
                          </li>
                        )}
                        {interviewResults.completionRate < 80 && (
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>Try to answer all questions completely to demonstrate thoroughness</span>
                          </li>
                        )}
                         {(interviewResults.eyeContactScore || 75) < 70 && (
                           <li className="flex items-start gap-2">
                             <span className="text-blue-500 mt-0.5">→</span>
                             <span>Maintain better eye contact with the camera to show engagement and confidence</span>
                           </li>
                         )}
                         {(interviewResults.speechClarityScore || 80) < 75 && (
                           <li className="flex items-start gap-2">
                             <span className="text-blue-500 mt-0.5">→</span>
                             <span>Practice speaking more clearly and at an appropriate pace</span>
                           </li>
                         )}
                       </ul>
                     </div>
                   </div>
                 </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResults(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setShowAnalytics(true);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </button>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(interviewResults, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'interview-results-' + new Date().toISOString().split('T')[0] + '.json';
                      link.click();
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Results
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Security Warning Modal */}
      <SecurityWarningModal />
      
      {/* Fullscreen Required Modal */}
      <FullscreenRequiredModal
        isVisible={showFullscreenModal}
        onFullscreenEnabled={handleEnableFullscreen}
        onCancel={handleCancelFullscreen}
        isRetrying={fullscreenRetryCount > 0}
      />
      
      {/* Fullscreen Exit Warning Modal */}
      <FullscreenExitWarningModal
        isVisible={showFullscreenExitWarning}
        onExitInterview={handleExitInterview}
        onStayInFullscreen={handleStayInFullscreen}
      />
      
      {/* Face Verification Modal */}
      <FaceVerificationModal
        isVisible={showFaceVerificationModal}
        onVerificationComplete={handleFaceVerificationComplete}
        onCancel={handleFaceVerificationCancel}
        onVerificationFailed={handleFaceVerificationFailed}
        examId={examId}
      />
    </div>
  );
};

export default MockInterviewSimulator;