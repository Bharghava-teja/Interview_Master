/**
 * Custom hook for managing onboarding state and user progress
 * Handles first-time user detection, onboarding completion tracking, and preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ONBOARDING_STORAGE_KEYS = {
  COMPLETED: 'onboarding_completed',
  COMPLETED_DATE: 'onboarding_completed_date',
  SKIPPED: 'onboarding_skipped',
  PREFERENCES: 'onboarding_preferences',
  PROGRESS: 'onboarding_progress',
  USER_JOURNEY: 'user_journey_data'
};

const DEFAULT_PREFERENCES = {
  showAnimations: true,
  autoAdvance: false,
  skipIntroduction: false,
  reminderFrequency: 'weekly', // never, weekly, monthly
  preferredTutorialSpeed: 'normal' // slow, normal, fast
};

const useOnboarding = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [onboardingPreferences, setOnboardingPreferences] = useState(DEFAULT_PREFERENCES);
  const [userJourney, setUserJourney] = useState({
    signupDate: null,
    firstLogin: null,
    interviewsCompleted: 0,
    featuresUsed: [],
    lastActiveDate: null
  });
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // Load preferences and journey data from localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(ONBOARDING_STORAGE_KEYS.PREFERENCES);
      if (savedPreferences) {
        setOnboardingPreferences({
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(savedPreferences)
        });
      }

      const savedJourney = localStorage.getItem(ONBOARDING_STORAGE_KEYS.USER_JOURNEY);
      if (savedJourney) {
        setUserJourney(JSON.parse(savedJourney));
      }
    } catch (error) {
      console.warn('Failed to load onboarding data from localStorage:', error);
    }
  }, []);

  // Determine if onboarding should be shown
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShouldShowOnboarding(false);
      return;
    }

    const isOnboardingCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED) === 'true';
    const isOnboardingSkipped = localStorage.getItem(ONBOARDING_STORAGE_KEYS.SKIPPED) === 'true';
    
    // Check if this is a first-time user
    const isFirstTimeUser = isFirstTime();
    
    // Check if user should see onboarding reminder
    const shouldShowReminder = shouldShowOnboardingReminder();
    
    // Show onboarding if:
    // 1. First-time user and hasn't completed or skipped
    // 2. User explicitly requested it
    // 3. Reminder conditions are met
    const shouldShow = (
      (isFirstTimeUser && !isOnboardingCompleted && !isOnboardingSkipped) ||
      shouldShowReminder
    );
    
    setShouldShowOnboarding(shouldShow);
  }, [isAuthenticated, user]);

  // Update user journey data
  useEffect(() => {
    if (isAuthenticated && user) {
      updateUserJourney({
        lastActiveDate: new Date().toISOString()
      });
    }
  }, [isAuthenticated, user]);

  // Check if this is a first-time user
  const isFirstTime = useCallback(() => {
    if (!user) return false;
    
    // Check various indicators of first-time usage
    const hasCompletedInterview = localStorage.getItem('has_completed_interview') === 'true';
    const hasVisitedDashboard = localStorage.getItem('has_visited_dashboard') === 'true';
    const accountAge = user.createdAt ? 
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0; // days
    
    // Consider first-time if:
    // - Account is less than 1 day old
    // - Never completed an interview
    // - Never visited dashboard
    return accountAge < 1 || (!hasCompletedInterview && !hasVisitedDashboard);
  }, [user]);

  // Check if onboarding reminder should be shown
  const shouldShowOnboardingReminder = useCallback(() => {
    const reminderFrequency = onboardingPreferences.reminderFrequency;
    if (reminderFrequency === 'never') return false;
    
    const lastReminderDate = localStorage.getItem('last_onboarding_reminder');
    if (!lastReminderDate) return false;
    
    const daysSinceReminder = (Date.now() - new Date(lastReminderDate).getTime()) / (1000 * 60 * 60 * 24);
    
    switch (reminderFrequency) {
      case 'weekly':
        return daysSinceReminder >= 7;
      case 'monthly':
        return daysSinceReminder >= 30;
      default:
        return false;
    }
  }, [onboardingPreferences.reminderFrequency]);

  // Show onboarding modal
  const showOnboarding = useCallback(() => {
    setIsOnboardingVisible(true);
    trackOnboardingEvent('onboarding_started');
  }, []);

  // Hide onboarding modal
  const hideOnboarding = useCallback(() => {
    setIsOnboardingVisible(false);
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.COMPLETED, 'true');
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.COMPLETED_DATE, new Date().toISOString());
    localStorage.removeItem(ONBOARDING_STORAGE_KEYS.SKIPPED);
    
    setIsOnboardingVisible(false);
    setShouldShowOnboarding(false);
    
    updateUserJourney({
      onboardingCompletedDate: new Date().toISOString()
    });
    
    trackOnboardingEvent('onboarding_completed');
  }, []);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEYS.SKIPPED, 'true');
    localStorage.setItem('last_onboarding_reminder', new Date().toISOString());
    
    setIsOnboardingVisible(false);
    setShouldShowOnboarding(false);
    
    trackOnboardingEvent('onboarding_skipped');
  }, []);

  // Reset onboarding (for testing or user request)
  const resetOnboarding = useCallback(() => {
    Object.values(ONBOARDING_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    setOnboardingPreferences(DEFAULT_PREFERENCES);
    setUserJourney({
      signupDate: null,
      firstLogin: null,
      interviewsCompleted: 0,
      featuresUsed: [],
      lastActiveDate: null
    });
    
    setShouldShowOnboarding(true);
    trackOnboardingEvent('onboarding_reset');
  }, []);

  // Update preferences
  const updatePreferences = useCallback((newPreferences) => {
    const updatedPreferences = {
      ...onboardingPreferences,
      ...newPreferences
    };
    
    setOnboardingPreferences(updatedPreferences);
    localStorage.setItem(
      ONBOARDING_STORAGE_KEYS.PREFERENCES,
      JSON.stringify(updatedPreferences)
    );
  }, [onboardingPreferences]);

  // Update user journey data
  const updateUserJourney = useCallback((updates) => {
    const updatedJourney = {
      ...userJourney,
      ...updates
    };
    
    setUserJourney(updatedJourney);
    localStorage.setItem(
      ONBOARDING_STORAGE_KEYS.USER_JOURNEY,
      JSON.stringify(updatedJourney)
    );
  }, [userJourney]);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName) => {
    const featuresUsed = userJourney.featuresUsed || [];
    if (!featuresUsed.includes(featureName)) {
      updateUserJourney({
        featuresUsed: [...featuresUsed, featureName]
      });
    }
  }, [userJourney.featuresUsed, updateUserJourney]);

  // Track interview completion
  const trackInterviewCompletion = useCallback((interviewType) => {
    localStorage.setItem('has_completed_interview', 'true');
    updateUserJourney({
      interviewsCompleted: (userJourney.interviewsCompleted || 0) + 1,
      lastInterviewDate: new Date().toISOString(),
      lastInterviewType: interviewType
    });
    trackOnboardingEvent('interview_completed', { type: interviewType });
  }, [userJourney.interviewsCompleted, updateUserJourney]);

  // Track dashboard visit
  const trackDashboardVisit = useCallback(() => {
    localStorage.setItem('has_visited_dashboard', 'true');
    trackFeatureUsage('dashboard');
  }, [trackFeatureUsage]);

  // Generic event tracking
  const trackOnboardingEvent = useCallback((eventName, data = {}) => {
    // This could be extended to send analytics data to a backend service
    console.log('Onboarding Event:', eventName, {
      userId: user?.id,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Store locally for now
    const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
    events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      ...data
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('onboarding_events', JSON.stringify(events));
  }, [user?.id]);

  // Get onboarding status
  const getOnboardingStatus = useCallback(() => {
    return {
      isCompleted: localStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED) === 'true',
      isSkipped: localStorage.getItem(ONBOARDING_STORAGE_KEYS.SKIPPED) === 'true',
      completedDate: localStorage.getItem(ONBOARDING_STORAGE_KEYS.COMPLETED_DATE),
      isFirstTime: isFirstTime(),
      shouldShow: shouldShowOnboarding
    };
  }, [isFirstTime, shouldShowOnboarding]);

  // Auto-show onboarding for eligible users
  useEffect(() => {
    if (shouldShowOnboarding && !isOnboardingVisible) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        showOnboarding();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isOnboardingVisible, showOnboarding]);

  return {
    // State
    isOnboardingVisible,
    shouldShowOnboarding,
    onboardingPreferences,
    userJourney,
    
    // Actions
    showOnboarding,
    hideOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    updatePreferences,
    
    // Tracking
    trackFeatureUsage,
    trackInterviewCompletion,
    trackDashboardVisit,
    trackOnboardingEvent,
    
    // Utilities
    isFirstTime,
    getOnboardingStatus
  };
};

export { useOnboarding };
export default useOnboarding;