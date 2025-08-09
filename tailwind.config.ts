import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sci-fi color palette
        'neon': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'cyber': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        'matrix': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'space': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        'hologram': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'plasma': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        'quantum': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        background: {
          DEFAULT: '#0a0a0f',
          secondary: '#1a1a2e',
          tertiary: '#16213e',
        },
        foreground: {
          DEFAULT: '#ffffff',
          secondary: '#e2e8f0',
          muted: '#94a3b8',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
        'hologram-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'plasma-bg': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'quantum-bg': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'matrix-bg': 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
        'space-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'neon-glow': 'radial-gradient(circle at center, rgba(0, 255, 255, 0.3) 0%, transparent 70%)',
        'cyber-lines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'cyber-pulse': 'cyber-pulse 4s ease-in-out infinite',
        'hologram-flicker': 'hologram-flicker 0.5s ease-in-out infinite alternate',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'quantum-shift': 'quantum-shift 8s ease-in-out infinite',
        'plasma-wave': 'plasma-wave 3s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 0.3s ease-in-out infinite alternate',
        'cyber-scan': 'cyber-scan 2s linear infinite',
        'hologram-rotate': 'hologram-rotate 10s linear infinite',
        'quantum-pulse': 'quantum-pulse 4s ease-in-out infinite',
        'matrix-flow': 'matrix-flow 15s linear infinite',
        'space-drift': 'space-drift 12s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #0ea5e9, 0 0 10px #0ea5e9, 0 0 15px #0ea5e9' },
          '100%': { boxShadow: '0 0 10px #0ea5e9, 0 0 20px #0ea5e9, 0 0 30px #0ea5e9' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'cyber-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'hologram-flicker': {
          '0%': { opacity: '1', filter: 'brightness(1)' },
          '100%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'matrix-rain': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'quantum-shift': {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(10px) rotate(1deg)' },
          '75%': { transform: 'translateX(-10px) rotate(-1deg)' },
        },
        'plasma-wave': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.1) rotate(180deg)' },
        },
        'neon-flicker': {
          '0%': { opacity: '1', textShadow: '0 0 5px currentColor' },
          '100%': { opacity: '0.8', textShadow: '0 0 10px currentColor, 0 0 20px currentColor' },
        },
        'cyber-scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'hologram-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'quantum-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        'matrix-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'space-drift': {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(5px) translateY(-5px)' },
          '75%': { transform: 'translateX(-5px) translateY(5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon': '0 0 5px #0ea5e9, 0 0 10px #0ea5e9, 0 0 15px #0ea5e9',
        'cyber': '0 0 20px rgba(0, 255, 255, 0.5)',
        'hologram': '0 0 30px rgba(0, 255, 255, 0.3)',
        'plasma': '0 0 25px rgba(255, 0, 255, 0.5)',
        'quantum': '0 0 35px rgba(0, 255, 255, 0.4)',
        'matrix': '0 0 15px rgba(0, 255, 0, 0.6)',
        'space': '0 0 40px rgba(100, 100, 255, 0.3)',
      },
      textShadow: {
        'neon': '0 0 5px currentColor, 0 0 10px currentColor',
        'cyber': '0 0 10px currentColor, 0 0 20px currentColor',
        'hologram': '0 0 15px currentColor, 0 0 30px currentColor',
      },
    },
  },
  plugins: [
    function({ addUtilities }: any) {
      const newUtilities = {
        '.text-shadow-neon': {
          textShadow: '0 0 5px currentColor, 0 0 10px currentColor',
        },
        '.text-shadow-cyber': {
          textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
        },
        '.text-shadow-hologram': {
          textShadow: '0 0 15px currentColor, 0 0 30px currentColor',
        },
        '.cyber-border': {
          border: '1px solid rgba(0, 255, 255, 0.3)',
          boxShadow: 'inset 0 0 10px rgba(0, 255, 255, 0.1)',
        },
        '.hologram-border': {
          border: '1px solid rgba(0, 255, 255, 0.5)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        },
        '.plasma-border': {
          border: '1px solid rgba(255, 0, 255, 0.5)',
          boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
        },
        '.quantum-border': {
          border: '1px solid rgba(0, 255, 255, 0.6)',
          boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)',
        },
        '.matrix-border': {
          border: '1px solid rgba(0, 255, 0, 0.6)',
          boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
        },
        '.space-border': {
          border: '1px solid rgba(100, 100, 255, 0.5)',
          boxShadow: '0 0 20px rgba(100, 100, 255, 0.3)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config;
