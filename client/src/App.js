import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ThemeSwitcher from './components/ThemeSwitcher';
import ConnectionMonitor from './components/ConnectionMonitor';
import { SkipLinks } from './components/AccessibleNavigation';

// Lazy load page components for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const Profile = React.lazy(() => import('./pages/Profile'));
const InterviewSelection = React.lazy(() => import('./pages/InterviewSelection'));
const ResumeInterview = React.lazy(() => import('./pages/ResumeInterview'));
const ResumeEvaluationPage = React.lazy(() => import('./pages/ResumeEvaluationPage'));
const MockInterviewPage = React.lazy(() => import('./pages/MockInterviewPage'));
const FeedbackPage = React.lazy(() => import('./pages/FeedbackPage'));
const SecureInterviewPage = React.lazy(() => import('./pages/SecureInterviewPage'));
const JoinInterviewPage = React.lazy(() => import('./pages/JoinInterviewPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const IndustrySpecificTests = React.lazy(() => import('./components/IndustrySpecificTests'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div 
    className="min-h-screen flex items-center justify-center"
    role="status"
    aria-label="Loading content"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
    <span className="ml-3 text-lg">Loading...</span>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/" /> : children;
};

function AppRoutes() {
  const location = useLocation();
  
  // Hide navbar during exam pages
  const isExamPage = ['/resume-interview', '/mock-interview', '/secure-interview', '/join-interview'].includes(location.pathname) || 
                     location.pathname.startsWith('/join-interview/');
  
  return (
    <div className="flex flex-col min-h-screen">
      <SkipLinks />
      <ConnectionMonitor />
      {!isExamPage && (
        <header role="banner">
          <Navbar />
        </header>
      )}
      {!isExamPage && <ThemeSwitcher />}
      <main 
        id="main-content"
        className={`flex-grow ${!isExamPage ? 'pt-20' : ''}`}
        role="main"
        tabIndex={-1}
        style={{
          paddingTop: !isExamPage ? '5rem' : '0'
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interview-selection" 
            element={
              <ProtectedRoute>
                <InterviewSelection />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/resume-interview" 
            element={
              <ProtectedRoute>
                <ResumeInterview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resume-evaluation" 
            element={
              <ProtectedRoute>
                <ResumeEvaluationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mock-interview" 
            element={
              <ProtectedRoute>
                <MockInterviewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feedback" 
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secure-interview" 
            element={<SecureInterviewPage />} 
          />
          <Route 
            path="/join-interview" 
            element={<JoinInterviewPage />} 
          />
          <Route 
            path="/join-interview/:sessionId" 
            element={<JoinInterviewPage />} 
          />
          <Route 
            path="/industry-tests" 
            element={
              <ProtectedRoute>
                <IndustrySpecificTests />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AppRoutes />
        </Router>
    </AuthProvider>
  );
}

export default App;