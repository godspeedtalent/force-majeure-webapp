import { FmToolbar } from '@/components/common/toolbar/FmToolbar';
import { FmMobileDevToolbar } from '@/components/common/toolbar/mobile/FmMobileDevToolbar';
import { FmMockRoleExitButton } from '@/components/common/buttons/FmMockRoleExitButton';
import { DemoModeOverlay } from '@/features/demo-mode/components/DemoModeOverlay';
import { GlobalSearchWrapper } from '@/components/app';

/**
 * Global UI elements that appear on all pages.
 * Includes toolbar, mobile toolbar, demo mode overlay, and search modal.
 */
export const AppLayout = () => (
  <>
    <FmToolbar />
    <FmMobileDevToolbar />
    <DemoModeOverlay />
    <FmMockRoleExitButton />
    <GlobalSearchWrapper />
  </>
);
