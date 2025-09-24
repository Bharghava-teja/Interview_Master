import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle, CheckCircle, User, Shield, Eye } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import FaceDetectionService from '../services/FaceDetectionService';
import { useExamSecurity } from '../contexts/ExamSecurityManager';

const FaceVerificationModal = ({
  isVisible,
  onVerificationComplete,
  onCancel,
  examId,
  onVerificationFailed = null
}) => {
  const webcamRef = useRef(null);
  const { 
    cameraStream, 
    setReferenceDescriptor: setContextReferenceDescriptor, 
    setFaceVerificationComplete, 
    setReferenceImage: setContextReferenceImage 
  } = useExamSecurity();
  
  const [verificationStep, setVerificationStep] = useState('ready'); // 'ready', 'reference_captured', 'verifying', 'completed'
  const [verificationError, setVerificationError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [localReferenceImage, setLocalReferenceImage] = useState(null); // Store first capture as base64
  const [isProcessing, setIsProcessing] = useState(false);
  const [localReferenceDescriptor, setLocalReferenceDescriptor] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const maxVerificationAttempts = 3;

  // Initialize face detection when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      const initializeFaceDetection = async () => {
        try {
          console.log('🔧 Initializing face detection service...');
          const isInitialized = await FaceDetectionService.initialize();
          if (!isInitialized) {
            setVerificationError('Failed to initialize face detection. Please refresh and try again.');
          }
        } catch (error) {
          console.error('Face verification initialization failed:', error);
          setVerificationError(`Face verification initialization failed: ${error.message}. Please check your internet connection and refresh the page.`);
        }
      };
      
      initializeFaceDetection();
    }
  }, [isVisible]);

  const detectSingleFace = useCallback(async () => {
    try {
      if (!webcamRef.current) {
        throw new Error('Webcam not available');
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image from webcam');
      }

      // Create image element for face detection
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // Detect face and get descriptor
      const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('No face detected');
      }

      return {
        descriptor: detection.descriptor,
        imageSrc: imageSrc
      };
    } catch (error) {
      console.error('Face detection error:', error);
      throw error;
    }
  }, []);

  const handleCaptureReference = useCallback(async () => {
    try {
      setIsProcessing(true);
      setVerificationError(null);
      setVerificationMessage('');
      
      console.log('📸 Capturing reference image...');
      
      const faceData = await detectSingleFace();
      
      // Store reference image and descriptor locally
      setLocalReferenceImage(faceData.imageSrc);
      setLocalReferenceDescriptor(faceData.descriptor);
      setVerificationStep('reference_captured');
      setVerificationMessage('✅ Reference image captured! Now click "Verify" to verify your identity.');
      console.log('✅ Reference face captured and stored');
      
    } catch (error) {
      console.error('❌ Reference capture error:', error);
      
      if (error.message === 'No face detected') {
        setVerificationMessage('❌ No face detected');
        setVerificationError('Please ensure your face is clearly visible to the camera and try again.');
      } else {
        setVerificationError(`Reference capture failed: ${error.message}`);
      }
      
      // Handle capture failure with retry logic
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);
      
      if (newAttempts >= maxVerificationAttempts) {
        if (onVerificationFailed) {
          onVerificationFailed('Maximum capture attempts exceeded');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [detectSingleFace, verificationAttempts, maxVerificationAttempts, onVerificationFailed]);

  const handleVerifyNow = useCallback(async () => {
    try {
      setIsProcessing(true);
      setVerificationStep('verifying');
      setVerificationError(null);
      setVerificationMessage('');
      
      console.log('🔍 Starting face verification against reference...');
      
      const faceData = await detectSingleFace();
      
      if (!localReferenceDescriptor) {
        setVerificationError('No reference image found. Please capture reference first.');
        return;
      }
      
      // Compare against reference
      console.log('🔍 Comparing against reference face...');
      const distance = faceapi.euclideanDistance(localReferenceDescriptor, faceData.descriptor);
      console.log('Face comparison distance:', distance);
      
      if (distance < 0.6) {
        // Face verified
        setIsVerified(true);
        setCapturedImage(faceData.imageSrc);
        setVerificationMessage('✅ Verification Successful');
        console.log('✅ Face verification successful - distance:', distance);
        
        // Complete verification after a short delay
        setTimeout(() => {
          setVerificationStep('completed');
          
          // Store reference descriptor in ExamSecurityManager context
          setContextReferenceDescriptor(localReferenceDescriptor);
          setFaceVerificationComplete(true);
          setContextReferenceImage(localReferenceImage);
          
          if (onVerificationComplete) {
            onVerificationComplete({
              referenceImage: localReferenceImage,
              liveImage: faceData.imageSrc,
              captureTimestamp: Date.now(),
              examId,
              isVerified: true,
              verificationDistance: distance,
              referenceFaceSet: true
            });
          }
        }, 1500);
      } else {
        // Face mismatch
        setVerificationMessage('❌ Verification Failed. Try Again.');
        setVerificationError(`Face does not match reference (distance: ${distance.toFixed(3)})`);
        console.log('❌ Face verification failed - distance:', distance);
      }
      
    } catch (error) {
      console.error('❌ Face verification error:', error);
      
      if (error.message === 'No face detected') {
        setVerificationMessage('❌ No face detected');
        setVerificationError('Please ensure your face is clearly visible to the camera and try again.');
      } else {
        setVerificationError(`Face verification failed: ${error.message}`);
      }
      
      // Handle verification failure with retry logic
      const newAttempts = verificationAttempts + 1;
      setVerificationAttempts(newAttempts);
      
      if (newAttempts >= maxVerificationAttempts) {
        if (onVerificationFailed) {
          onVerificationFailed('Maximum verification attempts exceeded');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [detectSingleFace, localReferenceDescriptor, verificationAttempts, maxVerificationAttempts, examId, onVerificationComplete, onVerificationFailed]);






  const retryVerification = () => {
    setVerificationError(null);
    setCapturedImage(null);
    setVerificationStep('ready');
    setLocalReferenceDescriptor(null);
    setLocalReferenceImage(null);
    setIsVerified(false);
    setVerificationMessage('');
  };

  const getStepIcon = () => {
    switch (verificationStep) {
      case 'permission':
        return <Camera className="h-8 w-8 text-blue-600" />;
      case 'positioning':
        return <Eye className="h-8 w-8 text-blue-600" />;
      case 'capturing':
      case 'verifying':
        return <Shield className="h-8 w-8 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      default:
        return <User className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStepTitle = () => {
    switch (verificationStep) {
      case 'ready':
        return localReferenceDescriptor ? 'Ready to Verify' : 'Capture Reference Image';
      case 'reference_captured':
        return 'Ready to Verify';
      case 'verifying':
        return 'Verifying Identity';
      case 'completed':
        return 'Verification Complete';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Face Verification';
    }
  };

  const getInstructions = () => {
    switch (verificationStep) {
      case 'ready':
        return localReferenceDescriptor 
          ? 'Reference captured! Now click "Verify" to verify your identity.'
          : 'Position your face in the center of the camera and click "Capture Reference" to begin.';
      case 'reference_captured':
        return 'Reference image captured! Now click "Verify" to verify your identity.';
      case 'verifying':
        return 'Please hold still while we verify your identity...';
      case 'completed':
        return 'Face verification completed successfully!';
      case 'failed':
        return 'Verification failed. Please try again.';
      default:
        return 'Preparing face verification...';
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  {getStepIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    {getStepTitle()}
                  </h2>
                  <p className="text-blue-700 text-sm">
                    {getInstructions()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Camera View */}
            <div className="mb-6">
              <div className="relative mb-6">
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                 <Webcam
                   ref={webcamRef}
                   className="w-full h-full object-cover"
                   videoConstraints={{
                     width: 640,
                     height: 480,
                     facingMode: 'user',
                     deviceId: cameraStream ? { exact: cameraStream.getVideoTracks()[0]?.getSettings()?.deviceId } : undefined
                   }}
                   screenshotFormat="image/jpeg"
                   screenshotQuality={0.8}
                   videoStream={cameraStream}
                 />
                 
                 {/* Processing overlay */}
                 {isProcessing && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                     <div className="text-white text-center">
                       <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                       <p className="text-lg">Processing...</p>
                     </div>
                   </div>
                 )}
                </div>
                
               {/* Verification Message */}
               {verificationMessage && (
                 <div className="mt-4 text-center">
                   <p className="text-lg font-medium">{verificationMessage}</p>
                 </div>
               )}
              </div>

              {/* Captured Image Preview */}
              {capturedImage && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Captured Image</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {verificationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Verification Error</h3>
                    <p className="text-red-700 text-sm">{verificationError}</p>
                    {verificationAttempts < maxVerificationAttempts && (
                      <p className="text-red-600 text-xs mt-2">
                        Attempt {verificationAttempts + 1} of {maxVerificationAttempts}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800 mb-1">Verification Successful</h3>
                    <p className="text-green-700 text-sm">Your identity has been verified successfully.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <div className="flex space-x-3">
                {verificationError && (
                  <button
                    onClick={retryVerification}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    disabled={isProcessing}
                  >
                    Retry
                  </button>
                )}
                
                {verificationStep === 'ready' && !localReferenceDescriptor && (
                  <button
                    onClick={handleCaptureReference}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Capture Reference'}
                  </button>
                )}

                {((verificationStep === 'ready' && localReferenceDescriptor) || verificationStep === 'reference_captured') && (
                   <button
                     onClick={handleVerifyNow}
                     className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                     disabled={isProcessing}
                   >
                     {isProcessing ? 'Processing...' : 'Verify'}
                   </button>
                 )}

                 {verificationStep === 'completed' && (
                   <button
                     disabled
                     className="bg-green-600 cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                   >
                     <CheckCircle className="h-4 w-4" />
                     <span>Verification Complete</span>
                   </button>
                 )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FaceVerificationModal;