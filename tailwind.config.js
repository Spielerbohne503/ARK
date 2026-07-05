/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Roboto', 'sans-serif'],
      },
      colors: {
        ark: {
          bg: '#0a0e12',
          surface: '#151a21',
          card: '#1f2937',
          accent: '#4ade80',
        },
      },
      keyframes: {
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(48px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        'pin-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35) rotate(-12deg)' },
          '70%': { transform: 'scale(0.9) rotate(6deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
      },
      animation: {
        'modal-in': 'modal-in 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.45s ease-out both',
        'slide-up': 'slide-up 0.3s ease-out',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        'pin-pop': 'pin-pop 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
