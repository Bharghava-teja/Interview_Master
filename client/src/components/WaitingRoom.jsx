import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Camera, 
  Mic, 
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Globe
} from 'lucide-react';

const WaitingRoom = ({ 
  sessionId, 
  participants = [], 
  onApprove, 
  onReject, 
  isHost = false,
  currentUser = null 
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [participantToReject, setParticipantToReject] = useState(null);

  // Filter participants by status
  const waitingParticipants = participants.filter(p => p.status === 'waiting');
  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const rejectedParticipants = participants.filter(p => p.status === 'rejected');

  // Handle participant approval
  const handleApprove = (participantId) => {
    if (onApprove) {
      onApprove(participantId);
    }
  };

  // Handle participant rejection
  const handleReject = (participantId, reason = '') => {
    if (onReject) {
      onReject(participantId, reason);
    }
    setShowRejectionModal(false);
    setRejectionReason('');
    setParticipantToReject(null);
  };

  // Open rejection modal
  const openRejectionModal = (participant) => {
    setParticipantToReject(participant);
    setShowRejectionModal(true);
  };

  // Format join time
  const formatJoinTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get device status icon
  const getDeviceStatusIcon = (hasPermission) => {
    return hasPermission ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  // Participant card component
  const ParticipantCard = ({ participant, showActions = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-lg border ${
        participant.status === 'waiting' ? 'bg-yellow-50 border-yellow-200' :
        participant.status === 'approved' ? 'bg-green-50 border-green-200' :
        'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              participant.status === 'waiting' ? 'bg-yellow-500' :
              participant.status === 'approved' ? 'bg-green-500' :
              'bg-red-500'
            }`}>
              {participant.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{participant.name}</h4>
              {participant.email && (
                <p className="text-sm text-gray-600">{participant.email}</p>
              )}
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-500">
                  Joined: {formatJoinTime(participant.joinedAt)}
                </span>
                {participant.ipAddress && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    {participant.ipAddress}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Device Permissions */}
          {participant.devicePermissions && (
            <div className="mt-3 flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Camera className="h-4 w-4 text-gray-400" />
                {getDeviceStatusIcon(participant.devicePermissions.camera)}
              </div>
              <div className="flex items-center space-x-1">
                <Mic className="h-4 w-4 text-gray-400" />
                {getDeviceStatusIcon(participant.devicePermissions.microphone)}
              </div>
              <div className="flex items-center space-x-1">
                <Monitor className="h-4 w-4 text-gray-400" />
                {getDeviceStatusIcon(participant.devicePermissions.screen)}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              participant.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
              participant.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {participant.status === 'waiting' && <Clock className="h-3 w-3 mr-1" />}
              {participant.status === 'approved' && <UserCheck className="h-3 w-3 mr-1" />}
              {participant.status === 'rejected' && <UserX className="h-3 w-3 mr-1" />}
              {participant.status.toUpperCase()}
            </span>
          </div>

          {/* Rejection Reason */}
          {participant.status === 'rejected' && participant.rejectionReason && (
            <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Reason:</strong> {participant.rejectionReason}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && participant.status === 'waiting' && (
          <div className="flex space-x-2 ml-4">
            <motion.button
              onClick={() => handleApprove(participant.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
              title="Approve participant"
            >
              <UserCheck className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => openRejectionModal(participant)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
              title="Reject participant"
            >
              <UserX className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => setSelectedParticipant(participant)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Waiting Participants */}
      {waitingParticipants.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Waiting for Approval ({waitingParticipants.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {waitingParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions={isHost}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Approved Participants */}
      {approvedParticipants.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <UserCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Approved Participants ({approvedParticipants.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {approvedParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions={false}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Rejected Participants */}
      {rejectedParticipants.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <UserX className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Rejected Participants ({rejectedParticipants.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {rejectedParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  showActions={false}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {participants.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No participants yet</h3>
          <p className="text-gray-400">
            Share the session link or code to invite participants
          </p>
        </div>
      )}

      {/* Participant Details Modal */}
      <AnimatePresence>
        {selectedParticipant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedParticipant(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Participant Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-800">{selectedParticipant.name}</p>
                </div>
                
                {selectedParticipant.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-800">{selectedParticipant.email}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Join Time</label>
                  <p className="text-gray-800">
                    {new Date(selectedParticipant.joinedAt).toLocaleString()}
                  </p>
                </div>
                
                {selectedParticipant.ipAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">IP Address</label>
                    <p className="text-gray-800">{selectedParticipant.ipAddress}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Device Permissions</label>
                  <div className="mt-2 space-y-2">
                    {selectedParticipant.devicePermissions && Object.entries(selectedParticipant.devicePermissions).map(([device, hasPermission]) => (
                      <div key={device} className="flex items-center justify-between">
                        <span className="capitalize">{device}</span>
                        {hasPermission ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {isHost && selectedParticipant.status === 'waiting' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedParticipant.id);
                        setSelectedParticipant(null);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedParticipant(null);
                        openRejectionModal(selectedParticipant);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectionModal && participantToReject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRejectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Reject Participant
              </h3>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject <strong>{participantToReject.name}</strong>?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(participantToReject.id, rejectionReason)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaitingRoom;