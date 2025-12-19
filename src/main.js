import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// Initialize Supabase
import './lib/supabase';
// Initialize i18n before React renders
import './i18n/config';
import './index.css';
import App from './App';
// Loading fallback for translations
const TranslationLoader = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-black", children: _jsx("div", { className: "animate-pulse text-white/50", children: "Loading..." }) }));
createRoot(document.getElementById('root')).render(_jsx(Suspense, { fallback: _jsx(TranslationLoader, {}), children: _jsx(App, {}) }));
