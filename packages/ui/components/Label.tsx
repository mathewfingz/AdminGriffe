import * as React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', required = false, children, ...props }, ref) => {
    const baseClasses = 'block font-poppins font-normal text-base text-design-foreground-default capitalize';

    return (
      <label
        className={`${baseClasses} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';