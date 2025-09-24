import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Button variants using CSS custom properties
const buttonVariants = {
  variant: {
    default: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    outline: 'border-2 border-current bg-transparent hover:bg-current hover:text-white',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto'
  },
  size: {
    default: 'btn',
    sm: 'px-3 py-2 text-sm',
    lg: 'px-8 py-3 text-base',
    icon: 'h-10 w-10 p-0'
  }
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'default', 
  asChild = false,
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  const Comp = asChild ? motion.div : motion.button;
  
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cn(
        // Base button styles
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'relative overflow-hidden',
        
        // Variant styles
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        
        // Loading state
        loading && 'cursor-wait',
        
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-current/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </motion.div>
      )}
      
      <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
    </Comp>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;