import { Link } from '@remix-run/react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  external = false,
  fullWidth = false,
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left'
}: ButtonProps) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-xl';
  
  // Size variations
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-md hover:shadow-primary-lg',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-400 shadow-md hover:shadow-lg',
    tertiary: 'bg-tertiary-500 text-white hover:bg-tertiary-400 shadow-md hover:shadow-lg',
    outline: 'bg-transparent border-2 border-primary-200 text-primary-500 hover:bg-primary-50 hover:border-primary-400',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50'
  };
  
  // Disabled styles
  const disabledStyles = 'opacity-60 cursor-not-allowed';
  
  // Full width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Compute the final class names
  const buttonClasses = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${disabled || isLoading ? disabledStyles : ''}
    ${widthStyle}
    ${className}
  `.trim();
  
  // Loading spinner
  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  // Button content
  const buttonContent = (
    <>
      {isLoading && <LoadingSpinner />}
      {icon && iconPosition === 'left' && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );
  
  // If href is provided, render as a link
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
          onClick={onClick}
        >
          {buttonContent}
        </a>
      );
    }
    
    return (
      <Link
        to={href}
        className={buttonClasses}
        onClick={onClick}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // Otherwise render as a button
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {buttonContent}
    </button>
  );
} 