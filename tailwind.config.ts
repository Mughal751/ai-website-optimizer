import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#DCE5FF',
          200: '#BFCFFF',
          300: '#96B1FF',
          400: '#6A8CFF',
          500: '#4F6BFF',
          600: '#3D56F5',
          700: '#3044D4',
          800: '#2738A8',
          900: '#1B2876'
        },
        secondary: {
          50: '#F7F2FF',
          100: '#EEE3FF',
          200: '#DCC2FF',
          300: '#C59CFF',
          400: '#A972FF',
          500: '#8A4DFF',
          600: '#7337F2',
          700: '#5E2ED0',
          800: '#4822A5',
          900: '#31166F'
        },
        accent: {
          50: '#E8FDFF',
          100: '#C8FAFF',
          200: '#9AF3FF',
          300: '#62EAFF',
          400: '#2AD9FF',
          500: '#00C2FF',
          600: '#00A4E5',
          700: '#007FC4',
          800: '#005F96',
          900: '#003F66'
        },
        background: '#070B1A',
        surface: '#0F1426',
        'surface-hover': '#151B32',
        card: '#101827',
        success: '#22C55E',
        warning: '#FBBF24',
        danger: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display-xl': ['72px', { lineHeight: '1.05', fontWeight: '800' }],
        display: ['60px', { lineHeight: '1.08', fontWeight: '800' }],
        h1: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        h2: ['40px', { lineHeight: '1.15', fontWeight: '700' }],
        h3: ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        h4: ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        small: ['12px', { lineHeight: '1.4', fontWeight: '500' }]
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
        '3xl': '48px'
      },
      boxShadow: {
        sm: '0 8px 24px rgba(0,0,0,.25)',
        DEFAULT: '0 20px 60px rgba(0,0,0,.35)',
        lg: '0 40px 120px rgba(0,0,0,.45)',
        'glow-primary': '0 0 40px rgba(79,107,255,.45)',
        'glow-purple': '0 0 60px rgba(138,77,255,.45)',
        'glow-cyan': '0 0 70px rgba(0,194,255,.4)'
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, #4F6BFF, #8A4DFF, #00C2FF)',
        'card-glow': 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.02))',
        'button-gradient': 'linear-gradient(90deg, #4F6BFF, #7B61FF)',
        'text-gradient': 'linear-gradient(90deg, #FFFFFF, #A7B4FF, #71E5FF)'
      },
      backdropBlur: {
        xs: '8px',
        DEFAULT: '20px',
        lg: '32px'
      },
      transitionDuration: {
        fast: '150ms',
        medium: '250ms',
        slow: '400ms',
        page: '600ms'
      },
      maxWidth: {
        content: '1280px',
        page: '1440px'
      },
      spacing: {
        18: '4.5rem'
      }
    }
  },
  plugins: []
};

export default config;
