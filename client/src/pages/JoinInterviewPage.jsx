import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Camera, 
  Mic, 
  Monitor,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  KeyRound
} from 'lucide-react';
import secureInterviewService from '../services/SecureInterviewService';
import SecureInterviewBrand from '../components/SecureInterviewBrand';

const JoinInterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [joinStatus, setJoinStatus] = useState('form'); // form, joining, waiting, approved, rejected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [devicePermissions, setDevicePermissions] = useState({
    camera: false,
    microphone: false,
    screen: false
  });
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);

  // Auto-fill session code from URL parameter
  useEffect(() => {
    if (sessionId) {
      setSessionCode(sessionId);
      validateSession(sessionId);
    }
  }, [sessionId]);

  // Validate session exists and is active
  const validateSession = async (code) => {
    try {
      const isValid = secureInterviewService.validateSessionCode(code);
      if (isValid) {
        const session = secureInterviewService.getSessionByCode(code);
        setCurrentSession(session);
        
        if (session.status === 'ended') {
          setJoinStatus('error');
          setErrorMessage('This interview session has ended.');
        } else if (session.participants.length >= session.maxParticipants) {
          setJoinStatus('error');
          setErrorMessage('This interview session is full.');
        }
      } else {
        setJoinStatus('error');
        setErrorMessage('Invalid session code. Please check and try again.');
      }
    } catch (error) {
      setJoinStatus('error');
      setErrorMessage('Failed to validate session. Please try again.');
    }
  };

  // Check device permissions
  const checkDevicePermissions = async () => {
    setIsCheckingDevices(true);
    
    try {
      // Check camera permission
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setDevicePermissions(prev => ({ ...prev, camera: true }));
        videoStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setDevicePermissions(prev => ({ ...prev, camera: false }));
      }

      // Check microphone permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setDevicePermissions(prev => ({ ...prev, microphone: true }));
        audioStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        setDevicePermissions(prev => ({ ...prev, microphone: false }));
      }

      // Check screen share capability (doesn't require permission until used)
      if (navigator.mediaDevices.getDisplayMedia) {
        setDevicePermissions(prev => ({ ...prev, screen: true }));
      }
    } catch (error) {
      console.error('Error checking device permissions:', error);
    } finally {
      setIsCheckingDevices(false);
    }
  };

  // Join session
  const joinSession = async () => {
    if (!sessionCode || !participantName) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setJoinStatus('joining');
    setErrorMessage('');

    try {
      // Validate session first
      const isValid = secureInterviewService.validateSessionCode(sessionCode);
      if (!isValid) {
        throw new Error('Invalid session code');
      }

      const session = secureInterviewService.getSessionByCode(sessionCode);
      
      if (session.status === 'ended') {
        throw new Error('This interview session has ended');
      }

      if (session.participants.length >= session.maxParticipants) {
        throw new Error('This interview session is full');
      }

      // Create participant object
      const participant = {
        id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: participantName,
        email: participantEmail,
        joinedAt: new Date().toISOString(),
        status: session.requireApproval ? 'waiting' : 'approved',
        devicePermissions: devicePermissions
      };

      // Add participant to session
      secureInterviewService.addParticipant(session.id, participant);
      
      if (session.requireApproval) {
        setJoinStatus('waiting');
        // Start polling for approval status
        startApprovalPolling(session.id, participant.id);
      } else {
        setJoinStatus('approved');
        // Auto-redirect to interview room after a short delay
        setTimeout(() => {
          navigate(`/interview-room/${session.id}?participantId=${participant.id}`);
        }, 2000);
      }
      
      setCurrentSession(session);
    } catch (error) {
      setJoinStatus('error');
      setErrorMessage(error.message || 'Failed to join session. Please try again.');
    }
  };

  // Poll for approval status
  const startApprovalPolling = (sessionId, participantId) => {
    const interval = setInterval(() => {
      try {
        const session = secureInterviewService.getSession(sessionId);
        const participant = session.participants.find(p => p.id === participantId);
        
        if (participant) {
          if (participant.status === 'approved') {
            setJoinStatus('approved');
            clearInterval(interval);
            // Redirect to interview room
            setTimeout(() => {
              navigate(`/interview-room/${sessionId}?participantId=${participantId}`);
            }, 2000);
          } else if (participant.status === 'rejected') {
            setJoinStatus('rejected');
            setErrorMessage(participant.rejectionReason || 'Your request to join was not approved.');
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling approval status:', error);
        clearInterval(interval);
      }
    }, 2000);

    // Clear interval after 10 minutes to prevent infinite polling
    setTimeout(() => clearInterval(interval), 600000);
  };

  // Handle session code input
  const handleSessionCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setSessionCode(code);
    
    if (code.length === 6) {
      validateSession(code);
    } else {
      setCurrentSession(null);
      setJoinStatus('form');
      setErrorMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <SecureInterviewBrand />
          <p className="text-gray-600 mt-4">Join a secure interview session</p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {joinStatus === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  Join Interview Session
                </h2>

                <div className="space-y-6">
                  {/* Session Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Code *
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={sessionCode}
                        onChange={handleSessionCodeChange}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg text-center uppercase tracking-wider"
                      />
                    </div>
                    {currentSession && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center text-green-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Valid session found</span>
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          Status: {currentSession.status} • Max participants: {currentSession.maxParticipants}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Participant Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={participantEmail}
                        onChange={(e) => setParticipantEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Device Permissions Check */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Device Permissions
                      </label>
                      <button
                        onClick={checkDevicePermissions}
                        disabled={isCheckingDevices}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        {isCheckingDevices ? 'Checking...' : 'Check Permissions'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        { key: 'camera', icon: Camera, label: 'Camera Access', required: true },
                        { key: 'microphone', icon: Mic, label: 'Microphone Access', required: true },
                        { key: 'screen', icon: Monitor, label: 'Screen Share (Optional)', required: false }
                      ].map((device) => (
                        <div key={device.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <device.icon className="h-5 w-5 text-gray-600 mr-3" />
                            <span className="text-sm font-medium text-gray-700">
                              {device.label}
                              {device.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                          </div>
                          <div className={`flex items-center ${
                            devicePermissions[device.key] ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {devicePermissions[device.key] ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{errorMessage}</span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={joinSession}
                    disabled={!sessionCode || !participantName || !currentSession}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Join Secure Interview</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {joinStatus === 'joining' && (
              <motion.div
                key="joining"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6"
                />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Joining Session...</h2>
                <p className="text-gray-600">Please wait while we connect you to the interview.</p>
              </motion.div>
            )}

            {joinStatus === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-100 text-center"
              >
                <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Waiting for Approval</h2>
                <p className="text-gray-600 mb-4">
                  You're in the waiting room. The host will approve your request to join shortly.
                </p>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Name:</strong> {participantName}<br />
                    <strong>Session:</strong> {sessionCode}
                  </p>
                </div>
              </motion.div>
            )}

            {joinStatus === 'approved' && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-8 border border-green-100 text-center"
              >
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Approved!</h2>
                <p className="text-gray-600 mb-4">
                  Your request has been approved. Redirecting to the interview room...
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full mx-auto"
                />
              </motion.div>
            )}

            {(joinStatus === 'rejected' || joinStatus === 'error') && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center"
              >
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {joinStatus === 'rejected' ? 'Request Rejected' : 'Unable to Join'}
                </h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() => {
                    setJoinStatus('form');
                    setErrorMessage('');
                    setSessionCode('');
                    setParticipantName('');
                    setParticipantEmail('');
                    setCurrentSession(null);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default JoinInterviewPage;