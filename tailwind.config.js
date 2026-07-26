/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#0E1116', 800: '#151A21', 700: '#1D242E', 600: '#232C38' },
        line: '#2A3441',
        mist: '#8E9AAA',
        paper: '#E8EDF3',
        hivis: '#F2C200',   // signature accent — high-visibility safety yellow
        signal: '#FF4D3D',  // SLA breached / critical
        go: '#29C393',      // acknowledged / compliant
        info: '#4DA3FF',
      },
      fontFamily: {
        display: ['Oswald', 'Arial Narrow', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.8)',
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,77,61,0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,77,61,0)' },
        },
        slideIn: { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'slide-in': 'slideIn .25s ease-out',
      },
    },
  },
  plugins: [],
};
