import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        morning: '#0f766e',
        afternoon: '#b45309',
        rest: '#475569',
        annual: '#1d4ed8',
        medical: '#be123c',
        oil: '#6d28d9',
        recalled: '#166534',
        ink: '#0f172a',
        mist: '#f8fafc'
      },
      boxShadow: {
        panel: '0 10px 30px -18px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
} satisfies Config;
