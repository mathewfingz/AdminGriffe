import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'google';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-poppins font-bold text-base transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantClasses = {
      primary: 'bg-design-primary hover:bg-blue-600 text-design-surface',
      secondary: 'bg-design-primary-light hover:bg-blue-100 text-design-primary',
      outline: 'border border-design-outline-default hover:bg-design-primary-light text-design-primary',
      google: 'bg-design-primary-light hover:bg-blue-100 text-design-primary',
    };

    const sizeClasses = {
      sm: 'h-10 px-3 text-sm',
      md: 'h-12 px-4 py-3',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';