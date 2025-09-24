import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Input } from './Input';
import { Button } from './Button';

const FormContext = React.createContext({});

const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a Form');
  }
  return context;
};

const Form = ({ 
  onSubmit, 
  className, 
  children, 
  validation = {},
  initialValues = {},
  ...props 
}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const validateField = (name, value) => {
    const fieldValidation = validation[name];
    if (!fieldValidation) return null;
    
    for (const rule of fieldValidation) {
      const error = rule(value, values);
      if (error) return error;
    }
    return null;
  };
  
  const validateForm = () => {
    const newErrors = {};
    Object.keys(validation).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validation).forEach(name => {
      allTouched[name] = true;
    });
    setTouched(allTouched);
    
    if (validateForm()) {
      try {
        await onSubmit?.(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  };
  
  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  const setFieldTouched = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field when it becomes touched
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const contextValue = {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    validateField
  };
  
  return (
    <FormContext.Provider value={contextValue}>
      <motion.form
        className={cn('space-y-6', className)}
        onSubmit={handleSubmit}
        noValidate
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.form>
    </FormContext.Provider>
  );
};

const FormField = ({ 
  name, 
  children, 
  className 
}) => {
  const { values, errors, touched, setValue, setFieldTouched } = useFormContext();
  
  const fieldProps = {
    name,
    value: values[name] || '',
    error: touched[name] ? errors[name] : null,
    onChange: (e) => setValue(name, e.target.value),
    onBlur: () => setFieldTouched(name)
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {React.cloneElement(children, fieldProps)}
    </div>
  );
};

const FormItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props} />
));

const FormLabel = React.forwardRef(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      'text-gray-700 dark:text-gray-300',
      className
    )}
    {...props}
  >
    {props.children}
    {required && (
      <span className="ml-1 text-red-500" aria-label="required">
        *
      </span>
    )}
  </label>
));

const FormControl = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('relative', className)} {...props} />
));

const FormDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted', className)}
    {...props}
  />
));

const FormMessage = React.forwardRef(({ className, children, ...props }, ref) => {
  if (!children) return null;
  
  return (
    <AnimatePresence>
      <motion.p
        ref={ref}
        className={cn('text-sm font-medium text-red-600 dark:text-red-400', className)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {children}
      </motion.p>
    </AnimatePresence>
  );
});

const FormSubmit = React.forwardRef(({ 
  className, 
  children = 'Submit',
  loadingText = 'Submitting...',
  ...props 
}, ref) => {
  const { isSubmitting } = useFormContext();
  
  return (
    <Button
      ref={ref}
      type="submit"
      loading={isSubmitting}
      className={cn('w-full', className)}
      {...props}
    >
      {isSubmitting ? loadingText : children}
    </Button>
  );
});

// Validation helpers
const validators = {
  required: (message = 'This field is required') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },
  
  email: (message = 'Please enter a valid email address') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },
  
  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  pattern: (regex, message = 'Invalid format') => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },
  
  custom: (validator, message) => (value, allValues) => {
    if (!validator(value, allValues)) {
      return message;
    }
    return null;
  }
};

// Specialized Form Components
const LoginForm = ({ onSubmit, className, ...props }) => {
  const validation = {
    email: [validators.required(), validators.email()],
    password: [validators.required(), validators.minLength(6)]
  };
  
  return (
    <Form 
      validation={validation} 
      onSubmit={onSubmit}
      className={cn('max-w-md mx-auto', className)}
      {...props}
    >
      <FormField name="email">
        <Input 
          type="email" 
          placeholder="Enter your email"
          label="Email"
          required
        />
      </FormField>
      
      <FormField name="password">
        <Input 
          type="password" 
          placeholder="Enter your password"
          label="Password"
          required
        />
      </FormField>
      
      <FormSubmit>Sign In</FormSubmit>
    </Form>
  );
};

const ContactForm = ({ onSubmit, className, ...props }) => {
  const validation = {
    name: [validators.required()],
    email: [validators.required(), validators.email()],
    message: [validators.required(), validators.minLength(10)]
  };
  
  return (
    <Form 
      validation={validation} 
      onSubmit={onSubmit}
      className={className}
      {...props}
    >
      <FormField name="name">
        <Input 
          placeholder="Your name"
          label="Name"
          required
        />
      </FormField>
      
      <FormField name="email">
        <Input 
          type="email" 
          placeholder="your.email@example.com"
          label="Email"
          required
        />
      </FormField>
      
      <FormField name="message">
        <textarea 
          className="input min-h-[120px] resize-y"
          placeholder="Your message..."
          rows={5}
        />
      </FormField>
      
      <FormSubmit>Send Message</FormSubmit>
    </Form>
  );
};

Form.displayName = 'Form';
FormField.displayName = 'FormField';
FormItem.displayName = 'FormItem';
FormLabel.displayName = 'FormLabel';
FormControl.displayName = 'FormControl';
FormDescription.displayName = 'FormDescription';
FormMessage.displayName = 'FormMessage';
FormSubmit.displayName = 'FormSubmit';
LoginForm.displayName = 'LoginForm';
ContactForm.displayName = 'ContactForm';

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSubmit,
  LoginForm,
  ContactForm,
  validators
};

export default Form;