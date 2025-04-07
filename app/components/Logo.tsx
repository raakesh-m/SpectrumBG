import { Link } from '@remix-run/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  color?: 'light' | 'dark';
  className?: string;
}

export default function Logo({ size = 'md', showText = true, color = 'dark', className = '' }: LogoProps) {
  // Size mapping
  const sizeMap = {
    sm: { icon: 'h-8 w-8', text: 'text-base', label: 'text-xs' },
    md: { icon: 'h-10 w-10', text: 'text-lg', label: 'text-xs' },
    lg: { icon: 'h-14 w-14', text: 'text-2xl', label: 'text-sm' }
  };
  
  // Color mapping
  const colorMap = {
    light: { text: 'text-white', label: 'text-white text-opacity-80' },
    dark: { text: 'text-neutral-900', label: 'text-neutral-500' }
  };
  
  return (
    <Link to="/" className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeMap[size].icon} relative rounded-lg shadow-primary-sm overflow-hidden`}>
        <img 
          src="/images/logo-spectrum-bg.svg" 
          alt="SpectrumBG" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {showText && (
        <div>
          <h1 className={`${sizeMap[size].text} font-bold font-primary ${colorMap[color].text}`}>SpectrumBG</h1>
          <p className={`${sizeMap[size].label} ${colorMap[color].label} -mt-1`}>Product Customizer</p>
        </div>
      )}
    </Link>
  );
} 