import encryptionService from './EncryptionService';

class WebRTCService {
  constructor() {
    this.peerConnections = new Map(); // sessionId -> RTCPeerConnection
    this.localStreams = new Map(); // sessionId -> MediaStream
    this.remoteStreams = new Map(); // sessionId -> MediaStream[]
    this.dataChannels = new Map(); // sessionId -> RTCDataChannel
    this.encryptionEnabled = true;
    
    // STUN/TURN servers configuration
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for production
    ];
  }

  // Initialize WebRTC for a session
  async initializeSession(sessionId, isHost = false) {
    try {
      // Initialize encryption for the session
      if (this.encryptionEnabled) {
        await encryptionService.initializeSessionEncryption(sessionId);
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
      });

      // Set up event handlers
      this.setupPeerConnectionHandlers(peerConnection, sessionId);

      // Create data channel for encrypted messaging
      if (isHost) {
        const dataChannel = peerConnection.createDataChannel('secure-channel', {
          ordered: true,
        });
        this.setupDataChannelHandlers(dataChannel, sessionId);
        this.dataChannels.set(sessionId, dataChannel);
      }

      this.peerConnections.set(sessionId, peerConnection);
      
      return peerConnection;
    } catch (error) {
      console.error('Failed to initialize WebRTC session:', error);
      throw error;
    }
  }

  // Set up peer connection event handlers
  setupPeerConnectionHandlers(peerConnection, sessionId) {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(sessionId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      this.onRemoteStream(sessionId, event.streams[0]);
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannelHandlers(dataChannel, sessionId);
      this.dataChannels.set(sessionId, dataChannel);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${sessionId}:`, peerConnection.connectionState);
      this.onConnectionStateChange(sessionId, peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${sessionId}:`, peerConnection.iceConnectionState);
    };
  }

  // Set up data channel handlers
  setupDataChannelHandlers(dataChannel, sessionId) {
    dataChannel.onopen = () => {
      console.log(`Data channel opened for session ${sessionId}`);
    };

    dataChannel.onmessage = async (event) => {
      try {
        let message = event.data;
        
        // Decrypt message if encryption is enabled
        if (this.encryptionEnabled) {
          message = await encryptionService.decryptMediaData(message, sessionId);
        }
        
        const data = JSON.parse(message);
        this.onDataChannelMessage(sessionId, data);
      } catch (error) {
        console.error('Failed to process data channel message:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error for session ${sessionId}:`, error);
    };
  }

  // Get user media with constraints
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  // Add local stream to peer connection
  async addLocalStream(sessionId, stream) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    this.localStreams.set(sessionId, stream);
    return stream;
  }

  // Create offer for host
  async createOffer(sessionId) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  // Create answer for participant
  async createAnswer(sessionId, offer) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  // Set remote description
  async setRemoteDescription(sessionId, description) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.setRemoteDescription(description);
    } catch (error) {
      console.error('Failed to set remote description:', error);
      throw error;
    }
  }

  // Add ICE candidate
  async addIceCandidate(sessionId, candidate) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      throw new Error('Peer connection not found');
    }

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  // Send encrypted message through data channel
  async sendSecureMessage(sessionId, message) {
    const dataChannel = this.dataChannels.get(sessionId);
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not available');
    }

    try {
      let messageData = JSON.stringify(message);
      
      // Encrypt message if encryption is enabled
      if (this.encryptionEnabled) {
        messageData = await encryptionService.encryptMediaData(messageData, sessionId);
      }
      
      dataChannel.send(messageData);
    } catch (error) {
      console.error('Failed to send secure message:', error);
      throw error;
    }
  }

  // Toggle video track
  toggleVideo(sessionId, enabled) {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        return enabled;
      }
    }
    return false;
  }

  // Toggle audio track
  toggleAudio(sessionId, enabled) {
    const stream = this.localStreams.get(sessionId);
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        return enabled;
      }
    }
    return false;
  }

  // Get connection statistics
  async getConnectionStats(sessionId) {
    const peerConnection = this.peerConnections.get(sessionId);
    if (!peerConnection) {
      return null;
    }

    try {
      const stats = await peerConnection.getStats();
      const connectionStats = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
      };

      stats.forEach(report => {
        if (report.type === 'inbound-rtp') {
          connectionStats.bytesReceived += report.bytesReceived || 0;
          connectionStats.packetsReceived += report.packetsReceived || 0;
        } else if (report.type === 'outbound-rtp') {
          connectionStats.bytesSent += report.bytesSent || 0;
          connectionStats.packetsSent += report.packetsSent || 0;
        }
      });

      return connectionStats;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return null;
    }
  }

  // Close session and cleanup
  closeSession(sessionId) {
    // Close peer connection
    const peerConnection = this.peerConnections.get(sessionId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(sessionId);
    }

    // Stop local stream
    const localStream = this.localStreams.get(sessionId);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      this.localStreams.delete(sessionId);
    }

    // Clean up remote streams
    this.remoteStreams.delete(sessionId);

    // Close data channel
    const dataChannel = this.dataChannels.get(sessionId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(sessionId);
    }

    // Clean up encryption keys
    if (this.encryptionEnabled) {
      encryptionService.cleanupSession(sessionId);
    }
  }

  // Event handlers (to be overridden by implementing class)
  onIceCandidate(sessionId, candidate) {
    // Override this method to handle ICE candidates
    console.log('ICE candidate for session', sessionId, candidate);
  }

  onRemoteStream(sessionId, stream) {
    // Override this method to handle remote streams
    console.log('Remote stream for session', sessionId, stream);
    
    const remoteStreams = this.remoteStreams.get(sessionId) || [];
    remoteStreams.push(stream);
    this.remoteStreams.set(sessionId, remoteStreams);
  }

  onConnectionStateChange(sessionId, state) {
    // Override this method to handle connection state changes
    console.log('Connection state changed for session', sessionId, state);
  }

  onDataChannelMessage(sessionId, message) {
    // Override this method to handle data channel messages
    console.log('Data channel message for session', sessionId, message);
  }

  // Get local stream for session
  getLocalStream(sessionId) {
    return this.localStreams.get(sessionId);
  }

  // Get remote streams for session
  getRemoteStreams(sessionId) {
    return this.remoteStreams.get(sessionId) || [];
  }

  // Check if encryption is enabled
  isEncryptionEnabled() {
    return this.encryptionEnabled;
  }

  // Enable/disable encryption
  setEncryptionEnabled(enabled) {
    this.encryptionEnabled = enabled;
  }
}

const webRTCService = new WebRTCService();
export default webRTCService;