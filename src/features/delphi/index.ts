/**
 * Delphi - Ticket Sales Forecasting Tool
 *
 * Public API for the Delphi feature module.
 * Import from '@/features/delphi' to access Delphi functionality.
 *
 * @example
 * import { DelphiRoot } from '@/features/delphi';
 * import type { ForecastResult, DelphiChannel } from '@/features/delphi';
 */

// Components
export { DelphiRoot } from './components/DelphiRoot';

// Types
export * from './types';

// Hooks
export * from './hooks';

// Components (internal - not exported from public API)
// ArtistSelector, SocialStatsPanel, ConversionRatesPanel, ForecastResults
// are used internally by DelphiRoot

// Services (add as implemented)
// export * from './services';

// Utils (add as implemented)
// export * from './utils';
