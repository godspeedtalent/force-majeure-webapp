import type { Config } from 'tailwindcss';

import { themeConfig } from '../src/config/tailwind/theme';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: '',
  theme: themeConfig,
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
