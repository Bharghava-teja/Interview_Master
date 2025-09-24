import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Shield, 
  Users,
  Settings,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import webRTCService from '../services/WebRTCService';
import encryptionService from '../services/EncryptionService';
import SecureInterviewMonitor from './SecureInterviewMonitor';

const SecureVideoCall = ({ 
  sessionId, 
  isHost = false, 
  onCallEnd, 
  onSecurityViolation,
  participantName = 'Anonymous'
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState('new');
  const [encryptionStatus, setEncryptionStatus] = useState('initializing');
  const [connectionStats, setConnectionStats] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const statsIntervalRef = useRef(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, [sessionId]);

  useEffect(() => {
    if (isCallActive) {
      startStatsMonitoring();
    } else {
      stopStatsMonitoring();
    }
  }, [isCallActive]);

  const initializeCall = async () => {
    try {
      setEncryptionStatus('initializing');
      
      // Initialize WebRTC session
      await webRTCService.initializeSession(sessionId, isHost);
      
      // Set up event handlers
      webRTCService.onConnectionStateChange = (sessionId, state) => {
        setConnectionState(state);
        if (state === 'connected') {
          setEncryptionStatus('active');
        } else if (state === 'failed' || state === 'disconnected') {
          setEncryptionStatus('failed');
        }
      };

      webRTCService.onRemoteStream = (sessionId, stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webRTCService.onDataChannelMessage = (sessionId, message) => {
        handleSecureMessage(message);
      };

      // Get user media
      const stream = await webRTCService.getUserMedia({
        video: true,
        audio: true
      });

      // Store local stream for monitoring
      setLocalStream(stream);

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add stream to peer connection
      await webRTCService.addLocalStream(sessionId, stream);
      
      setEncryptionStatus('ready');
      setIsCallActive(true);
      setMonitoringActive(true);

    } catch (error) {
      console.error('Failed to initialize call:', error);
      setEncryptionStatus('failed');
      addSecurityAlert('Failed to initialize secure connection', 'error');
    }
  };

  const startStatsMonitoring = () => {
    statsIntervalRef.current = setInterval(async () => {
      const stats = await webRTCService.getConnectionStats(sessionId);
      if (stats) {
        setConnectionStats(stats);
        
        // Monitor for potential security issues
        if (stats.connectionState === 'failed') {
          addSecurityAlert('Connection failed - potential security breach', 'warning');
        }
      }
    }, 2000);
  };

  const stopStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  const handleSecureMessage = (message) => {
    console.log('Received secure message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'security_alert':
        addSecurityAlert(message.content, 'warning');
        if (onSecurityViolation) {
          onSecurityViolation(message);
        }
        break;
      case 'participant_joined':
        addSecurityAlert(`${message.participantName} joined the call`, 'info');
        break;
      case 'participant_left':
        addSecurityAlert(`${message.participantName} left the call`, 'info');
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handleViolationDetected = useCallback((violation) => {
    console.log('Security violation detected in video call:', violation);
    
    // Add to security alerts
    addSecurityAlert(`Security violation: ${violation.type}`, 'warning');
    
    // Send violation to other participants
    webRTCService.sendSecureMessage(sessionId, {
      type: 'security_violation',
      violation: {
        type: violation.type,
        severity: violation.severity,
        timestamp: violation.timestamp,
        participantName
      }
    });
    
    // Notify parent component
    if (onSecurityViolation) {
      onSecurityViolation(violation);
    }
  }, [sessionId, participantName, onSecurityViolation]);

  const handleSecurityAlert = useCallback((message, type = 'info') => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      sessionId
    };
    
    addSecurityAlert(message, type);
  }, [sessionId]);

  const addSecurityAlert = (message, type = 'info') => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setSecurityAlerts(prev => [...prev.slice(-4), alert]); // Keep last 5 alerts
    
    // Auto-remove info alerts after 5 seconds
    if (type === 'info') {
      setTimeout(() => {
        setSecurityAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    const success = webRTCService.toggleVideo(sessionId, newState);
    if (success) {
      setIsVideoEnabled(newState);
      
      // Send notification to other participants
      webRTCService.sendSecureMessage(sessionId, {
        type: 'video_toggle',
        participantName,
        enabled: newState
      });
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    const success = webRTCService.toggleAudio(sessionId, newState);
    if (success) {
      setIsAudioEnabled(newState);
      
      // Send notification to other participants
      webRTCService.sendSecureMessage(sessionId, {
        type: 'audio_toggle',
        participantName,
        enabled: newState
      });
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setMonitoringActive(false);
    cleanup();
    if (onCallEnd) {
      onCallEnd();
    }
  };

  const cleanup = () => {
    stopStatsMonitoring();
    webRTCService.closeSession(sessionId);
    
    // Stop local video stream
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const getEncryptionStatusColor = () => {
    switch (encryptionStatus) {
      case 'active': return 'text-green-600';
      case 'ready': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="h-full bg-gray-900 relative overflow-hidden">
      {/* Security Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className={`w-4 h-4 ${getEncryptionStatusColor()}`} />
              <span className="text-sm">
                Encryption: <span className={getEncryptionStatusColor()}>{encryptionStatus}</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'connected' ? 'bg-green-500' :
                connectionState === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm">
                Connection: <span className={getConnectionStatusColor()}>{connectionState}</span>
              </span>
            </div>

            {connectionStats && (
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-sm">
                  {Math.round(connectionStats.bytesReceived / 1024)}KB ↓ 
                  {Math.round(connectionStats.bytesSent / 1024)}KB ↑
                </span>
              </div>
            )}
          </div>

          <div className="text-sm">
            Session: {sessionId.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="absolute top-16 right-4 z-20 space-y-2">
          {securityAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-3 rounded-lg shadow-lg max-w-sm ${
                alert.type === 'error' ? 'bg-red-600 text-white' :
                alert.type === 'warning' ? 'bg-yellow-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{alert.message}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Container */}
      <div className="h-full relative">
        {/* Security Monitor Overlay */}
        {monitoringActive && localStream && (
          <SecureInterviewMonitor
            sessionId={sessionId}
            isHost={isHost}
            onViolationDetected={handleViolationDetected}
            onSecurityAlert={handleSecurityAlert}
            videoStream={localStream}
            isActive={monitoringActive}
          />
        )}

        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* No Remote Video Placeholder */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">
                {connectionState === 'connecting' ? 'Connecting...' : 'Waiting for participants'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                End-to-end encrypted connection
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>

          {/* Video Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SecureVideoCall;