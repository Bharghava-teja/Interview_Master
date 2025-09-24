const crypto = require('crypto');
const { fingerprintCache } = require('../config/redis');

/**
 * Generate browser fingerprint from request headers and client data
 */
const generateFingerprint = (req, clientData = {}) => {
  const components = {
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    connection: req.headers['connection'] || '',
    dnt: req.headers['dnt'] || '',
    // Client-side data (sent from frontend)
    screenResolution: (clientData && clientData.screenResolution) || '',
    timezone: (clientData && clientData.timezone) || '',
    language: (clientData && clientData.language) || '',
    platform: (clientData && clientData.platform) || '',
    cookieEnabled: (clientData && clientData.cookieEnabled) || '',
    doNotTrack: (clientData && clientData.doNotTrack) || '',
    canvas: (clientData && clientData.canvas) || '',
    webgl: (clientData && clientData.webgl) || ''
  };

  // Create a hash of all components
  const fingerprintString = Object.values(components).join('|');
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

/**
 * Middleware to capture and verify browser fingerprints
 */
const fingerprintMiddleware = (options = {}) => {
  const {
    requireFingerprint = false,
    skipPaths = ['/api/auth/login', '/api/auth/signup', '/api/health'],
    maxFingerprintAge = 24 * 60 * 60 * 1000 // 24 hours
  } = options;

  return async (req, res, next) => {
    try {
      // Skip fingerprinting for certain paths
      if (skipPaths.some(path => req.path.includes(path))) {
        return next();
      }

      const clientData = (req.body && req.body.fingerprint) || req.headers['x-fingerprint-data'];
      let fingerprintData = null;

      if (clientData) {
        try {
          fingerprintData = typeof clientData === 'string' ? JSON.parse(clientData) : clientData;
        } catch (error) {
          console.warn('Invalid fingerprint data format:', error.message);
        }
      }

      // Generate fingerprint
      const fingerprint = generateFingerprint(req, fingerprintData);
      req.fingerprint = fingerprint;

      // If user is authenticated, verify fingerprint
      if (req.user && req.user.id) {
        const verification = await fingerprintCache.verifyFingerprint(req.user.id, fingerprint);
        
        if (!verification.valid) {
          // Log suspicious activity
          console.warn(`Fingerprint verification failed for user ${req.user.id}:`, verification.reason);
          
          // Store the new fingerprint but flag as suspicious
          await fingerprintCache.setFingerprint(req.user.id, fingerprint, req.sessionID);
          
          // Add warning to request for audit logging
          req.fingerprintWarning = {
            reason: verification.reason,
            timestamp: Date.now(),
            newFingerprint: fingerprint
          };
          
          // Optionally require re-authentication for sensitive operations
          if (requireFingerprint && req.path.includes('/exam/')) {
            return res.status(403).json({
              error: 'Device verification required',
              code: 'FINGERPRINT_MISMATCH',
              message: 'Your device fingerprint has changed. Please log in again for security.'
            });
          }
        }
      }

      // For login/signup, we'll store the fingerprint after successful authentication
      next();
    } catch (error) {
      console.error('Fingerprinting middleware error:', error);
      // Don't block the request on fingerprinting errors
      next();
    }
  };
};

/**
 * Store fingerprint after successful authentication
 */
const storeFingerprint = async (userId, req) => {
  try {
    if (req.fingerprint) {
      await fingerprintCache.setFingerprint(userId, req.fingerprint, req.sessionID);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error storing fingerprint:', error);
    return false;
  }
};

/**
 * Get client-side fingerprinting script
 */
const getFingerprintingScript = () => {
  return `
    (function() {
      function generateClientFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint test', 2, 2);
        
        const webgl = (function() {
          try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return '';
            return gl.getParameter(gl.RENDERER) + '|' + gl.getParameter(gl.VENDOR);
          } catch (e) {
            return '';
          }
        })();
        
        return {
          screenResolution: screen.width + 'x' + screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled.toString(),
          doNotTrack: navigator.doNotTrack || '',
          canvas: canvas.toDataURL(),
          webgl: webgl
        };
      }
      
      // Store fingerprint data for API requests
      window.browserFingerprint = generateClientFingerprint();
      
      // Add to axios defaults if available
      if (window.axios) {
        window.axios.defaults.headers.common['X-Fingerprint-Data'] = JSON.stringify(window.browserFingerprint);
      }
    })();
  `;
};

/**
 * Endpoint to serve fingerprinting script
 */
const serveFingerprintScript = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.send(getFingerprintingScript());
};

/**
 * Detect potential security violations based on fingerprint changes
 */
const detectFingerprintViolations = async (userId, currentFingerprint, sessionId) => {
  try {
    const stored = await fingerprintCache.getFingerprint(userId);
    
    if (!stored) {
      return { violation: false, type: 'no_baseline' };
    }
    
    if (stored.fingerprint !== currentFingerprint) {
      // Check if this is a rapid change (potential session hijacking)
      const timeDiff = Date.now() - stored.lastSeen;
      const isRapidChange = timeDiff < 5 * 60 * 1000; // Less than 5 minutes
      
      return {
        violation: true,
        type: isRapidChange ? 'rapid_fingerprint_change' : 'fingerprint_change',
        severity: isRapidChange ? 'high' : 'medium',
        details: {
          previousFingerprint: stored.fingerprint,
          currentFingerprint,
          timeDifference: timeDiff,
          previousSession: stored.sessionId,
          currentSession: sessionId
        }
      };
    }
    
    return { violation: false, type: 'match' };
  } catch (error) {
    console.error('Error detecting fingerprint violations:', error);
    return { violation: false, type: 'error' };
  }
};

module.exports = {
  generateFingerprint,
  fingerprintMiddleware,
  storeFingerprint,
  getFingerprintingScript,
  serveFingerprintScript,
  detectFingerprintViolations
};