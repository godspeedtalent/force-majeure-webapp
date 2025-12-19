import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react-swc';
import { defineConfig, PluginOption } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optionally load lovable-tagger if available (Lovable environment)
let componentTagger: (() => PluginOption) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  componentTagger = require('lovable-tagger').componentTagger;
} catch {
  // lovable-tagger not installed, skip it
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger && componentTagger(),
  ].filter(Boolean),
  css: {
    postcss: path.resolve(__dirname, './postcss.config.js'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-tooltip',
          ],
          // Data & state management
          'vendor-data': [
            '@tanstack/react-query',
            '@supabase/supabase-js',
            'zustand',
          ],
          // Charts & visualization
          'vendor-charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          // Forms & validation
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          // Utilities
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
          // Stripe
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          // Drag and drop
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Markdown
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
}));
