import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConnectionMonitor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverStatus, setServerStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const { connectionStatus, retryCount, validateToken } = useAuth();

  // Check server connectivity
  const checkServerHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('connected');
        setLastCheck(new Date());
        return true;
      } else {
        setServerStatus('error');
        return false;
      }
    } catch (error) {
      console.log('Server health check failed:', error.message);
      setServerStatus('disconnected');
      return false;
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      checkServerHealth();
      
      // Hide status after 3 seconds if connection is stable
      setTimeout(() => {
        if (serverStatus === 'connected') {
          setShowStatus(false);
        }
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setServerStatus('disconnected');
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerHealth, serverStatus]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) {
        checkServerHealth();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, checkServerHealth]);

  // Initial health check
  useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

  // Show status when there are connection issues
  useEffect(() => {
    if (connectionStatus === 'disconnected' || retryCount > 0 || !isOnline) {
      setShowStatus(true);
    }
  }, [connectionStatus, retryCount, isOnline]);

  // Manual retry function
  const handleRetry = async () => {
    setServerStatus('checking');
    const isHealthy = await checkServerHealth();
    
    if (isHealthy && validateToken) {
      const token = localStorage.getItem('token');
      if (token) {
        await validateToken(token);
      }
    }
  };

  // Get status info
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        message: 'No internet connection',
        action: null
      };
    }

    switch (serverStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 border-green-200',
          message: 'Connected to server',
          action: null
        };
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          message: 'Checking server connection...',
          action: null
        };
      case 'disconnected':
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 border-orange-200',
          message: 'Server connection issues detected',
          action: handleRetry
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  if (!showStatus || !statusInfo) {
    return null;
  }

  const Icon = statusInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${statusInfo.bgColor}`}>
          <Icon 
            className={`w-5 h-5 ${statusInfo.color} ${serverStatus === 'checking' ? 'animate-spin' : ''}`} 
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {statusInfo.message}
            </span>
            {lastCheck && serverStatus === 'connected' && (
              <span className="text-xs text-gray-500">
                Last checked: {lastCheck.toLocaleTimeString()}
              </span>
            )}
            {retryCount > 0 && (
              <span className="text-xs text-gray-500">
                Retry attempts: {retryCount}
              </span>
            )}
          </div>
          
          {statusInfo.action && (
            <button
              onClick={statusInfo.action}
              className="ml-2 px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
            >
              Retry
            </button>
          )}
          
          <button
            onClick={() => setShowStatus(false)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConnectionMonitor;