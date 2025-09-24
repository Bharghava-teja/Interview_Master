import { v4 as uuidv4 } from 'uuid';

class SecureInterviewService {
  constructor() {
    this.sessions = new Map();
    this.baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
  }

  // Generate a unique session code (6-digit alphanumeric)
  generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Generate a unique session ID
  generateSessionId() {
    return uuidv4();
  }

  // Create a new secure interview session
  createSession(hostInfo = {}) {
    const sessionId = this.generateSessionId();
    const sessionCode = this.generateSessionCode();
    const timestamp = new Date().toISOString();
    
    const session = {
      id: sessionId,
      code: sessionCode,
      hostId: hostInfo.hostId || 'anonymous-host',
      hostName: hostInfo.hostName || 'Interview Host',
      hostEmail: hostInfo.hostEmail || null,
      createdAt: timestamp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      status: 'created', // created, active, ended, expired
      participants: [],
      waitingRoom: [],
      settings: {
        maxParticipants: hostInfo.maxParticipants || 10,
        requireApproval: hostInfo.requireApproval !== false, // default true
        recordSession: hostInfo.recordSession || false,
        enableChat: hostInfo.enableChat !== false, // default true
        enableScreenShare: hostInfo.enableScreenShare || false,
        violationMonitoring: hostInfo.violationMonitoring !== false, // default true
        endToEndEncryption: true, // always enabled
      },
      security: {
        encryptionKey: this.generateEncryptionKey(),
        violations: [],
        riskScore: 0,
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  // Generate encryption key for the session
  generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate shareable link for the session
  generateSessionLink(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return `${this.baseUrl}/secure-interview/join/${session.code}`;
  }

  // Generate QR code data for the session
  generateQRCodeData(sessionId) {
    return this.generateSessionLink(sessionId);
  }

  // Validate session code and return session info
  validateSessionCode(code) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.code === code) {
        // Check if session is expired
        if (new Date() > new Date(session.expiresAt)) {
          session.status = 'expired';
          return { valid: false, reason: 'Session expired', session: null };
        }
        
        // Check if session is ended
        if (session.status === 'ended') {
          return { valid: false, reason: 'Session ended', session: null };
        }
        
        return { valid: true, session };
      }
    }
    
    return { valid: false, reason: 'Invalid session code', session: null };
  }

  // Get session by ID
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  // Approve participant from waiting room
  approveParticipant(sessionId, participantId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participantIndex = session.waitingRoom.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      throw new Error('Participant not found in waiting room');
    }

    const participant = session.waitingRoom.splice(participantIndex, 1)[0];
    participant.status = 'approved';
    participant.approvedAt = new Date().toISOString();
    session.participants.push(participant);

    return participant;
  }

  // Reject participant from waiting room
  rejectParticipant(sessionId, participantId, reason = 'Not approved') {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participantIndex = session.waitingRoom.findIndex(p => p.id === participantId);
    if (participantIndex === -1) {
      throw new Error('Participant not found in waiting room');
    }

    const participant = session.waitingRoom.splice(participantIndex, 1)[0];
    participant.status = 'rejected';
    participant.rejectedAt = new Date().toISOString();
    participant.rejectionReason = reason;

    // Add to rejected list for tracking
    if (!session.rejectedParticipants) {
      session.rejectedParticipants = [];
    }
    session.rejectedParticipants.push(participant);

    return participant;
  }

  // Get waiting room participants
  getWaitingRoomParticipants(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session.waitingRoom || [];
  }

  // Add participant to waiting room
  addToWaitingRoom(sessionId, participantInfo) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participant = {
      id: uuidv4(),
      name: participantInfo.name || 'Anonymous',
      email: participantInfo.email || null,
      joinedAt: new Date().toISOString(),
      status: 'waiting', // waiting, approved, rejected
      deviceInfo: participantInfo.deviceInfo || {},
      ipAddress: participantInfo.ipAddress || null,
    };

    session.waitingRoom.push(participant);
    return participant;
  }

  // Start the interview session
  startSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'active';
    session.startedAt = new Date().toISOString();
    return session;
  }

  // End the interview session
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    return session;
  }

  // Record security violation
  recordViolation(sessionId, participantId, violationType, details = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const violation = {
      id: uuidv4(),
      participantId,
      type: violationType, // multiple_faces, no_face, looking_away, secondary_device, etc.
      timestamp: new Date().toISOString(),
      details,
      severity: this.calculateViolationSeverity(violationType),
    };

    session.security.violations.push(violation);
    session.security.riskScore = this.calculateRiskScore(session.security.violations);

    // Auto-actions based on risk score
    if (session.security.riskScore > 80) {
      this.handleHighRiskViolation(sessionId, participantId, violation);
    }

    return violation;
  }

  // Calculate violation severity (1-10 scale)
  calculateViolationSeverity(violationType) {
    const severityMap = {
      'multiple_faces': 8,
      'no_face': 6,
      'looking_away': 4,
      'secondary_device': 9,
      'suspicious_activity': 7,
      'network_anomaly': 5,
    };
    
    return severityMap[violationType] || 5;
  }

  // Calculate overall risk score for the session
  calculateRiskScore(violations) {
    if (violations.length === 0) return 0;
    
    const recentViolations = violations.filter(v => 
      new Date() - new Date(v.timestamp) < 5 * 60 * 1000 // last 5 minutes
    );
    
    const totalSeverity = recentViolations.reduce((sum, v) => sum + v.severity, 0);
    const avgSeverity = totalSeverity / Math.max(recentViolations.length, 1);
    const frequencyMultiplier = Math.min(recentViolations.length / 5, 2); // max 2x multiplier
    
    return Math.min(avgSeverity * frequencyMultiplier * 10, 100);
  }

  // Handle high-risk violations
  handleHighRiskViolation(sessionId, participantId, violation) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Find participant
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return;

    // Mark participant as high-risk
    participant.riskLevel = 'high';
    participant.lastViolation = violation;

    // Notify host about high-risk participant
    this.notifyHost(sessionId, {
      type: 'high_risk_participant',
      participantId,
      participant,
      violation,
      riskScore: session.security.riskScore,
    });
  }

  // Notify host (placeholder for real-time notifications)
  notifyHost(sessionId, notification) {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    console.log(`Host notification for session ${sessionId}:`, notification);
  }

  // Get session statistics
  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      sessionId,
      code: session.code,
      status: session.status,
      duration: session.startedAt ? 
        Math.floor((new Date() - new Date(session.startedAt)) / 1000) : 0,
      participantCount: session.participants.length,
      waitingRoomCount: session.waitingRoom.length,
      violationCount: session.security.violations.length,
      riskScore: session.security.riskScore,
      createdAt: session.createdAt,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
    };
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > new Date(session.expiresAt)) {
        session.status = 'expired';
        // Optionally remove from memory after some time
        if (now - new Date(session.expiresAt) > 24 * 60 * 60 * 1000) { // 24 hours after expiry
          this.sessions.delete(sessionId);
        }
      }
    }
  }
}

// Create singleton instance
const secureInterviewService = new SecureInterviewService();

// Auto-cleanup expired sessions every hour
setInterval(() => {
  secureInterviewService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

export default secureInterviewService;