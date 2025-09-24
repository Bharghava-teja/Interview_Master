import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const Card = React.forwardRef(({ 
  className, 
  variant = 'default',
  interactive = false,
  children,
  ...props 
}, ref) => {
  const variants = {
    default: 'card',
    glass: 'card-glass',
    elevated: 'card bg-elevated shadow-lg',
    outline: 'border-2 border-primary bg-transparent'
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        variants[variant],
        interactive && 'interactive cursor-pointer',
        className
      )}
      whileHover={interactive ? { 
        y: -4,
        boxShadow: 'var(--shadow-xl)'
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      'text-primary',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted', className)}
    {...props}
  />
));

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn('p-6 pt-0', className)} 
    {...props} 
  />
));

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

// Specialized Card Components
const FeatureCard = React.forwardRef(({ 
  icon, 
  title, 
  description, 
  className,
  ...props 
}, ref) => (
  <Card 
    ref={ref}
    variant="glass"
    interactive
    className={cn('group', className)}
    {...props}
  >
    <CardHeader className="text-center">
      {icon && (
        <motion.div 
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>
      )}
      <CardTitle className="group-hover:text-gradient transition-all duration-300">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-center leading-relaxed">
        {description}
      </CardDescription>
    </CardContent>
  </Card>
));

const StatsCard = React.forwardRef(({ 
  label, 
  value, 
  change, 
  trend = 'neutral',
  icon,
  className,
  ...props 
}, ref) => {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <Card 
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">{label}</p>
            <motion.p 
              className="text-3xl font-bold text-primary"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              {value}
            </motion.p>
            {change && (
              <motion.p 
                className={cn('text-sm font-medium', trendColors[trend])}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {change}
              </motion.p>
            )}
          </div>
          {icon && (
            <motion.div 
              className="text-muted opacity-60"
              whileHover={{ scale: 1.1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
          )}
        </div>
      </CardContent>
      
      {/* Decorative gradient */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
    </Card>
  );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';
FeatureCard.displayName = 'FeatureCard';
StatsCard.displayName = 'StatsCard';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  FeatureCard,
  StatsCard
};

export default Card;