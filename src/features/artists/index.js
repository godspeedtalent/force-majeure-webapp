/**
 * Artists Feature Module
 *
 * Exports all types, services, and hooks for artist and genre management
 */
// Types
export * from './types';
// Services
export * as genreService from './services/genreService';
export * as artistService from './services/artistService';
// Hooks
export * from './hooks/useGenres';
export * from './hooks/useArtistGenres';
