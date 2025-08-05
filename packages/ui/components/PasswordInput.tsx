import * as React from 'react';
import { Input, InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showPasswordToggle?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', showPasswordToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    if (!showPasswordToggle) {
      return <Input type="password" className={className} ref={ref} {...props} />;
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={`pr-12 ${className}`}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-design-foreground-low hover:text-design-foreground-default transition-colors"
          tabIndex={-1}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {showPassword ? (
              // Eye slash icon (password hidden)
              <>
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </>
            ) : (
              // Eye icon (password visible)
              <>
                <path d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </>
            )}
          </svg>
          <span className="sr-only">
            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </span>
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';