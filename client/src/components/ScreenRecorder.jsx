import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Square, Play, Pause, Download, AlertTriangle, Clock } from 'lucide-react';

const ScreenRecorder = ({ 
  examId, 
  isActive = false, 
  onRecordingStart, 
  onRecordingStop, 
  onRecordingError,
  autoStart = false,
  maxDuration = 7200000, // 2 hours in milliseconds
  screenStream = null // Use existing screen stream instead of requesting new one
}) => {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState('standard'); // 'low', 'standard', 'high'
  const [estimatedSize, setEstimatedSize] = useState(0);

  // Recording quality configurations
  const QUALITY_CONFIGS = {
    low: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 15 }
      },
      videoBitsPerSecond: 1000000, // 1 Mbps
      label: 'Low (720p, 15fps)'
    },
    standard: {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      videoBitsPerSecond: 2500000, // 2.5 Mbps
      label: 'Standard (1080p, 30fps)'
    },
    high: {
      video: {
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        frameRate: { ideal: 30 }
      },
      videoBitsPerSecond: 5000000, // 5 Mbps
      label: 'High (1440p, 30fps)'
    }
  };

  // Initialize screen capture
  const initializeScreenCapture = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Use existing screen stream instead of requesting new one
      if (!screenStream) {
        throw new Error('Screen stream not available. Please grant screen share permission first.');
      }

      // Check if screen stream has active video tracks
      const videoTracks = screenStream.getVideoTracks();
      const isActive = videoTracks.length > 0 && videoTracks.some(track => 
        track.readyState === "live"
      );
      
      if (!isActive) {
        throw new Error('Screen stream is not active. Please restart screen sharing.');
      }

      streamRef.current = screenStream;
      setPermissionStatus('granted');
      
      // Get quality config
      const config = QUALITY_CONFIGS[recordingQuality];
      
      // Set up MediaRecorder
      const options = {
        mimeType: getSupportedMimeType(),
        videoBitsPerSecond: config.videoBitsPerSecond,
        audioBitsPerSecond: 128000 // 128 kbps for audio
      };
      
      mediaRecorderRef.current = new MediaRecorder(screenStream, options);
      
      // Set up event handlers
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          updateEstimatedSize();
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: getSupportedMimeType() 
        });
        setRecordedBlob(blob);
        
        // Enhanced recording data
        const recordingData = {
          blob,
          duration: recordingDuration,
          examId,
          timestamp: new Date().toISOString(),
          size: blob.size,
          quality: recordingQuality,
          mimeType: getSupportedMimeType(),
          chunks: chunksRef.current.length,
          estimatedSize: estimatedSize
        };
        
        // Store recording data for potential upload
        try {
          const recordingInfo = {
            examId,
            timestamp: recordingData.timestamp,
            duration: recordingData.duration,
            size: recordingData.size,
            quality: recordingData.quality
          };
          
          const existingRecordings = JSON.parse(localStorage.getItem('screenRecordings') || '[]');
          existingRecordings.push(recordingInfo);
          localStorage.setItem('screenRecordings', JSON.stringify(existingRecordings));
        } catch (error) {
          console.warn('Failed to store recording info:', error);
        }
        
        chunksRef.current = [];
        
        if (onRecordingStop) {
          onRecordingStop(recordingData);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        const errorMsg = `Recording error: ${event.error?.message || 'Unknown error'}`;
        setError(errorMsg);
        
        if (onRecordingError) {
          onRecordingError(new Error(errorMsg));
        }
      };
      
      // Handle stream end (user stops sharing)
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecording) {
          stopRecording();
        }
      });
      
    } catch (error) {
      console.error('Screen capture initialization failed:', error);
      setPermissionStatus('denied');
      setError(error.message);
      
      if (onRecordingError) {
        onRecordingError(error);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [screenStream, recordingQuality, examId, isRecording, recordingDuration, onRecordingStop, onRecordingError]);

  // Get supported MIME type
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    
    return types.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (!mediaRecorderRef.current) {
        await initializeScreenCapture();
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        chunksRef.current = [];
        startTimeRef.current = Date.now();
        
        mediaRecorderRef.current.start(1000); // Collect data every second
        setIsRecording(true);
        setIsPaused(false);
        setRecordingDuration(0);
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const duration = Date.now() - startTimeRef.current;
            setRecordingDuration(duration);
            
            // Auto-stop if max duration reached
            if (duration >= maxDuration) {
              stopRecording();
            }
          }
        }, 1000);
        
        if (onRecordingStart) {
          onRecordingStart({
            examId,
            timestamp: new Date().toISOString(),
            quality: recordingQuality
          });
        }
      }
    } catch (error) {
      setError(`Failed to start recording: ${error.message}`);
      
      if (onRecordingError) {
        onRecordingError(error);
      }
    }
  }, [examId, recordingQuality, maxDuration, onRecordingStart, onRecordingError, initializeScreenCapture]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    startTimeRef.current = null;
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume duration timer
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const duration = Date.now() - startTimeRef.current;
          setRecordingDuration(duration);
          
          if (duration >= maxDuration) {
            stopRecording();
          }
        }
      }, 1000);
    }
  }, [maxDuration, stopRecording]);

  // Update estimated file size
  const updateEstimatedSize = useCallback(() => {
    const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
    setEstimatedSize(totalSize);
  }, []);

  // Download recording
  const downloadRecording = useCallback(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${examId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [recordedBlob, examId]);

  // Format duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Monitor screenStream state and update permission status
  useEffect(() => {
    if (screenStream) {
      // Check if screen stream has active video tracks
      const videoTracks = screenStream.getVideoTracks();
      const isActive = videoTracks.length > 0 && videoTracks.some(track => 
        track.readyState === "live"
      );
      
      if (isActive) {
        setPermissionStatus('granted');
        setError(null);
        
        // Set up stream inactive handler to reset state when user manually stops sharing
        screenStream.oninactive = () => {
          console.log('Screen stream became inactive');
          setPermissionStatus('prompt');
          setError(null);
          // Stop recording if it was active
          if (isRecording) {
            stopRecording();
          }
        };
        
        // Set up individual track ended handlers
        videoTracks.forEach(track => {
          track.onended = () => {
            console.log('Screen track ended');
            // Re-check all tracks to see if any are still live
            const remainingLiveTracks = screenStream.getVideoTracks().filter(t => t.readyState === "live");
            if (remainingLiveTracks.length === 0) {
              setPermissionStatus('denied');
              setError('Screen sharing ended');
              // Stop recording if it was active
              if (isRecording) {
                stopRecording();
              }
            }
          };
        });
        
      } else {
        setPermissionStatus('denied');
        setError('Screen sharing stream is not active');
      }
    } else {
      setPermissionStatus('prompt');
      setError(null);
    }
  }, [screenStream, isRecording, stopRecording]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && isActive && permissionStatus === 'prompt') {
      initializeScreenCapture().then(() => {
        if (permissionStatus === 'granted') {
          startRecording();
        }
      });
    }
  }, [autoStart, isActive, permissionStatus, initializeScreenCapture, startRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="screen-recorder bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Screen Recorder
        </h3>
        
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {isPaused ? 'Paused' : 'Recording'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Duration: {formatDuration(recordingDuration)}
              </span>
            </div>
            
            {estimatedSize > 0 && (
              <span className="text-sm text-red-700">
                Size: {formatFileSize(estimatedSize)}
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-red-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((recordingDuration / maxDuration) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quality Settings */}
      {!isRecording && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recording Quality
          </label>
          <select
            value={recordingQuality}
            onChange={(e) => setRecordingQuality(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(QUALITY_CONFIGS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        {permissionStatus === 'prompt' && (
          <button
            onClick={initializeScreenCapture}
            disabled={isInitializing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isInitializing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Initializing...
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                Enable Screen Recording
              </>
            )}
          </button>
        )}
        
        {permissionStatus === 'granted' && !isRecording && (
          <button
            onClick={startRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Recording
          </button>
        )}
        
        {isRecording && !isPaused && (
          <button
            onClick={pauseRecording}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </button>
        )}
        
        {isRecording && isPaused && (
          <button
            onClick={resumeRecording}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Resume
          </button>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}
        
        {recordedBlob && (
          <button
            onClick={downloadRecording}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Permission denied message */}
      {permissionStatus === 'denied' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">Screen recording access denied</p>
              <p className="text-xs mt-1">Please allow screen sharing to enable recording functionality.</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording completed message */}
      {recordedBlob && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <Monitor className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Recording completed</p>
                <p className="text-xs mt-1">
                  Duration: {formatDuration(recordingDuration)} • Size: {formatFileSize(recordedBlob.size)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenRecorder;