import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.isInitialized = false;
    this.detectionInterval = null;
    this.violationCallbacks = [];
    this.lastDetectionTime = null;
    this.consecutiveViolations = 0;
    this.maxConsecutiveViolations = 3;
    this.lastNoFaceTime = 0;
    this.lastErrorTime = 0;
    this.referenceFaceDescriptor = null; // Store reference face descriptor
    this.faceMatchThreshold = 0.6; // Euclidean distance threshold for face matching
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('🔄 Face detection service already initialized');
      return this.verifyModelsLoaded();
    }
    
    try {
      console.log('🚀 Starting face detection service initialization...');
      
      // Load face-api.js models from multiple CDN sources for reliability
      const MODEL_URLS = [
        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model',
        'https://justadudewhohacks.github.io/face-api.js/weights',
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      ];
      
      let modelsLoaded = false;
      let lastError = null;
      
      for (const MODEL_URL of MODEL_URLS) {
        try {
          console.log(`🔄 Attempting to load face detection models from: ${MODEL_URL}`);
          
          // Add timeout to prevent hanging
          const loadPromise = Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
          ]);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Model loading timeout')), 20000)
          );
          
          console.log('⏳ Loading models with 20s timeout...');
          await Promise.race([loadPromise, timeoutPromise]);
          console.log('📦 All models loaded successfully!');
          
          // Verify each model is actually loaded and functional
          const verificationResult = this.verifyModelsLoaded();
          if (!verificationResult) {
            throw new Error('Model verification failed after loading');
          }
          
          modelsLoaded = true;
          console.log(`✅ Face detection models loaded and verified from: ${MODEL_URL}`);
          break;
        } catch (error) {
          console.warn(`❌ Failed to load models from ${MODEL_URL}:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      if (!modelsLoaded) {
        console.error('❌ All face detection model loading attempts failed. Last error:', lastError?.message);
        console.error('Please check your internet connection and try refreshing the page.');
        this.isInitialized = false;
        return false;
      }
      
      this.isInitialized = true;
      console.log('✅ Face detection service initialized successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize face detection:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  // Verify that all required models are properly loaded
  verifyModelsLoaded() {
    const requiredModels = {
      'TinyFaceDetector': faceapi.nets.tinyFaceDetector.isLoaded,
      'FaceLandmark68Net': faceapi.nets.faceLandmark68Net.isLoaded,
      'FaceRecognitionNet': faceapi.nets.faceRecognitionNet.isLoaded,
      'FaceExpressionNet': faceapi.nets.faceExpressionNet.isLoaded
    };
    
    console.log('🔍 Model verification status:');
    let allLoaded = true;
    
    for (const [modelName, isLoaded] of Object.entries(requiredModels)) {
      const status = isLoaded ? '✅' : '❌';
      console.log(`  ${status} ${modelName}: ${isLoaded}`);
      if (!isLoaded) allLoaded = false;
    }
    
    if (!allLoaded) {
      console.error('❌ Not all required models are loaded!');
      return false;
    }
    
    console.log('✅ All required models are loaded and ready!');
    return true;
  }

  async detectFaces(videoElement) {
    if (!this.isInitialized) {
      console.warn('Face detection service not initialized');
      return { faces: [], violations: [] };
    }
    
    if (!videoElement) {
      console.warn('No video element provided for face detection');
      return { faces: [], violations: [] };
    }

    try {
      // Check if video is ready
      if (videoElement.readyState < 2) {
        console.log('Video not ready for detection, readyState:', videoElement.readyState);
        return { faces: [], violations: [] };
      }
      
      console.log('Starting face detection on video element:', {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        readyState: videoElement.readyState,
        currentTime: videoElement.currentTime
      });
      
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
        
      console.log(`Face detection completed. Found ${detections.length} face(s)`);
      
      if (detections.length > 0) {
         detections.forEach((detection, index) => {
           console.log(`Face ${index + 1}:`, {
             score: detection.detection.score,
             box: detection.detection.box,
             hasLandmarks: !!detection.landmarks,
             hasDescriptor: !!detection.descriptor
           });
         });
       }

      const violations = [];
      const currentTime = Date.now();

      // Check for multiple faces
      if (detections.length > 1) {
        violations.push({
          type: 'multiple_faces',
          severity: 'critical',
          message: `${detections.length} faces detected. Only one person allowed.`,
          timestamp: currentTime
        });
      }

      // Check for no face detected (but don't spam warnings)
      if (detections.length === 0) {
        const timeSinceLastNoFace = currentTime - (this.lastNoFaceTime || 0);
        if (timeSinceLastNoFace > 3000) { // Only warn every 3 seconds
          this.lastNoFaceTime = currentTime;
          violations.push({
            type: 'no_face',
            severity: 'warning',
            message: 'No face detected. Please ensure you are visible to the camera.',
            timestamp: currentTime
          });
        }
      }

      // Check for looking away (using face landmarks)
      if (detections.length === 1) {
        const landmarks = detections[0].landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        
        // Simple gaze detection based on eye and nose positions
        const isLookingAway = this.detectGazeDirection(leftEye, rightEye, nose);
        
        if (isLookingAway) {
          violations.push({
            type: 'looking_away',
            severity: 'warning',
            message: 'Please look at the camera.',
            timestamp: currentTime
          });
        }
      }

      // Detect potential secondary devices (basic implementation)
      const secondaryDeviceDetected = await this.detectSecondaryDevices(videoElement);
      if (secondaryDeviceDetected) {
        violations.push({
          type: 'secondary_device',
          severity: 'critical',
          message: 'Secondary device detected. Please remove all electronic devices.',
          timestamp: currentTime
        });
      }

      this.lastDetectionTime = currentTime;
      return { faces: detections, violations };
    } catch (error) {
      // Only log errors occasionally to prevent console spam
      const currentTime = Date.now();
      if (currentTime - this.lastErrorTime > 5000) { // Log error every 5 seconds max
        this.lastErrorTime = currentTime;
        console.error('Face detection error:', error.message || error);
      }
      return { faces: [], violations: [] };
    }
  }

  detectGazeDirection(leftEye, rightEye, nose) {
    // Simple gaze detection based on eye and nose alignment
    const leftEyeCenter = this.getCenter(leftEye);
    const rightEyeCenter = this.getCenter(rightEye);
    const noseCenter = this.getCenter(nose);
    
    // Calculate if eyes are aligned with nose (looking forward)
    const eyeDistance = Math.abs(leftEyeCenter.x - rightEyeCenter.x);
    const noseToEyeDistance = Math.abs(noseCenter.x - (leftEyeCenter.x + rightEyeCenter.x) / 2);
    
    // If nose is significantly off-center from eyes, person is looking away
    return noseToEyeDistance > eyeDistance * 0.3;
  }

  getCenter(points) {
    const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    return { x, y };
  }

  async detectSecondaryDevices(videoElement) {
    // Basic implementation: detect rectangular objects that might be phones/tablets
    // This is a simplified approach - in a real implementation, you'd use more sophisticated detection
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple edge detection to find rectangular objects
      // This is a basic implementation - real-world would need more sophisticated algorithms
      return this.detectRectangularObjects(imageData);
    } catch (error) {
      console.error('Secondary device detection error:', error);
      return false;
    }
  }

  detectRectangularObjects(imageData) {
    // Simplified rectangular object detection
    // In a real implementation, you'd use computer vision libraries
    // For now, return false to avoid false positives
    return false;
  }

  startContinuousDetection(videoElement, callback, interval = 1000) {
    if (this.detectionInterval) {
      this.stopContinuousDetection();
    }

    this.detectionInterval = setInterval(async () => {
      const result = await this.detectFaces(videoElement);
      
      if (result.violations.length > 0) {
        this.consecutiveViolations++;
        
        // Auto-submit if too many consecutive violations
        if (this.consecutiveViolations >= this.maxConsecutiveViolations) {
          result.violations.push({
            type: 'auto_submit',
            severity: 'critical',
            message: 'Too many security violations. Exam will be automatically submitted.',
            timestamp: Date.now()
          });
        }
      } else {
        this.consecutiveViolations = 0;
      }
      
      callback(result);
    }, interval);
  }

  stopContinuousDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  cleanup() {
    this.stopContinuousDetection();
    this.violationCallbacks = [];
    this.consecutiveViolations = 0;
    this.referenceFaceDescriptor = null;
  }

  // Store reference face descriptor for continuous monitoring
  async setReferenceFace(videoElement) {
    if (!this.isInitialized || !videoElement) {
      throw new Error('Face detection service not initialized or invalid video element');
    }

    try {
      const detections = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        throw new Error('No face detected for reference capture');
      }

      this.referenceFaceDescriptor = detections.descriptor;
      console.log('Reference face descriptor stored successfully');
      return true;
    } catch (error) {
      console.error('Failed to set reference face:', error);
      throw error;
    }
  }

  // Enhanced method that combines face detection with reference comparison
  async detectFacesWithReference(videoElement) {
    const baseResult = await this.detectFaces(videoElement);
    
    // If we have a reference face and detected exactly one face, compare them
    if (baseResult.faces.length === 1 && this.referenceFaceDescriptor) {
      try {
        const detection = baseResult.faces[0];
        if (detection.descriptor) {
          const distance = faceapi.euclideanDistance(this.referenceFaceDescriptor, detection.descriptor);
          const match = distance <= this.faceMatchThreshold;
          
          console.log('Face comparison result:', { distance, match, threshold: this.faceMatchThreshold });
          
          if (!match) {
            baseResult.violations.push({
              type: 'face_mismatch',
              severity: 'critical',
              message: 'Face does not match the reference. Potential identity violation.',
              timestamp: Date.now(),
              distance: distance
            });
          }
        }
      } catch (error) {
        console.error('Face comparison error:', error);
      }
    }
    
    return baseResult;
  }

  // Compare current face with reference face
  async compareFaceWithReference(videoElement) {
    if (!this.referenceFaceDescriptor) {
      return { match: true, distance: 0, error: 'No reference face set' };
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return { match: false, distance: Infinity, error: 'No face detected' };
      }

      // Calculate Euclidean distance between descriptors
      const distance = faceapi.euclideanDistance(this.referenceFaceDescriptor, detection.descriptor);
      const match = distance <= this.faceMatchThreshold;

      console.log('🔍 Face comparison result:', { distance, match, threshold: this.faceMatchThreshold });
      return { match, distance, error: null };
    } catch (error) {
      console.error('❌ Face comparison error:', error);
      return { match: false, distance: Infinity, error: error.message };
    }
  }

  // Perform complete face verification - capture reference and verify
  async performFaceVerification(videoElement) {
    if (!this.isInitialized) {
      throw new Error('Face detection service not initialized');
    }

    if (!this.verifyModelsLoaded()) {
      throw new Error('Required models not loaded');
    }

    try {
      console.log('🎯 Starting face verification process...');
      
      // Step 1: Detect face and capture reference
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('No face detected for verification');
      }

      if (!detection.descriptor) {
        throw new Error('Failed to generate face descriptor');
      }

      // Step 2: Store reference face descriptor
      this.referenceFaceDescriptor = detection.descriptor;
      console.log('✅ Reference face captured and stored');

      // Step 3: Perform immediate verification (should match since it's the same face)
      const verificationResult = await this.compareFaceWithReference(videoElement);
      
      if (!verificationResult.match) {
        console.warn('⚠️ Immediate verification failed - this may indicate an issue');
      }

      return {
        success: true,
        referenceStored: true,
        faceData: {
          detection: detection.detection,
          landmarks: detection.landmarks,
          descriptor: detection.descriptor,
          qualityScore: detection.detection.score
        },
        verificationResult
      };
    } catch (error) {
      console.error('❌ Face verification failed:', error);
      throw error;
    }
  }

  // Verify current face against stored reference
  async verifyAgainstReference(videoElement) {
    if (!this.referenceFaceDescriptor) {
      return { verified: false, error: 'No reference face stored' };
    }

    try {
      const comparisonResult = await this.compareFaceWithReference(videoElement);
      
      return {
        verified: comparisonResult.match,
        distance: comparisonResult.distance,
        threshold: this.faceMatchThreshold,
        error: comparisonResult.error
      };
    } catch (error) {
      console.error('❌ Reference verification failed:', error);
      return { verified: false, error: error.message };
    }
  }

  // Capture snapshot as base64 for violation logging
  captureSnapshot(videoElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      return null;
    }
  }


}

const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;