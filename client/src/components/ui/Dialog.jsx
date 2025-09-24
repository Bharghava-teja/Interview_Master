import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const Dialog = ({ 
  open = false, 
  onOpenChange, 
  children 
}) => {
  const [isOpen, setIsOpen] = React.useState(open);
  
  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);
  
  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };
  
  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogContext = React.createContext({});

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

const DialogTrigger = React.forwardRef(({ 
  className, 
  children, 
  asChild = false,
  ...props 
}, ref) => {
  const { onOpenChange } = useDialog();
  const Comp = asChild ? React.Fragment : 'button';
  
  const handleClick = () => {
    onOpenChange(true);
  };
  
  if (asChild) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick
    });
  }
  
  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Comp>
  );
});

const DialogPortal = ({ children }) => {
  return createPortal(children, document.body);
};

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  const { onOpenChange } = useDialog();
  
  return (
    <motion.div
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-overlay backdrop-blur-sm',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef(({ 
  className, 
  children, 
  showClose = true,
  ...props 
}, ref) => {
  const { open, onOpenChange } = useDialog();
  const contentRef = useRef(null);
  
  // Focus management
  useEffect(() => {
    if (open && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [open]);
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);
  
  return (
    <DialogPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DialogOverlay />
            <motion.div
              ref={contentRef}
              className={cn(
                'relative z-50 w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg',
                'focus:outline-none',
                className
              )}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                duration: 0.2 
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              {...props}
            >
              {children}
              {showClose && (
                <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="sr-only">Close</span>
                </DialogClose>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogPortal>
  );
});

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
));

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
));

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-primary', className)}
    {...props}
  />
));

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted', className)}
    {...props}
  />
));

const DialogClose = React.forwardRef(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useDialog();
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  );
});

// Specialized Dialog Components
const AlertDialog = ({ 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  ...props 
}) => {
  const variantStyles = {
    default: 'btn-primary',
    destructive: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose className="btn-secondary">
            {cancelText}
          </DialogClose>
          <DialogClose 
            className={cn('btn', variantStyles[variant])}
            onClick={onConfirm}
          >
            {confirmText}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

Dialog.displayName = 'Dialog';
DialogTrigger.displayName = 'DialogTrigger';
DialogContent.displayName = 'DialogContent';
DialogHeader.displayName = 'DialogHeader';
DialogFooter.displayName = 'DialogFooter';
DialogTitle.displayName = 'DialogTitle';
DialogDescription.displayName = 'DialogDescription';
DialogClose.displayName = 'DialogClose';
AlertDialog.displayName = 'AlertDialog';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  AlertDialog
};

export default Dialog;