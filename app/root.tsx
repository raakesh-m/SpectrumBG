import { LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import './tailwind.css';

export const links: LinksFunction = () => [
  // Modern stylesheets and fonts
  { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap' },
  
  // Favicons and app icons
  { rel: 'icon', type: 'image/svg+xml', href: '/images/favicon.svg' },
  { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/images/logo-small.svg' },
];

// Define global styles with new color palette and enhanced styles
const globalStyles = `
  :root {
    --color-primary-900: #030046;
    --color-primary-800: #0F0261;
    --color-primary-700: #1D0B78;
    --color-primary-600: #2A1393;
    --color-primary-500: #361AAE;
    --color-primary-400: #4424D0;
    --color-primary-300: #624AE6;
    --color-primary-200: #9384EF;
    --color-primary-100: #C5BEF8;
    --color-primary-50: #EFEEFE;
    
    --color-secondary-500: #FF6B2C;
    --color-secondary-400: #FF8A5A;
    --color-secondary-300: #FFA988;
    --color-secondary-200: #FFCAB4;
    --color-secondary-100: #FFE6DB;
    
    --color-tertiary-500: #1DDEBB;
    --color-tertiary-300: #8BEED6;
    --color-tertiary-100: #E0F9F4;
    
    --color-neutral-900: #121219;
    --color-neutral-800: #1E1E2D;
    --color-neutral-700: #2D2D3D;
    --color-neutral-600: #40404F;
    --color-neutral-500: #50505F;
    --color-neutral-400: #71717F;
    --color-neutral-300: #9292A0;
    --color-neutral-200: #BABABF;
    --color-neutral-100: #DCDCE0;
    --color-neutral-50: #F4F4F8;
    
    --font-primary: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-secondary: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  /* Base styles */
  body {
    font-family: var(--font-secondary);
    color: var(--color-neutral-800);
    background-color: var(--color-neutral-50);
    overflow-x: hidden;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-primary);
    font-weight: 700;
    color: var(--color-neutral-900);
  }
  
  /* Text styles for better visibility */
  .text-heading {
    color: var(--color-neutral-900);
    font-weight: 700;
  }
  
  .text-subheading {
    color: var(--color-neutral-800);
    font-weight: 600;
  }
  
  .text-body {
    color: var(--color-neutral-800);
  }
  
  /* Enhanced gradient backgrounds */
  .gradient-primary {
    background: linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-500) 100%);
  }
  
  .gradient-primary-intense {
    background: linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-600) 100%);
  }
  
  .gradient-accent {
    background: linear-gradient(135deg, var(--color-secondary-500) 0%, var(--color-primary-400) 100%);
  }
  
  .gradient-subtle {
    background: linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-primary-50) 100%);
  }
  
  /* Animation classes */
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  
  .animate-float-slow {
    animation: float 8s ease-in-out infinite;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Glass morphism effects */
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  }
  
  .glass-dark {
    background: rgba(30, 30, 45, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
  }
  
  /* Advanced button styles */
  .btn-primary {
    background-color: var(--color-primary-800);
    color: white;
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px 0 rgba(29, 11, 120, 0.4);
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-900);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(3, 0, 70, 0.5);
  }
  
  .btn-primary:active {
    transform: translateY(1px);
  }
  
  .btn-secondary {
    background-color: var(--color-secondary-500);
    color: white;
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px 0 rgba(255, 107, 44, 0.3);
  }
  
  .btn-secondary:hover {
    background-color: #ff5a15;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px 0 rgba(255, 107, 44, 0.4);
  }
  
  .btn-outline {
    background-color: transparent;
    color: var(--color-primary-700);
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid var(--color-primary-300);
    transition: all 0.3s ease;
  }
  
  .btn-outline:hover {
    background-color: var(--color-primary-50);
    border-color: var(--color-primary-500);
    color: var(--color-primary-800);
    transform: translateY(-2px);
  }
  
  /* Modern form elements */
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--color-neutral-200);
    background-color: white;
    transition: all 0.3s ease;
  }
  
  .form-input:focus {
    border-color: var(--color-primary-300);
    box-shadow: 0 0 0 4px var(--color-primary-100);
    outline: none;
  }
  
  /* Background option selector */
  .bg-option {
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  
  .bg-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary-400);
  }
  
  .bg-option.selected {
    border-width: 2px;
    border-color: var(--color-primary-700);
    box-shadow: 0 0 0 3px var(--color-primary-100);
  }
  
  .bg-option::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-primary-500);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .bg-option:hover::after {
    opacity: 0.08;
  }
`;

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SpectrumAI • Advanced Product Customizer</title>
        <Meta />
        <Links />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
} 