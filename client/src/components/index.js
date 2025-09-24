/**
 * Component Library Index
 * Centralized exports for all UI components and utilities
 */

// Animation utilities
export { default as useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
export * from '../utils/animationUtils';

// Core UI Components
export { default as AnimationPerformanceMonitor } from './AnimationPerformanceMonitor';
export { default as ErrorBoundary, ErrorProvider, useError, withErrorBoundary, useAsyncError, AsyncErrorBoundary } from './ErrorBoundary';
export { default as LoadingStates } from './LoadingStates';
export { default as ToastNotification, ToastProvider, useToast } from './ToastNotification';
export { default as InteractiveElements } from './InteractiveElements';
export { default as ThemeSwitcher } from './ThemeSwitcher';

// Theme System
export { default as ThemeContext, ThemeProvider, useTheme, ThemeTransition } from '../contexts/ThemeContext';

// Re-export existing components for convenience
export { default as Navbar } from './Navbar';
export { default as Footer } from './Footer';
export { default as Form } from './Form';
export { default as Dashboard } from './Dashboard';
export { default as Profile } from './Profile';
export { default as LandingPage } from './LandingPage';
export { default as LoginPage } from './LoginPage';
export { default as ContactPage } from './ContactPage';
export { default as AboutPage } from './AboutPage';

// Interview Components
export { default as InterviewSelection } from './InterviewSelection';
export { default as AdvancedMCQSection } from './AdvancedMCQSection';
export { default as AdvancedTechnicalInterview } from './AdvancedTechnicalInterview';
export { default as OnboardingSystem } from './OnboardingSystem';
export { default as TutorialOverlay } from './TutorialOverlay';