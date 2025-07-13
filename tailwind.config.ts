import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Apple-inspired monochrome palette
      colors: {
        monochrome: {
          'pure-black': '#000000',
          charcoal: '#0a0a0a',
          graphite: '#1a1a1a',
          'slate-dark': '#2a2a2a',
          slate: '#3a3a3a',
          pewter: '#4a4a4a',
          steel: '#5a5a5a',
          ash: '#6a6a6a',
          platinum: '#8a8a8a',
          silver: '#9a9a9a',
          pearl: '#b0b0b0',
          cloud: '#c8c8c8',
          whisper: '#e0e0e0',
          frost: '#f0f0f0',
          snow: '#f8f8f8',
          'pure-white': '#ffffff',
        },
      },
      fontFamily: {
        // Apple's SF Pro equivalent
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      // Refined spacing scale
      spacing: {
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
        '26': '6.5rem', // 104px
        '30': '7.5rem', // 120px
      },
      // Apple-style border radii
      borderRadius: {
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      // Subtle shadows for depth
      boxShadow: {
        micro: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        hairline: '0 0 0 1px rgba(255, 255, 255, 0.1)',
        soft: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        crisp: '0 2px 8px -1px rgba(0, 0, 0, 0.12)',
      },
      // Sophisticated animations
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dots': 'pulseDots 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseDots: {
          '0%, 20%': { opacity: '0.3' },
          '50%': { opacity: '1' },
          '80%, 100%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
