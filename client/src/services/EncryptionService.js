class EncryptionService {
  constructor() {
    this.keyPairs = new Map(); // Store key pairs for sessions
    this.sharedKeys = new Map(); // Store shared encryption keys
  }

  // Generate RSA key pair for session
  async generateKeyPair() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      return keyPair;
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  // Generate AES key for symmetric encryption
  async generateAESKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      return key;
    } catch (error) {
      console.error('Failed to generate AES key:', error);
      throw error;
    }
  }

  // Export public key for sharing
  async exportPublicKey(publicKey) {
    try {
      const exported = await window.crypto.subtle.exportKey('spki', publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(exported)));
    } catch (error) {
      console.error('Failed to export public key:', error);
      throw error;
    }
  }

  // Import public key from base64 string
  async importPublicKey(publicKeyString) {
    try {
      const keyData = Uint8Array.from(atob(publicKeyString), c => c.charCodeAt(0));
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
      return publicKey;
    } catch (error) {
      console.error('Failed to import public key:', error);
      throw error;
    }
  }

  // Encrypt data with RSA public key
  async encryptWithPublicKey(data, publicKey) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        encodedData
      );
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
      console.error('Failed to encrypt with public key:', error);
      throw error;
    }
  }

  // Decrypt data with RSA private key
  async decryptWithPrivateKey(encryptedData, privateKey) {
    try {
      const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedBytes
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt with private key:', error);
      throw error;
    }
  }

  // Encrypt data with AES key
  async encryptWithAES(data, key) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Failed to encrypt with AES:', error);
      throw error;
    }
  }

  // Decrypt data with AES key
  async decryptWithAES(encryptedData, key) {
    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12); // Extract IV
      const encrypted = combined.slice(12); // Extract encrypted data
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt with AES:', error);
      throw error;
    }
  }

  // Initialize encryption for a session
  async initializeSessionEncryption(sessionId) {
    try {
      const keyPair = await this.generateKeyPair();
      const aesKey = await this.generateAESKey();
      
      this.keyPairs.set(sessionId, keyPair);
      this.sharedKeys.set(sessionId, aesKey);
      
      return {
        publicKey: await this.exportPublicKey(keyPair.publicKey),
        sessionId
      };
    } catch (error) {
      console.error('Failed to initialize session encryption:', error);
      throw error;
    }
  }

  // Get session encryption keys
  getSessionKeys(sessionId) {
    return {
      keyPair: this.keyPairs.get(sessionId),
      sharedKey: this.sharedKeys.get(sessionId)
    };
  }

  // Encrypt media stream data (for WebRTC)
  async encryptMediaData(data, sessionId) {
    const keys = this.getSessionKeys(sessionId);
    if (!keys.sharedKey) {
      throw new Error('No encryption key found for session');
    }
    
    return await this.encryptWithAES(data, keys.sharedKey);
  }

  // Decrypt media stream data (for WebRTC)
  async decryptMediaData(encryptedData, sessionId) {
    const keys = this.getSessionKeys(sessionId);
    if (!keys.sharedKey) {
      throw new Error('No decryption key found for session');
    }
    
    return await this.decryptWithAES(encryptedData, keys.sharedKey);
  }

  // Clean up session keys
  cleanupSession(sessionId) {
    this.keyPairs.delete(sessionId);
    this.sharedKeys.delete(sessionId);
  }

  // Generate secure random session token
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Hash data with SHA-256
  async hashData(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  // Verify data integrity
  async verifyIntegrity(data, expectedHash) {
    const actualHash = await this.hashData(data);
    return actualHash === expectedHash;
  }
}

const encryptionService = new EncryptionService();
export default encryptionService;