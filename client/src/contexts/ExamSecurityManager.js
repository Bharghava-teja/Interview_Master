import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const ExamSecurityContext = createContext();

export const useExamSecurity = () => {
  const context = useContext(ExamSecurityContext);
  if (!context) {
    throw new Error('useExamSecurity must be used within ExamSecurityProvider');
  }
  return context;
};

export const ExamSecurityProvider = ({ children }) => {
  // Stream states
  const [cameraStream, setCameraStream] = useState(null);
  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  
  // Permission states
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [screenSharePermissionGranted, setScreenSharePermissionGranted] = useState(false);
  const [fullscreenPermissionGranted, setFullscreenPermissionGranted] = useState(false);
  
  // Global permission tracking - tracks when all permissions were granted via "Grant All Permissions" button
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  
  // Error states
  const [cameraError, setCameraError] = useState(null);
  const [microphoneError, setMicrophoneError] = useState(null);
  const [screenShareError, setScreenShareError] = useState(null);
  
  // Request states
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [isRequestingScreenShare, setIsRequestingScreenShare] = useState(false);
  
  // Security monitoring
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Face verification
  const [referenceDescriptor, setReferenceDescriptor] = useState(null);
  const [faceVerificationComplete, setFaceVerificationComplete] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  
  // Refs for cleanup
  const cameraStreamRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const visibilityChangeCountRef = useRef(0);
  const lastVisibilityChangeRef = useRef(Date.now());
  
  // Centralized permission granting function
  const grantAllPermissions = useCallback(async () => {
    console.log('🚀 Starting centralized permission request...');
    
    // Check if permissions are already granted
    if (allPermissionsGranted) {
      console.log('⚠️ Duplicate Grant All Permissions prevented - permissions already granted');
      return {
        camera: cameraPermissionGranted,
        mic: microphonePermissionGranted,
        screen: screenSharePermissionGranted
      };
    }
    
    // Reset all error states
    setCameraError(null);
    setMicrophoneError(null);
    setScreenShareError(null);
    
    // Set requesting states
    setIsRequestingCamera(true);
    setIsRequestingMicrophone(true);
    setIsRequestingScreenShare(true);
    
    const results = {
      camera: false,
      mic: false,
      screen: false
    };
    
    try {
      // Request camera + microphone together
      console.log('📹 Requesting camera and microphone access...');
      const cameraAndMicStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true 
      });
      
      // Split the stream into separate camera and microphone streams
      const videoTracks = cameraAndMicStream.getVideoTracks();
      const audioTracks = cameraAndMicStream.getAudioTracks();
      
      if (videoTracks.length > 0) {
        const cameraOnlyStream = new MediaStream(videoTracks);
        cameraStreamRef.current = cameraOnlyStream;
        setCameraStream(cameraOnlyStream);
        setCameraPermissionGranted(true);
        results.camera = true;
        console.log('✅ Camera permission granted');
      }
      
      if (audioTracks.length > 0) {
        const micOnlyStream = new MediaStream(audioTracks);
        microphoneStreamRef.current = micOnlyStream;
        setMicrophoneStream(micOnlyStream);
        setMicrophonePermissionGranted(true);
        results.mic = true;
        console.log('✅ Microphone permission granted');
      }
      
    } catch (error) {
      console.error('❌ Camera/Microphone access denied:', error);
      setCameraError('Camera/Microphone access denied. Please enable permissions.');
      setMicrophoneError('Camera/Microphone access denied. Please enable permissions.');
      setCameraPermissionGranted(false);
      setMicrophonePermissionGranted(false);
    }
    
    try {
      // Request screen share
      console.log('🖥️ Requesting screen share access...');
      const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      screenStreamRef.current = screenShareStream;
      setScreenStream(screenShareStream);
      setScreenSharePermissionGranted(true);
      results.screen = true;
      console.log('✅ Screen share permission granted');
      
      // Listen for stream end (user stops sharing)
      screenShareStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('🛑 Screen share ended by user');
        stopScreenShare();
      });
      
    } catch (error) {
      console.error('❌ Screen share denied:', error);
      setScreenShareError('Screen share denied. Please allow screen sharing.');
      setScreenSharePermissionGranted(false);
    }
    
    // Reset requesting states
    setIsRequestingCamera(false);
    setIsRequestingMicrophone(false);
    setIsRequestingScreenShare(false);
    
    // Set global permission granted flag if all permissions were successful
    if (results.camera && results.mic && results.screen) {
      setAllPermissionsGranted(true);
      console.log('🎉 ✅ All permissions granted successfully!');
      toast.success('All permissions granted successfully!');
    } else {
      console.log('⚠️ Some permissions were denied:', results);
    }
    
    console.log('📊 Permission request completed:', results);
    return results;
  }, [allPermissionsGranted, cameraPermissionGranted, microphonePermissionGranted, screenSharePermissionGranted]);

  // Camera management (legacy - kept for backward compatibility)
  const startCamera = useCallback(async () => {
    // If all permissions were granted centrally, use existing stream
    if (allPermissionsGranted && cameraStream) {
      console.log('▶ Using existing camera stream from centralized permissions');
      return cameraStream;
    }
    
    if (cameraStream && cameraPermissionGranted) {
      console.log('Camera already active, reusing existing stream');
      return cameraStream;
    }
    
    if (isRequestingCamera) {
      console.log('Camera request already in progress');
      return null;
    }
    
    // Warn about potential duplicate permission request
    if (allPermissionsGranted) {
      console.log('⚠️ Camera request after centralized permissions - this should not happen');
    }
    
    setIsRequestingCamera(true);
    setCameraError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraPermissionGranted(true);
      console.log('Camera stream started successfully');
      
      return stream;
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please enable camera permissions.');
      setCameraPermissionGranted(false);
      return null;
    } finally {
      setIsRequestingCamera(false);
    }
  }, [cameraStream, cameraPermissionGranted, isRequestingCamera, allPermissionsGranted]);
  
  // Microphone management
  const startMicrophone = useCallback(async () => {
    // If all permissions were granted centrally, use existing stream
    if (allPermissionsGranted && microphoneStream) {
      console.log('▶ Using existing microphone stream from centralized permissions');
      return microphoneStream;
    }
    
    if (microphoneStream && microphonePermissionGranted) {
      console.log('Microphone already active, reusing existing stream');
      return microphoneStream;
    }
    
    if (isRequestingMicrophone) {
      console.log('Microphone request already in progress');
      return null;
    }
    
    // Warn about potential duplicate permission request
    if (allPermissionsGranted) {
      console.log('⚠️ Microphone request after centralized permissions - this should not happen');
    }
    
    setIsRequestingMicrophone(true);
    setMicrophoneError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      microphoneStreamRef.current = stream;
      setMicrophoneStream(stream);
      setMicrophonePermissionGranted(true);
      console.log('Microphone stream started successfully');
      
      return stream;
    } catch (error) {
      console.error('Microphone access denied:', error);
      setMicrophoneError('Microphone access denied. Please enable microphone permissions.');
      setMicrophonePermissionGranted(false);
      return null;
    } finally {
      setIsRequestingMicrophone(false);
    }
  }, [microphoneStream, microphonePermissionGranted, isRequestingMicrophone, allPermissionsGranted]);
  
  // Screen share management
  const startScreenShare = useCallback(async () => {
    // If all permissions were granted centrally, use existing stream
    if (allPermissionsGranted && screenStream) {
      console.log('▶ Using existing screen share stream from centralized permissions');
      return screenStream;
    }
    
    if (screenStream && screenSharePermissionGranted) {
      console.log('Screen share already active, reusing existing stream');
      return screenStream;
    }
    
    if (isRequestingScreenShare) {
      console.log('Screen share request already in progress');
      return null;
    }
    
    // Warn about potential duplicate permission request
    if (allPermissionsGranted) {
      console.log('⚠️ Screen share request after centralized permissions - this should not happen');
    }
    
    setIsRequestingScreenShare(true);
    setScreenShareError(null);
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setScreenSharePermissionGranted(true);
      console.log('Screen share started successfully');
      
      // Listen for stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen share ended by user');
        stopScreenShare();
      });
      
      return stream;
    } catch (error) {
      console.error('Screen share denied:', error);
      setScreenShareError('Screen share denied. Please allow screen sharing.');
      setScreenSharePermissionGranted(false);
      return null;
    } finally {
      setIsRequestingScreenShare(false);
    }
  }, [screenStream, screenSharePermissionGranted, isRequestingScreenShare, allPermissionsGranted]);
  
  // Fullscreen management
  const requestFullscreen = useCallback(async () => {
    if (fullscreenPermissionGranted && document.fullscreenElement) {
      console.log('Already in fullscreen mode');
      return true;
    }
    
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenPermissionGranted(true);
      console.log('Fullscreen mode activated');
      return true;
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      return false;
    }
  }, [fullscreenPermissionGranted]);
  
  // Stop functions
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
    setCameraPermissionGranted(false);
    setCameraError(null);
    console.log('Camera stream stopped');
  }, []);
  
  const stopMicrophone = useCallback(() => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    setMicrophoneStream(null);
    setMicrophonePermissionGranted(false);
    setMicrophoneError(null);
    console.log('Microphone stream stopped');
  }, []);
  
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setScreenSharePermissionGranted(false);
    setScreenShareError(null);
    console.log('Screen share stopped');
  }, []);
  
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setFullscreenPermissionGranted(false);
    console.log('Exited fullscreen mode');
  }, []);
  
  // Security violation logging
  const logViolation = useCallback((type, description, severity = 'medium') => {
    const violation = {
      id: Date.now() + Math.random(),
      type,
      description,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    setViolations(prev => [...prev, violation]);
    console.warn('Security Violation:', violation);
    
    // Show toast notification for high severity violations
    if (severity === 'high') {
      toast.error(`Security Alert: ${description}`);
    }
    
    return violation;
  }, []);
  
  // Show security warning
  const showWarning = useCallback((message, duration = 5000) => {
    setWarningMessage(message);
    setShowSecurityWarning(true);
    
    setTimeout(() => {
      setShowSecurityWarning(false);
      setWarningMessage('');
    }, duration);
  }, []);
  
  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (!isMonitoring) return;
    
    const now = Date.now();
    const timeSinceLastChange = now - lastVisibilityChangeRef.current;
    
    // Only count if enough time has passed (prevent rapid fire events)
    if (timeSinceLastChange > 2000) {
      visibilityChangeCountRef.current += 1;
      lastVisibilityChangeRef.current = now;
      
      if (document.visibilityState === 'hidden') {
        logViolation(
          'tab_switch',
          `User switched away from the interview tab (occurrence #${visibilityChangeCountRef.current})`,
          'high'
        );
        
        // Show warning when user returns
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            showWarning('Security Warning: Tab switching detected during interview');
          }
        }, 500);
      }
    }
  }, [isMonitoring, logViolation, showWarning]);
  
  // Handle fullscreen change
  const handleFullscreenChange = useCallback(() => {
    if (!isMonitoring) return;
    
    if (!document.fullscreenElement && fullscreenPermissionGranted) {
      logViolation(
        'fullscreen_exit',
        'User exited fullscreen mode during interview',
        'high'
      );
      setFullscreenPermissionGranted(false);
      showWarning('Security Warning: Fullscreen mode is required for the interview');
    }
  }, [isMonitoring, fullscreenPermissionGranted, logViolation, showWarning]);
  
  // Start security monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) {
      console.log('Security monitoring already active');
      return;
    }
    
    setIsMonitoring(true);
    console.log('Security monitoring started');
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Reset violation counters
    visibilityChangeCountRef.current = 0;
    lastVisibilityChangeRef.current = Date.now();
  }, [isMonitoring, handleVisibilityChange, handleFullscreenChange]);
  
  // Stop security monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    console.log('Security monitoring stopped');
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    
    // Clear intervals
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [isMonitoring, handleVisibilityChange, handleFullscreenChange]);
  
  // Initialize all permissions
  const initializeAllPermissions = useCallback(async () => {
    console.log('Initializing all permissions...');
    
    const results = await Promise.allSettled([
      startCamera(),
      startMicrophone(),
      startScreenShare(),
      requestFullscreen()
    ]);
    
    const [cameraResult, micResult, screenResult, fullscreenResult] = results;
    
    const success = {
      camera: cameraResult.status === 'fulfilled' && cameraResult.value,
      microphone: micResult.status === 'fulfilled' && micResult.value,
      screenShare: screenResult.status === 'fulfilled' && screenResult.value,
      fullscreen: fullscreenResult.status === 'fulfilled' && fullscreenResult.value
    };
    
    console.log('Permission initialization results:', success);
    
    return success;
  }, [startCamera, startMicrophone, startScreenShare, requestFullscreen]);
  
  // Cleanup all resources
  const cleanup = useCallback(() => {
    console.log('Cleaning up exam security manager...');
    
    stopMonitoring();
    stopCamera();
    stopMicrophone();
    stopScreenShare();
    exitFullscreen();
    
    // Reset states
    setViolations([]);
    setShowSecurityWarning(false);
    setWarningMessage('');
  }, [stopMonitoring, stopCamera, stopMicrophone, stopScreenShare, exitFullscreen]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  const value = {
    // Streams
    cameraStream,
    microphoneStream,
    screenStream,
    
    // Permissions
    cameraPermissionGranted,
    microphonePermissionGranted,
    screenSharePermissionGranted,
    fullscreenPermissionGranted,
    allPermissionsGranted,
    permissions: {
      camera: cameraPermissionGranted,
      mic: microphonePermissionGranted,
      screen: screenSharePermissionGranted
    },
    
    // Errors
    cameraError,
    microphoneError,
    screenShareError,
    
    // Request states
    isRequestingCamera,
    isRequestingMicrophone,
    isRequestingScreenShare,
    
    // Stream management
    startCamera,
    startMicrophone,
    startScreenShare,
    requestFullscreen,
    stopCamera,
    stopMicrophone,
    stopScreenShare,
    exitFullscreen,
    
    // Centralized permission management
    grantAllPermissions,
    
    // Security monitoring
    violations,
    isMonitoring,
    showSecurityWarning,
    warningMessage,
    logViolation,
    showWarning,
    startMonitoring,
    stopMonitoring,
    
    // Face verification
    referenceDescriptor,
    faceVerificationComplete,
    referenceImage,
    setReferenceDescriptor,
    setFaceVerificationComplete,
    setReferenceImage,
    clearReferenceDescriptor: () => {
      setReferenceDescriptor(null);
      setFaceVerificationComplete(false);
      setReferenceImage(null);
    },
    
    // Utilities
    initializeAllPermissions,
    cleanup
  };
  
  return (
    <ExamSecurityContext.Provider value={value}>
      {children}
    </ExamSecurityContext.Provider>
  );
};

export default ExamSecurityProvider;