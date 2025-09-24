import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Settings, 
  Copy, 
  QrCode, 
  Clock, 
  UserCheck, 
  UserX, 
  Eye,
  Video,
  AlertTriangle,
  Link as LinkIcon,
  Play,
  Square
} from 'lucide-react';
import SecureInterviewService from '../services/SecureInterviewService';
import SecureInterviewBrand from '../components/SecureInterviewBrand';
import WaitingRoom from '../components/WaitingRoom';
import SecureVideoCall from '../components/SecureVideoCall';

const SecureInterviewPage = () => {
  const [session, setSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, participants, settings, security
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [approvedParticipants, setApprovedParticipants] = useState([]);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [securityViolations, setSecurityViolations] = useState([]);
  const [sessionLink, setSessionLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [sessionSettings, setSessionSettings] = useState({
    maxParticipants: 10,
    requireApproval: true,
    recordSession: false,
    enableChat: true,
    enableScreenShare: false,
    violationMonitoring: true,
  });

  // Create a new session
  const createSession = async () => {
    setIsCreatingSession(true);
    try {
      const hostInfo = {
        name: 'Interview Host',
        email: 'host@company.com'
      };

      const newSession = await SecureInterviewService.createSession(hostInfo, sessionSettings);
      setSession(newSession);

      const link = SecureInterviewService.generateShareableLink(newSession.id);
      setSessionLink(link);

      const qr = await SecureInterviewService.generateQRCode(link);
      setQrCode(qr);

      // Add mock participants for testing
      await SecureInterviewService.addToWaitingRoom(newSession.id, {
        name: 'John Doe',
        email: 'john@example.com',
        joinedAt: Date.now()
      });

      await SecureInterviewService.addToWaitingRoom(newSession.id, {
        name: 'Jane Smith', 
        email: 'jane@example.com',
        joinedAt: Date.now()
      });

      setActiveTab('manage');
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Start session
  const startSession = () => {
    if (session) {
      SecureInterviewService.startSession(session.id);
      setSession(prev => ({ ...prev, status: 'active', startedAt: new Date().toISOString() }));
    }
  };

  // End session
  const endSession = () => {
    if (session) {
      SecureInterviewService.endSession(session.id);
      setSession(prev => ({ ...prev, status: 'ended', endedAt: new Date().toISOString() }));
    }
  };

  // Copy session link to clipboard
  const copySessionLink = async () => {
    if (session) {
      const link = SecureInterviewService.generateSessionLink(session.id);
      await navigator.clipboard.writeText(link);
      // Show toast notification (implement toast system)
      console.log('Link copied to clipboard');
    }
  };

  // Handle participant approval
  const handleApproveParticipant = async (participantId) => {
    try {
      await SecureInterviewService.approveParticipant(session.id, participantId);
      loadWaitingRoomParticipants();
    } catch (error) {
      console.error('Failed to approve participant:', error);
    }
  };

  // Handle participant rejection
  const handleRejectParticipant = async (participantId, reason) => {
    try {
      await SecureInterviewService.rejectParticipant(session.id, participantId, reason);
      loadWaitingRoomParticipants();
    } catch (error) {
      console.error('Failed to reject participant:', error);
    }
  };

  // Load waiting room participants
  const loadWaitingRoomParticipants = async () => {
    if (!session) return;
    
    try {
      const participants = await SecureInterviewService.getWaitingRoomParticipants(session.id);
      setWaitingParticipants(participants);
      
      // Get session data to retrieve approved participants
      const sessionData = await SecureInterviewService.getSession(session.id);
      if (sessionData && sessionData.participants) {
        setApprovedParticipants(sessionData.participants.filter(p => p.status === 'approved'));
      }
    } catch (error) {
      console.error('Failed to load waiting room participants:', error);
    }
  };

  const startInterview = () => {
    setIsCallActive(true);
    setActiveTab('interview');
  };

  const endInterview = () => {
    setIsCallActive(false);
    setActiveTab('manage');
  };

  const handleViolationDetected = (violation) => {
    setSecurityViolations(prev => [...prev, {
      ...violation,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }]);
  };

  // Effect to load participants when session changes
  useEffect(() => {
    loadWaitingRoomParticipants();
  }, [session]);

  // Effect to periodically refresh waiting room
  useEffect(() => {
    if (session && showWaitingRoom) {
      const interval = setInterval(loadWaitingRoomParticipants, 3000);
      return () => clearInterval(interval);
    }
  }, [session, showWaitingRoom]);

  // Approve participant
  const approveParticipant = (participantId) => {
    if (session) {
      try {
        SecureInterviewService.approveParticipant(session.id, participantId);
        updateSessionData();
      } catch (error) {
        console.error('Failed to approve participant:', error);
      }
    }
  };

  // Reject participant
  const rejectParticipant = (participantId, reason = 'Not approved') => {
    if (session) {
      try {
        SecureInterviewService.rejectParticipant(session.id, participantId, reason);
        updateSessionData();
      } catch (error) {
        console.error('Failed to reject participant:', error);
      }
    }
  };

  // Update session data
  const updateSessionData = () => {
    if (session) {
      const updatedSession = SecureInterviewService.getSession(session.id);
      setSession(updatedSession);
    }
  };

  // Start polling for session statistics
  const startStatsPolling = (sessionId) => {
    const interval = setInterval(() => {
      try {
        const stats = SecureInterviewService.getSessionStats(sessionId);
        setSessionStats(stats);
        updateSessionData();
      } catch (error) {
        console.error('Failed to get session stats:', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <SecureInterviewBrand />
        </motion.div>

        {!session ? (
          /* Session Creation */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Create Secure Interview Session
              </h2>
              
              {/* Session Settings */}
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sessionSettings.maxParticipants}
                      onChange={(e) => setSessionSettings(prev => ({
                        ...prev,
                        maxParticipants: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { key: 'requireApproval', label: 'Require Host Approval', desc: 'Participants wait in lobby until approved' },
                    { key: 'recordSession', label: 'Record Session', desc: 'Save interview recording for later review' },
                    { key: 'enableChat', label: 'Enable Chat', desc: 'Allow text messaging during interview' },
                    { key: 'enableScreenShare', label: 'Enable Screen Sharing', desc: 'Allow participants to share screens' },
                    { key: 'violationMonitoring', label: 'Violation Monitoring', desc: 'Monitor for security violations using AI' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{setting.label}</div>
                        <div className="text-sm text-gray-600">{setting.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sessionSettings[setting.key]}
                          onChange={(e) => setSessionSettings(prev => ({
                            ...prev,
                            [setting.key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={createSession}
                disabled={isCreatingSession}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isCreatingSession ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Creating Session...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Create Secure Session</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Session Dashboard */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Session Header */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-green-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Session: {session.code}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      session.status === 'created' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                    {sessionStats && (
                      <>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {sessionStats.participantCount} participants
                        </span>
                        {sessionStats.duration > 0 && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDuration(sessionStats.duration)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {session.status === 'created' && (
                    <motion.button
                      onClick={startSession}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start</span>
                    </motion.button>
                  )}
                  
                  {session.status === 'active' && (
                    <motion.button
                      onClick={endSession}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Square className="h-4 w-4" />
                      <span>End</span>
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={copySessionLink}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              {[
                { id: 'overview', label: 'Overview', icon: Shield },
                { id: 'participants', label: 'Participants', icon: Users },
                { id: 'waiting-room', label: 'Waiting Room', icon: UserCheck, badge: waitingParticipants.length },
                { id: 'settings', label: 'Settings', icon: Settings },
                { id: 'security', label: 'Security', icon: Eye },
                { id: 'interview', label: 'Interview', icon: Video }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'waiting-room') {
                        setShowWaitingRoom(true);
                        loadWaitingRoomParticipants();
                      } else {
                        setShowWaitingRoom(false);
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Session Link Display */}
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-green-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-2 text-green-600" />
                      Session Access
                    </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={session.code}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(session.code)}
                      className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={SecureInterviewService.generateSessionLink(session.id)}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={copySessionLink}
                      className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

              {/* Security Monitoring */}
                {sessionStats && sessionStats.violationCount > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                      Security Alerts
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <div className="font-medium text-red-800">
                          {sessionStats.violationCount} violations detected
                        </div>
                        <div className="text-sm text-red-600">
                          Risk Score: {sessionStats.riskScore}/100
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sessionStats.riskScore > 70 ? 'bg-red-100 text-red-800' :
                        sessionStats.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {sessionStats.riskScore > 70 ? 'HIGH RISK' :
                         sessionStats.riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK'}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'waiting-room' && (
              <motion.div
                key="waiting-room"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <WaitingRoom
                  sessionId={session.id}
                  waitingParticipants={waitingParticipants}
                  approvedParticipants={approvedParticipants}
                  onApprove={handleApproveParticipant}
                  onReject={handleRejectParticipant}
                  onRefresh={loadWaitingRoomParticipants}
                />
              </motion.div>
            )}

            {activeTab === 'interview' && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Secure Interview Session</h3>
                    <div className="flex space-x-3">
                      {!isCallActive ? (
                        <button
                          onClick={startInterview}
                          disabled={approvedParticipants.length === 0}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Start Interview</span>
                        </button>
                      ) : (
                        <button
                          onClick={endInterview}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                          <span>End Interview</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {approvedParticipants.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Participants</h3>
                      <p className="text-gray-600">
                        Please approve participants from the waiting room before starting the interview.
                      </p>
                    </div>
                  ) : (
                    <SecureVideoCall
                      sessionId={session?.id}
                      isHost={true}
                      participants={approvedParticipants}
                      onViolationDetected={handleViolationDetected}
                      isActive={isCallActive}
                    />
                  )}

                  {/* Security Violations Summary */}
                  {securityViolations.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Security Violations ({securityViolations.length})</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {securityViolations.slice(-5).map((violation) => (
                          <div key={violation.id} className="text-xs text-red-700">
                            <span className="font-medium">{new Date(violation.timestamp).toLocaleTimeString()}</span>
                            {' - '}{violation.type}: {violation.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SecureInterviewPage;