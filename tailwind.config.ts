import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#EFEEFE',
          100: '#C5BEF8',
          200: '#9384EF',
          300: '#624AE6',
          400: '#4424D0',
          500: '#361AAE',
          600: '#2A1393',
          700: '#1D0B78',
          800: '#0F0261',
          900: '#030046',
        },
        // Secondary colors (orange)
        secondary: {
          100: '#FFE6DB',
          200: '#FFCAB4',
          300: '#FFA988',
          400: '#FF8A5A',
          500: '#FF6B2C',
        },
        // Tertiary colors (teal)
        tertiary: {
          100: '#E0F9F4',
          300: '#8BEED6',
          500: '#1DDEBB',
        },
        // Neutral colors
        neutral: {
          50: '#F4F4F8',
          100: '#DCDCE0',
          200: '#BABABF',
          300: '#9292A0',
          400: '#71717F',
          500: '#50505F',
          600: '#40404F',
          700: '#2D2D3D',
          800: '#1E1E2D',
          900: '#121219',
        },
      },
      fontFamily: {
        primary: ['Montserrat', 'sans-serif'],
        secondary: ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
        '8xl': '6rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 24px 0 rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 12px 32px 0 rgba(0, 0, 0, 0.06)',
        'primary-sm': '0 2px 8px 0 rgba(54, 26, 174, 0.2)',
        'primary-md': '0 4px 16px 0 rgba(54, 26, 174, 0.2)',
        'primary-lg': '0 8px 24px 0 rgba(54, 26, 174, 0.25)',
        'primary-xl': '0 12px 32px 0 rgba(54, 26, 174, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'slide-left': 'slideLeft 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.5s ease-out forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--color-primary-700) 0%, var(--color-primary-500) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, var(--color-secondary-500) 0%, var(--color-primary-400) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
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