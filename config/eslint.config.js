import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off', // Many globals in browser env
    },
  },
  {
    // TypeScript files - skip ESLint, let tsc handle it
    // TypeScript's compiler provides better type checking
    ignores: [
      '**/*.ts',
      '**/*.tsx',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'supabase/functions/**',
      'scripts/**',
    ],
  },
];
