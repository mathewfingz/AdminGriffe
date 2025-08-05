import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outline';
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', error = false, ...props }, ref) => {
    const baseClasses = 'flex h-12 w-full px-4 py-3 text-sm font-poppins transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-design-foreground-low focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-white border-[3px] border-design-primary-light rounded-lg focus:border-design-primary',
      outline: 'bg-white border border-design-outline-default rounded-lg focus:border-design-primary',
    };

    const errorClasses = error ? 'border-red-500 focus:border-red-500' : '';

    return (
      <input
        className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';