/**
 * DelphiTab - Adapter Component
 *
 * Thin wrapper that integrates the Delphi feature module into Developer Home.
 * All Delphi-specific logic lives in @/features/delphi.
 */

import { DelphiRoot } from '@/features/delphi';

export function DelphiTab() {
  return <DelphiRoot />;
}
