import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../utils/animationUtils';

// Enhanced Typography Components
export const Typography = {
  // Display headings for hero sections
  Display: ({ children, className = '', ...props }) => (
    <motion.h1
      className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none bg-gradient-to-r from-primary-600 via-accent-500 to-primary-800 bg-clip-text text-transparent ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.h1>
  ),

  // Main headings
  H1: ({ children, className = '', ...props }) => (
    <motion.h1
      className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.h1>
  ),

  // Section headings
  H2: ({ children, className = '', ...props }) => (
    <motion.h2
      className={`text-3xl md:text-4xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 leading-snug ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.h2>
  ),

  // Subsection headings
  H3: ({ children, className = '', ...props }) => (
    <motion.h3
      className={`text-2xl md:text-3xl font-medium tracking-tight text-gray-700 dark:text-gray-200 leading-snug ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.h3>
  ),

  // Card/component headings
  H4: ({ children, className = '', ...props }) => (
    <motion.h4
      className={`text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-200 leading-relaxed ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.h4>
  ),

  // Body text variants
  Body: ({ children, size = 'base', className = '', ...props }) => {
    const sizeClasses = {
      sm: 'text-sm leading-relaxed',
      base: 'text-base leading-relaxed',
      lg: 'text-lg leading-relaxed',
      xl: 'text-xl leading-relaxed'
    };
    
    return (
      <motion.p
        className={`${sizeClasses[size]} text-gray-600 dark:text-gray-300 ${className}`}
        variants={fadeInUp}
        {...props}
      >
        {children}
      </motion.p>
    );
  },

  // Lead text for introductions
  Lead: ({ children, className = '', ...props }) => (
    <motion.p
      className={`text-xl md:text-2xl leading-relaxed text-gray-600 dark:text-gray-300 font-light ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.p>
  ),

  // Caption text
  Caption: ({ children, className = '', ...props }) => (
    <motion.span
      className={`text-sm text-gray-500 dark:text-gray-400 leading-normal ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </motion.span>
  ),

  // Label text
  Label: ({ children, className = '', required = false, ...props }) => (
    <motion.label
      className={`text-sm font-medium text-gray-700 dark:text-gray-300 leading-normal ${className}`}
      variants={fadeInUp}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </motion.label>
  )
};

// Enhanced Spacing System
export const Spacing = {
  // Vertical spacing components
  VStack: ({ children, spacing = 'md', className = '', ...props }) => {
    const spacingClasses = {
      xs: 'space-y-2',
      sm: 'space-y-4',
      md: 'space-y-6',
      lg: 'space-y-8',
      xl: 'space-y-12',
      '2xl': 'space-y-16'
    };
    
    return (
      <motion.div
        className={`flex flex-col ${spacingClasses[spacing]} ${className}`}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {children}
      </motion.div>
    );
  },

  // Horizontal spacing components
  HStack: ({ children, spacing = 'md', className = '', ...props }) => {
    const spacingClasses = {
      xs: 'space-x-2',
      sm: 'space-x-4',
      md: 'space-x-6',
      lg: 'space-x-8',
      xl: 'space-x-12',
      '2xl': 'space-x-16'
    };
    
    return (
      <motion.div
        className={`flex items-center ${spacingClasses[spacing]} ${className}`}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {children}
      </motion.div>
    );
  },

  // Section wrapper with consistent spacing
  Section: ({ children, className = '', padding = 'lg', ...props }) => {
    const paddingClasses = {
      sm: 'py-8 px-4',
      md: 'py-12 px-6',
      lg: 'py-16 px-8',
      xl: 'py-20 px-12',
      '2xl': 'py-24 px-16'
    };
    
    return (
      <motion.section
        className={`${paddingClasses[padding]} ${className}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        {...props}
      >
        {children}
      </motion.section>
    );
  },

  // Container with max width and centering
  Container: ({ children, size = 'lg', className = '', ...props }) => {
    const sizeClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full'
    };
    
    return (
      <motion.div
        className={`${sizeClasses[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
        variants={staggerContainer}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
};

// Enhanced Color System with Accessibility
export const ColorSystem = {
  // Status colors with proper contrast
  Status: {
    success: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    error: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  },

  // Interactive states
  Interactive: {
    primary: 'text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:text-primary-800 dark:focus:text-primary-300',
    secondary: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:text-gray-800 dark:focus:text-gray-200',
    accent: 'text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 focus:text-accent-700 dark:focus:text-accent-300'
  },

  // Background variants
  Background: {
    primary: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    secondary: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600',
    accent: 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-700',
    glass: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-white/20 dark:border-gray-700/50'
  }
};

// Accessibility-focused components
export const AccessibilityComponents = {
  // Skip link for keyboard navigation
  SkipLink: ({ href = '#main-content', children = 'Skip to main content' }) => (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md font-medium z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      {children}
    </a>
  ),

  // Focus trap for modals
  FocusTrap: ({ children, className = '' }) => (
    <div
      className={`focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 rounded-lg ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  ),

  // Screen reader only text
  ScreenReaderOnly: ({ children }) => (
    <span className="sr-only">{children}</span>
  ),

  // High contrast mode support
  HighContrastText: ({ children, className = '' }) => (
    <span className={`contrast-more:text-black contrast-more:dark:text-white ${className}`}>
      {children}
    </span>
  )
};

// Enhanced Card Component with proper hierarchy
export const EnhancedCard = ({ 
  children, 
  variant = 'default', 
  elevation = 'md', 
  className = '',
  ...props 
}) => {
  const variants = {
    default: ColorSystem.Background.primary,
    secondary: ColorSystem.Background.secondary,
    accent: ColorSystem.Background.accent,
    glass: ColorSystem.Background.glass
  };

  const elevations = {
    none: '',
    sm: 'shadow-sm hover:shadow-md',
    md: 'shadow-md hover:shadow-lg',
    lg: 'shadow-lg hover:shadow-xl',
    xl: 'shadow-xl hover:shadow-2xl'
  };

  return (
    <motion.div
      className={`rounded-xl border transition-all duration-300 ${variants[variant]} ${elevations[elevation]} ${className}`}
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Button with proper contrast
export const EnhancedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white border-primary-600 hover:border-primary-700 focus:border-primary-700',
    secondary: 'bg-white hover:bg-gray-50 focus:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400 focus:border-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:bg-gray-700 dark:text-white dark:border-gray-600',
    accent: 'bg-accent-600 hover:bg-accent-700 focus:bg-accent-700 text-white border-accent-600 hover:border-accent-700 focus:border-accent-700',
    ghost: 'bg-transparent hover:bg-gray-100 focus:bg-gray-100 text-gray-700 border-transparent dark:hover:bg-gray-800 dark:focus:bg-gray-800 dark:text-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };

  return (
    <motion.button
      className={`inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Usage example component
export const VisualHierarchyShowcase = () => {
  return (
    <Spacing.Section>
      <Spacing.Container>
        <Spacing.VStack spacing="xl">
          <AccessibilityComponents.SkipLink />
          
          <div className="text-center">
            <Typography.Display>Enhanced Design</Typography.Display>
            <Typography.Lead className="mt-6">
              Experience improved visual hierarchy with enhanced typography, spacing, and accessibility.
            </Typography.Lead>
          </div>

          <Spacing.VStack spacing="lg">
            <EnhancedCard variant="accent" elevation="lg" className="p-8">
              <Typography.H2>Typography System</Typography.H2>
              <Typography.Body className="mt-4">
                Our enhanced typography system provides consistent, accessible, and beautiful text rendering
                across all components with proper contrast ratios and responsive sizing.
              </Typography.Body>
              <Spacing.HStack spacing="md" className="mt-6">
                <EnhancedButton variant="primary">Primary Action</EnhancedButton>
                <EnhancedButton variant="secondary">Secondary Action</EnhancedButton>
              </Spacing.HStack>
            </EnhancedCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EnhancedCard elevation="md" className="p-6">
                <Typography.H3>Accessibility First</Typography.H3>
                <Typography.Body size="sm" className="mt-3">
                  All components follow WCAG guidelines with proper focus management and screen reader support.
                </Typography.Body>
              </EnhancedCard>
              
              <EnhancedCard elevation="md" className="p-6">
                <Typography.H3>Consistent Spacing</Typography.H3>
                <Typography.Body size="sm" className="mt-3">
                  Systematic spacing ensures visual rhythm and hierarchy throughout the interface.
                </Typography.Body>
              </EnhancedCard>
              
              <EnhancedCard elevation="md" className="p-6">
                <Typography.H3>Enhanced Contrast</Typography.H3>
                <Typography.Body size="sm" className="mt-3">
                  Optimized color combinations provide excellent readability in all lighting conditions.
                </Typography.Body>
              </EnhancedCard>
            </div>
          </Spacing.VStack>
        </Spacing.VStack>
      </Spacing.Container>
    </Spacing.Section>
  );
};

export default {
  Typography,
  Spacing,
  ColorSystem,
  AccessibilityComponents,
  EnhancedCard,
  EnhancedButton,
  VisualHierarchyShowcase
};