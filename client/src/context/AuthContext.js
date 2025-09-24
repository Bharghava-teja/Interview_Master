import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [retryCount, setRetryCount] = useState(0);

  // Check server health and validate token with retry logic
  const validateToken = async (storedToken, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setConnectionStatus('connecting');
        
        // First check if server is healthy
        const healthResponse = await fetch('/api/health', {
          timeout: 5000,
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Server responded with status: ${healthResponse.status}`);
        }
        
        // Then validate the token
        const response = await userAPI.getProfile();
        setConnectionStatus('connected');
        setRetryCount(0);
        return { isValid: true, userData: response.data };
        
      } catch (error) {
        console.log(`Token validation attempt ${attempt}/${maxRetries} failed:`, error.message);
        setRetryCount(attempt);
        
        if (attempt === maxRetries) {
          setConnectionStatus('disconnected');
          return { isValid: false, userData: null, error: error.message };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          // Validate the stored token with the server
          const validation = await validateToken(storedToken);
          
          if (validation.isValid) {
            // Token is valid, set user and token
            setToken(storedToken);
            setUser(validation.userData);
          } else {
            // Token is invalid, clear stored data
            console.log('Stored token is invalid, clearing authentication data');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error during authentication initialization:', error);
        // Clear stored data on error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    try {
      setUser(userData);
      setToken(token);
      setConnectionStatus('connected');
      setRetryCount(0);
      
      // Store with error handling
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      
      console.log('User logged in successfully:', userData.email);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Force clear all stored authentication data
  const forceLogout = () => {
    logout();
    // Also clear any other potential stored data
    localStorage.removeItem('examProgress');
    localStorage.removeItem('interviewData');
    sessionStorage.clear();
  };

  const value = {
    user,
    token,
    login,
    logout,
    forceLogout,
    loading,
    connectionStatus,
    retryCount,
    isAuthenticated: !!token,
    validateToken, // Expose for manual validation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};