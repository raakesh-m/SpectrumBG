import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outline' | 'glass' | 'dark';
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ 
  children, 
  variant = 'default', 
  className = '',
  padding = 'md'
}: CardProps) {
  // Base styles
  const baseStyles = 'rounded-xl overflow-hidden';
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white border border-neutral-100',
    elevated: 'bg-white border border-neutral-100 shadow-soft-lg',
    outline: 'bg-white border-2 border-neutral-200',
    glass: 'bg-white/70 backdrop-blur-md border border-white/50 shadow-soft-lg',
    dark: 'bg-neutral-800 border border-neutral-700 text-white'
  };
  
  // Padding styles
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };
  
  // Compute the final class name
  const cardClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${className}
  `.trim();
  
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
}

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

export function CardHeader({ children, className = '', divider = true }: CardHeaderProps) {
  const baseClasses = 'px-5 py-4';
  const dividerClass = divider ? 'border-b border-neutral-100' : '';
  
  return (
    <div className={`${baseClasses} ${dividerClass} ${className}`}>
      {children}
    </div>
  );
}

// Card Body component
interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}

export function CardFooter({ children, className = '', divider = true }: CardFooterProps) {
  const baseClasses = 'px-5 py-4';
  const dividerClass = divider ? 'border-t border-neutral-100' : '';
  
  return (
    <div className={`${baseClasses} ${dividerClass} ${className}`}>
      {children}
    </div>
  );
} 