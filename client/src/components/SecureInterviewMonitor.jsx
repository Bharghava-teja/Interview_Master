import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Shield, 
  Users, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import FaceDetectionService from '../services/FaceDetectionService';
import SecurityService from '../services/SecurityService';

const SecureInterviewMonitor = ({ 
  sessionId,
  isHost = false,
  onViolationDetected,
  onSecurityAlert,
  videoStream = null,
  isActive = false
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const violationTimeoutRef = useRef(null);
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [lookingAway, setLookingAway] = useState(false);
  const [violations, setViolations] = useState([]);
  const [securityStatus, setSecurityStatus] = useState('initializing');
  const [lastViolationTime, setLastViolationTime] = useState(0);
  const [consecutiveViolations, setConsecutiveViolations] = useState(0);
  const [monitoringStats, setMonitoringStats] = useState({
    totalChecks: 0,
    violationsDetected: 0,
    faceDetectionRate: 0,
    lastCheckTime: null
  });

  // Violation thresholds for secure interviews
  const VIOLATION_THRESHOLDS = {
    NO_FACE_TIMEOUT: 5000, // 5 seconds
    MULTIPLE_FACES_IMMEDIATE: true, // Immediate violation
    LOOKING_AWAY_TIMEOUT: 3000, // 3 seconds
    MAX_CONSECUTIVE_VIOLATIONS: 3,
    VIOLATION_COOLDOWN: 2000 // 2 seconds between same violation types
  };

  // Initialize face detection
  useEffect(() => {
    const initializeFaceDetection = async () => {
      try {
        setSecurityStatus('initializing');
        const initialized = await FaceDetectionService.initialize();
        
        if (initialized) {
          setSecurityStatus('ready');
          console.log('Face detection initialized for secure interview');
        } else {
          setSecurityStatus('failed');
          handleSecurityAlert('Face detection initialization failed', 'error');
        }
      } catch (error) {
        console.error('Failed to initialize face detection:', error);
        setSecurityStatus('failed');
        handleSecurityAlert('Face detection setup error', 'error');
      }
    };

    initializeFaceDetection();

    return () => {
      stopMonitoring();
    };
  }, []);

  // Set up video stream
  useEffect(() => {
    if (videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
      
      videoRef.current.onloadedmetadata = () => {
        if (isActive && securityStatus === 'ready') {
          startMonitoring();
        }
      };
    }
  }, [videoStream, isActive, securityStatus]);

  // Start/stop monitoring based on active state
  useEffect(() => {
    if (isActive && securityStatus === 'ready' && videoRef.current) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [isActive, securityStatus]);

  const handleSecurityAlert = useCallback((message, type = 'warning') => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      sessionId
    };

    if (onSecurityAlert) {
      onSecurityAlert(alert);
    }
  }, [sessionId, onSecurityAlert]);

  const handleViolation = useCallback((violation) => {
    const now = Date.now();
    
    // Check violation cooldown
    if (now - lastViolationTime < VIOLATION_THRESHOLDS.VIOLATION_COOLDOWN) {
      return;
    }

    const newViolation = {
      id: `${violation.type}_${now}`,
      type: violation.type,
      severity: violation.severity || 'medium',
      timestamp: now,
      sessionId,
      isHost,
      details: violation.details || {},
      snapshot: violation.snapshot || null
    };

    setViolations(prev => [...prev.slice(-9), newViolation]); // Keep last 10 violations
    setLastViolationTime(now);
    setConsecutiveViolations(prev => prev + 1);

    // Update monitoring stats
    setMonitoringStats(prev => ({
      ...prev,
      violationsDetected: prev.violationsDetected + 1
    }));

    // Handle consecutive violations
    if (consecutiveViolations >= VIOLATION_THRESHOLDS.MAX_CONSECUTIVE_VIOLATIONS) {
      handleSecurityAlert(
        `Multiple consecutive violations detected (${consecutiveViolations + 1})`,
        'error'
      );
      
      // Reset consecutive count after major alert
      setConsecutiveViolations(0);
    }

    // Send violation to parent component
    if (onViolationDetected) {
      onViolationDetected(newViolation);
    }

    // Send security alert for critical violations
    if (violation.severity === 'critical') {
      handleSecurityAlert(
        `Critical security violation: ${violation.type}`,
        'error'
      );
    }

    console.log('Security violation detected:', newViolation);
  }, [sessionId, isHost, lastViolationTime, consecutiveViolations, onViolationDetected]);

  const performFaceDetection = useCallback(async () => {
    if (!videoRef.current || !isMonitoring) {
      return;
    }

    try {
      const result = await FaceDetectionService.detectFaces(videoRef.current);
      
      // Update monitoring stats
      setMonitoringStats(prev => ({
        ...prev,
        totalChecks: prev.totalChecks + 1,
        lastCheckTime: Date.now(),
        faceDetectionRate: result.faces.length > 0 ? 
          ((prev.faceDetectionRate * prev.totalChecks) + 1) / (prev.totalChecks + 1) :
          (prev.faceDetectionRate * prev.totalChecks) / (prev.totalChecks + 1)
      }));

      const faceCount = result.faces.length;
      setFaceCount(faceCount);
      setFaceDetected(faceCount > 0);

      // Check for violations
      if (faceCount === 0) {
        setLookingAway(false);
        
        // No face detected - start timeout
        if (!violationTimeoutRef.current) {
          violationTimeoutRef.current = setTimeout(() => {
            handleViolation({
              type: 'no_face_detected',
              severity: 'high',
              details: { duration: VIOLATION_THRESHOLDS.NO_FACE_TIMEOUT }
            });
            violationTimeoutRef.current = null;
          }, VIOLATION_THRESHOLDS.NO_FACE_TIMEOUT);
        }
      } else if (faceCount > 1) {
        // Multiple faces detected - immediate violation
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
        setLookingAway(false);
        
        handleViolation({
          type: 'multiple_faces_detected',
          severity: 'critical',
          details: { faceCount }
        });
      } else {
        // Single face detected - clear no-face timeout
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
        
        // Check if looking away (simplified gaze detection)
        const face = result.faces[0];
        const isLookingAway = checkGazeDirection(face);
        setLookingAway(isLookingAway);
        
        if (isLookingAway) {
          // Looking away - start timeout
          if (!violationTimeoutRef.current) {
            violationTimeoutRef.current = setTimeout(() => {
              handleViolation({
                type: 'looking_away',
                severity: 'medium',
                details: { duration: VIOLATION_THRESHOLDS.LOOKING_AWAY_TIMEOUT }
              });
              violationTimeoutRef.current = null;
            }, VIOLATION_THRESHOLDS.LOOKING_AWAY_TIMEOUT);
          }
        } else {
          // Looking at camera - clear looking away timeout
          clearTimeout(violationTimeoutRef.current);
          violationTimeoutRef.current = null;
          
          // Reset consecutive violations on good behavior
          if (consecutiveViolations > 0) {
            setConsecutiveViolations(prev => Math.max(0, prev - 1));
          }
        }
      }

      // Draw detection results on canvas
      drawDetectionResults(result.faces);

    } catch (error) {
      console.error('Face detection error:', error);
      handleSecurityAlert('Face detection error occurred', 'warning');
    }
  }, [isMonitoring, consecutiveViolations, handleViolation]);

  const checkGazeDirection = (face) => {
    // Simplified gaze detection based on face landmarks
    if (!face.landmarks) return false;
    
    try {
      const leftEye = face.landmarks.getLeftEye();
      const rightEye = face.landmarks.getRightEye();
      const nose = face.landmarks.getNose();
      
      // Calculate eye center points
      const leftEyeCenter = getCenter(leftEye);
      const rightEyeCenter = getCenter(rightEye);
      const noseCenter = getCenter(nose);
      
      // Simple gaze estimation based on eye-nose alignment
      const eyeDistance = Math.abs(leftEyeCenter.x - rightEyeCenter.x);
      const noseOffset = Math.abs(noseCenter.x - (leftEyeCenter.x + rightEyeCenter.x) / 2);
      
      // If nose is significantly offset from eye center, likely looking away
      return (noseOffset / eyeDistance) > 0.3;
    } catch (error) {
      console.warn('Gaze direction calculation error:', error);
      return false;
    }
  };

  const getCenter = (points) => {
    const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    return { x, y };
  };

  const drawDetectionResults = (faces) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face detection boxes
    faces.forEach((face, index) => {
      const { x, y, width, height } = face.detection.box;
      
      // Choose color based on face count
      const color = faces.length === 1 ? '#00ff00' : '#ff0000';
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw face number
      ctx.fillStyle = color;
      ctx.font = '16px Arial';
      ctx.fillText(`Face ${index + 1}`, x, y - 5);
      
      // Draw landmarks if available
      if (face.landmarks) {
        ctx.fillStyle = color;
        face.landmarks.positions.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  };

  const startMonitoring = useCallback(() => {
    if (isMonitoring || securityStatus !== 'ready') return;
    
    setIsMonitoring(true);
    setSecurityStatus('active');
    
    // Start detection interval
    detectionIntervalRef.current = setInterval(performFaceDetection, 1000);
    
    console.log('Secure interview monitoring started');
    handleSecurityAlert('Security monitoring activated', 'info');
  }, [isMonitoring, securityStatus, performFaceDetection]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    setSecurityStatus('ready');
    
    // Clear intervals and timeouts
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
      violationTimeoutRef.current = null;
    }
    
    console.log('Secure interview monitoring stopped');
  }, [isMonitoring]);

  const getStatusColor = () => {
    switch (securityStatus) {
      case 'active': return faceDetected ? 'text-green-500' : 'text-red-500';
      case 'ready': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (securityStatus) {
      case 'active': return faceDetected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
      case 'ready': return <Shield className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Hidden video element for face detection */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      
      {/* Hidden canvas for drawing detection results */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Security Status Indicator */}
      <div className="absolute top-2 left-2 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black bg-opacity-70 rounded-lg p-2 text-white"
        >
          <div className="flex items-center space-x-2">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div className="text-xs">
              <div className="font-medium">Security Monitor</div>
              <div className={`${getStatusColor()} capitalize`}>
                {securityStatus}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Face Detection Status */}
      {isMonitoring && (
        <div className="absolute top-2 right-2 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black bg-opacity-70 rounded-lg p-2 text-white"
          >
            <div className="flex items-center space-x-2">
              <div className={faceDetected ? 'text-green-500' : 'text-red-500'}>
                {faceDetected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </div>
              <div className="text-xs">
                <div className="font-medium">
                  {faceCount === 0 ? 'No Face' : 
                   faceCount === 1 ? 'Face OK' : 
                   `${faceCount} Faces`}
                </div>
                {lookingAway && (
                  <div className="text-yellow-400">Looking Away</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Violation Alerts */}
      <AnimatePresence>
        {violations.slice(-3).map(violation => (
          <motion.div
            key={violation.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-2 left-2 right-2 z-20"
          >
            <div className={`p-3 rounded-lg shadow-lg ${
              violation.severity === 'critical' ? 'bg-red-600' :
              violation.severity === 'high' ? 'bg-orange-600' :
              'bg-yellow-600'
            } text-white`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <div className="text-sm">
                  <div className="font-medium">Security Violation</div>
                  <div>{violation.type.replace(/_/g, ' ').toUpperCase()}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Monitoring Stats (for hosts) */}
      {isHost && isMonitoring && (
        <div className="absolute bottom-2 right-2 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black bg-opacity-70 rounded-lg p-2 text-white text-xs"
          >
            <div>Checks: {monitoringStats.totalChecks}</div>
            <div>Violations: {monitoringStats.violationsDetected}</div>
            <div>Detection Rate: {Math.round(monitoringStats.faceDetectionRate * 100)}%</div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SecureInterviewMonitor;