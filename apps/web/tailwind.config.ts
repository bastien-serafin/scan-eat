import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0f766e',
        accent: '#f97316'
      }
    }
  },
  plugins: []
};

export default config;
