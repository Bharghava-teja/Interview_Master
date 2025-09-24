import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import * as faceapi from 'face-api.js';
import FaceDetectionService from '../services/FaceDetectionService';
import FaceVerificationModal from './FaceVerificationModal';
import { useExamSecurity } from '../contexts/ExamSecurityManager';



const WebcamMonitor = ({ 
  onViolationDetected, 
  examId, 
  isActive = false,
  onPermissionGranted,
  onPermissionDenied
}) => {
  const { 
    cameraStream, 
    cameraPermissionGranted, 
    cameraError,
    stopCamera,
    referenceDescriptor,
    faceVerificationComplete,
    clearReferenceDescriptor 
  } = useExamSecurity();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const faceDetectionModelRef = useRef(null);
  
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [faceDetected, setFaceDetected] = useState(false);

  const [lookingAway, setLookingAway] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState('unknown'); // 'verified', 'unverified', 'no_face', 'looking_away'
  const [lastFaceCheckTime, setLastFaceCheckTime] = useState(Date.now());
  const [noFaceStartTime, setNoFaceStartTime] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Handle violations with backend logging
  const handleViolation = useCallback(async (violation) => {
    const newViolation = {
      ...violation,
      id: `${violation.type}_${Date.now()}`,
      timestamp: violation.timestamp || Date.now(),
      examId
    };
    
    setViolations(prev => [...prev, newViolation]);
    
    // Send violation to backend API
    try {
      const response = await fetch('/api/exam/violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId: newViolation.examId,
          type: newViolation.type,
          timestamp: newViolation.timestamp,
          details: newViolation.details,
          severity: newViolation.severity,
          snapshot: newViolation.snapshot || null
        })
      });
      
      if (!response.ok) {
        console.error('Failed to log violation to backend:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending violation to backend:', error);
    }
    
    if (onViolationDetected) {
      onViolationDetected(newViolation);
    }
  }, [examId, onViolationDetected]);

  // Handle face detection results
  const handleFaceDetectionResult = useCallback((result) => {
    setFaceDetected(result.faceCount > 0);

    setLookingAway(!result.lookingAtCamera);
    setMultipleFaces(result.faceCount > 1);
    
    // Update violation state
    if (result.faceCount === 0) {
      handleViolation({ type: 'no_face_detected', severity: 'medium' });
    } else if (result.faceCount > 1) {
      handleViolation({ type: 'multiple_faces', severity: 'critical' });
    } else if (!result.lookingAtCamera) {
      handleViolation({ type: 'looking_away', severity: 'low' });
    }
  }, [handleViolation]);

  // Face detection configuration
  const DETECTION_CONFIG = {
    faceDetectionInterval: 1000, // Check every second
    eyeTrackingInterval: 500, // Check eye movement every 500ms
    lookAwayThreshold: 3000, // 3 seconds of looking away triggers violation
    noFaceThreshold: 5000, // 5 seconds without face triggers violation
    multipleFaceThreshold: 2000, // 2 seconds with multiple faces triggers violation
  };

  // Initialize webcam using provided stream (no direct permission requests)
  const initializeWebcam = useCallback(async () => {
    try {
      setIsModelLoading(true);
      
      // Check if camera stream is already available
      if (cameraStream && cameraPermissionGranted) {
        setPermissionStatus('granted');
        
        if (onPermissionGranted) {
          onPermissionGranted();
        }

        // Initialize face detection service
        await FaceDetectionService.initialize();
      } else {
        // No camera stream available - user needs to grant permissions first
        setPermissionStatus('denied');
        setModelError('Camera permission required. Please use the "Grant All Permissions" button to enable camera access.');
        
        if (onPermissionDenied) {
          onPermissionDenied(new Error('Camera permission required. Please use the "Grant All Permissions" button to enable camera access.'));
        }
      }
      
    } catch (error) {
      console.error('Webcam initialization failed:', error);
      setPermissionStatus('denied');
      setModelError(error.message);
      
      if (onPermissionDenied) {
        onPermissionDenied(error);
      }
    } finally {
      setIsModelLoading(false);
    }
  }, [cameraStream, cameraPermissionGranted, onPermissionGranted, onPermissionDenied]);

  // Get severity level for violation type
  const getSeverityLevel = useCallback((type) => {
    switch (type) {
      case 'multiple_faces':
        return 'critical';
      case 'no_face_detected':
        return 'high';
      case 'looking_away':
        return 'medium';
      default:
        return 'low';
    }
  }, []);

  // Log violation
  const logViolation = useCallback((type, details) => {
    const violation = {
      type,
      details,
      severity: getSeverityLevel(type)
    };
    
    handleViolation(violation);
  }, [getSeverityLevel, handleViolation]);

  // Process face detection results
  const processFaceDetectionResults = useCallback((faces) => {
    const currentTime = Date.now();
    
    // Check for face presence
    const hasFace = faces.length > 0;
    setFaceDetected(hasFace);
    
    // Check for multiple faces
    const hasMultipleFaces = faces.length > 1;
    setMultipleFaces(hasMultipleFaces);
    
    // Simulate eye detection (in real implementation, you'd analyze eye regions)
    if (hasFace) {
      // Basic eye detection simulation
      const eyesVisible = Math.random() > 0.1; // 90% chance eyes are visible when face is detected
      
      
      // Simulate looking away detection
      const isLookingAway = Math.random() > 0.8; // 20% chance of looking away
      setLookingAway(isLookingAway);
      
      if (isLookingAway && onViolationDetected) {
        logViolation('looking_away', {
          timestamp: currentTime,
          duration: DETECTION_CONFIG.lookAwayThreshold
        });
      }
    } else {
      
      setLookingAway(false);
      
      if (onViolationDetected) {
        logViolation('no_face_detected', {
          timestamp: currentTime,
          duration: DETECTION_CONFIG.noFaceThreshold
        });
      }
    }
    
    if (hasMultipleFaces && onViolationDetected) {
      logViolation('multiple_faces', {
        timestamp: currentTime,
        faceCount: faces.length
      });
    }
  }, [onViolationDetected, DETECTION_CONFIG.lookAwayThreshold, DETECTION_CONFIG.noFaceThreshold, logViolation]);

  // Perform face detection with reference comparison
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isWebcamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const currentTime = Date.now();
      
      // Detect faces with descriptors
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      const faceCount = detections.length;
      setFaceDetected(faceCount > 0);
      setMultipleFaces(faceCount > 1);
      
      // Check for multiple faces violation
      if (faceCount > 1) {
        handleViolation({
          type: 'multiple_faces',
          severity: 'critical',
          examId,
          details: {
            faceCount,
            timestamp: currentTime
          }
        });
        setFaceVerificationStatus('unverified');
        return;
      }
      
      // Check for no face detected
      if (faceCount === 0) {
        if (!noFaceStartTime) {
          setNoFaceStartTime(currentTime);
        } else if (currentTime - noFaceStartTime > 5000) { // 5 seconds
          handleViolation({
            type: 'no_face_detected',
            severity: 'medium',
            examId,
            details: {
              duration: currentTime - noFaceStartTime,
              timestamp: currentTime
            }
          });
        }
        setFaceVerificationStatus('no_face');
        return;
      } else {
        setNoFaceStartTime(null);
      }
      
      // Single face detected - check if looking away
      const detection = detections[0];
      const landmarks = detection.landmarks;
      
      // Simple looking away detection based on face angle
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      
      // Calculate if looking away (simplified)
      const eyeDistance = Math.abs(leftEye[0].x - rightEye[0].x);
      const isLookingAway = eyeDistance < 30; // Threshold for looking away
      
      setLookingAway(isLookingAway);
      
      if (isLookingAway) {
        handleViolation({
          type: 'looking_away',
          severity: 'low',
          examId,
          details: {
            timestamp: currentTime
          }
        });
        setFaceVerificationStatus('looking_away');
        return;
      }
      
      // Face matching with reference descriptor
      if (faceVerificationComplete && referenceDescriptor && detection.descriptor) {
        const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
        
        if (distance < 0.6) {
          // Face matches reference
          setFaceVerificationStatus('verified');
        } else {
          // Face mismatch - CRITICAL violation
          handleViolation({
            type: 'face_mismatch',
            severity: 'critical',
            examId,
            details: {
              distance,
              threshold: 0.6,
              timestamp: currentTime
            },
            autoSubmit: true // This should trigger exam termination
          });
          setFaceVerificationStatus('unverified');
        }
      } else if (!faceVerificationComplete) {
        // Face verification not completed yet
        setFaceVerificationStatus('unknown');
      }
      
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [isWebcamActive, handleViolation, examId, faceVerificationComplete, referenceDescriptor, noFaceStartTime]);



  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, DETECTION_CONFIG.faceDetectionInterval);
  }, [detectFaces, DETECTION_CONFIG.faceDetectionInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    stopCamera();
    setIsWebcamActive(false);
    stopMonitoring();
  }, [stopCamera, stopMonitoring]);

  // Effect to handle stream changes from ExamSecurityManager
  useEffect(() => {
    if (cameraStream) {
      // Check if camera stream has active video tracks
      const videoTracks = cameraStream.getVideoTracks();
      const isCameraActive = videoTracks.length > 0 && videoTracks.some(track => track.readyState === "live");
      
      if (isCameraActive) {
        setIsWebcamActive(true);
        setPermissionStatus('granted');
        
        // Set up stream inactive handler to reset state when user manually stops sharing
        cameraStream.oninactive = () => {
  
          setIsWebcamActive(false);
          setPermissionStatus('prompt');
        };
        
        // Set up individual track ended handlers
        videoTracks.forEach(track => {
          track.onended = () => {
    
            // Re-check all tracks to see if any are still live
            const remainingLiveTracks = cameraStream.getVideoTracks().filter(t => t.readyState === "live");
            if (remainingLiveTracks.length === 0) {
              setIsWebcamActive(false);
              setPermissionStatus('denied');
            }
          };
        });
        
        if (videoRef.current) {
          streamRef.current = cameraStream;
          videoRef.current.srcObject = cameraStream;
          
          // Handle play() promise to prevent interruption errors
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn('Video play interrupted:', error);
              // Retry play after a short delay if needed
              setTimeout(() => {
                if (videoRef.current && videoRef.current.srcObject) {
                  videoRef.current.play().catch(e => {
                    console.warn('Video play retry failed:', e);
                  });
                }
              }, 100);
            });
          }
        }
        
        // Call permission granted callback
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else {
        // Stream exists but no live tracks
        setIsWebcamActive(false);
        setPermissionStatus('denied');
        if (onPermissionDenied) {
          onPermissionDenied('No live video tracks available');
        }
      }
    } else {
      // No camera stream
      setIsWebcamActive(false);
      if (!cameraError) {
        setPermissionStatus('prompt');
      } else {
        setPermissionStatus('denied');
        if (onPermissionDenied) {
          onPermissionDenied(cameraError);
        }
      }
    }
  }, [cameraStream, cameraError, onPermissionGranted, onPermissionDenied]);

  // Effect to handle active state changes
  useEffect(() => {
    if (isActive && permissionStatus === 'granted' && isWebcamActive) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return () => stopMonitoring();
  }, [isActive, permissionStatus, isWebcamActive, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // Get status color
  const getStatusColor = () => {
    if (!isWebcamActive) return 'text-gray-500';
    if (multipleFaces) return 'text-red-500';
    if (!faceDetected) return 'text-orange-500';
    if (lookingAway) return 'text-yellow-500';
    if (faceVerificationComplete && faceVerificationStatus === 'unverified') return 'text-red-500';
    if (faceVerificationComplete && faceVerificationStatus === 'verified') return 'text-green-500';
    return 'text-blue-500';
  };

  // Get status message
  const getStatusMessage = () => {
    if (!isWebcamActive) return 'Webcam inactive';
    if (multipleFaces) return 'Multiple faces detected';
    if (!faceDetected) return 'No face detected';
    if (lookingAway) return 'Looking away detected';
    if (faceVerificationComplete && faceVerificationStatus === 'unverified') return 'Face verification failed';
    if (faceVerificationComplete && faceVerificationStatus === 'verified') return 'Face verified';
    return 'Monitoring active';
  };

  return (
    <div className="webcam-monitor bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Webcam Monitor
        </h3>
        
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {isWebcamActive ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>
      </div>

      {/* Video and Canvas Container */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          className="w-full h-48 bg-gray-900 rounded-lg object-cover"
          muted
          playsInline
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Overlay indicators */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <AnimatePresence>
            {/* Face Verification Status */}
            {faceVerificationComplete && faceVerificationStatus === 'verified' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                Verified Face
              </motion.div>
            )}
            
            {faceVerificationComplete && faceVerificationStatus === 'unverified' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Unverified Face
              </motion.div>
            )}
            
            {!faceDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                No face detected
              </motion.div>
            )}
            
            {lookingAway && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium"
              >
                Looking away
              </motion.div>
            )}
            
            {multipleFaces && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Multiple Faces
              </motion.div>
            )}
            
            {lookingAway && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Looking Away
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {permissionStatus === 'prompt' && (
            <button
              onClick={initializeWebcam}
              disabled={isModelLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isModelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Loading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Enable Webcam
                </>
              )}
            </button>
          )}
          
          {isWebcamActive && (
            <button
              onClick={stopWebcam}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <CameraOff className="h-4 w-4" />
              Stop Webcam
            </button>
          )}
          
          {faceVerificationComplete && isWebcamActive && (
            <button
              onClick={() => {
                clearReferenceDescriptor();
                setShowVerificationModal(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Re-Verify
            </button>
          )}
        </div>
        
        {/* Violation count */}
        {violations.length > 0 && (
          <div className="text-sm text-red-600 font-medium">
            {violations.length} violation{violations.length !== 1 ? 's' : ''} detected
          </div>
        )}
      </div>

      {/* Error message */}
      {modelError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error: {modelError}</span>
          </div>
        </div>
      )}

      {/* Permission denied message */}
      {permissionStatus === 'denied' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Webcam access denied</p>
              <p className="text-xs mt-1">Please enable camera permissions to use proctoring features.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamMonitor;