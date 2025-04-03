import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  theme: { 
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          light: '#8da2fb',
          dark: '#5a6fd9',
          darkest: '#434d8f',
        },
        accent: {
          DEFAULT: '#ffd166',
          light: '#ffdc85',
          dark: '#e6bc5c'
        }
      }
    } 
  },
  plugins: [],
  // Production optimizations
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Disable variants that aren't used to reduce CSS size
  corePlugins: {
    preflight: true,
  }
} satisfies Config; 