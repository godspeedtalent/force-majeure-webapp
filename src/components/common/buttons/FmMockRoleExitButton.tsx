/**
 * FmMockRoleExitButton
 *
 * A floating proximity button that appears only when role simulation is active.
 * Allows users to quickly revert to their actual roles.
 * When clicked, exits simulation AND opens the mock-role tab in the toolbar.
 *
 * Features:
 * - Large fade radius (90vh) for easy access from anywhere on screen
 * - Initial visibility with tooltip when simulation first starts
 * - Sequential fade-out: tooltip fades at 3s, button fades at 6s
 * - Opens the mock-role tab when clicked for quick role switching
 * - Shows all active mock roles in tooltip (supports multi-role)
 */

import { useCallback, useMemo } from 'react';
import { UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMockRoleSafe } from '@/shared/contexts/MockRoleContext';
import { useFmToolbarSafe } from '@/shared/contexts/FmToolbarContext';
import { useRoles } from '@/shared/hooks/useRoles';
import { FmCommonIconButton } from './FmCommonIconButton';
import { FmProximityIconButton } from './FmProximityIconButton';
import { useSequentialFadeOut } from '@/shared/hooks/useSequentialFadeOut';
import { cn, useIsMobile } from '@/shared';

export const FmMockRoleExitButton = () => {
  const { t } = useTranslation('common');
  const { isMockActive, clearMockRole, isUnauthenticated, getActiveMockRoles } = useMockRoleSafe();
  const { openTab } = useFmToolbarSafe();
  const { roles: availableRoles } = useRoles();
  const isMobile = useIsMobile();

  // Sequential fade configuration: tooltip fades at 3s, button fades at 6s
  const fadeElements = useMemo(
    () => [
      { key: 'tooltip', visibleDuration: 3000, fadeDuration: 500 },
      { key: 'button', visibleDuration: 6000, fadeDuration: 1000 },
    ],
    []
  );

  const { elementStates, isActive: isInitialReveal } = useSequentialFadeOut({
    trigger: isMockActive,
    elements: fadeElements,
  });

  // Handle exit: clear mock role AND open the mock-role tab
  const handleExit = useCallback(() => {
    clearMockRole();
    openTab('mock-role');
  }, [clearMockRole, openTab]);

  // Build tooltip text showing all active roles
  const getTooltipText = useCallback((): string => {
    if (isUnauthenticated) {
      return t('mockRole.exitSimulation', { role: t('mockRole.unauthenticated') });
    }

    const activeMockRoles = getActiveMockRoles();
    if (activeMockRoles.length === 0) return '';

    // Get display names for roles
    const roleNames = activeMockRoles.map(roleName => {
      const role = availableRoles.find(r => r.name === roleName);
      return role?.display_name || roleName;
    });

    if (roleNames.length === 1) {
      return t('mockRole.exitSimulation', { role: roleNames[0] });
    }

    return t('mockRole.exitMultiSimulation', { roles: roleNames.join(', ') });
  }, [isUnauthenticated, getActiveMockRoles, availableRoles, t]);

  // Only render when mock role is active
  if (!isMockActive) {
    return null;
  }

  const buttonClasses =
    'bg-black/60 backdrop-blur-sm border-fm-gold text-fm-gold hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold';
  // Position above mobile tab bar (tab bar is ~70px + safe area)
  const positionClasses = isMobile
    ? 'fixed bottom-[90px] right-[20px] z-50'
    : 'fixed bottom-[20px] right-[20px] z-50';
  const tooltipText = getTooltipText();

  // During initial reveal phase, show button with tooltip (both fade sequentially)
  if (isInitialReveal) {
    const tooltipState = elementStates.tooltip;
    const buttonState = elementStates.button;

    // If button has fully faded, switch to proximity behavior
    if (!buttonState?.isVisible) {
      return (
        <FmProximityIconButton
          icon={UserX}
          variant="default"
          size="lg"
          tooltip={tooltipText}
          fadeRadius="90vh"
          onClick={handleExit}
          positionClassName={positionClasses}
          className={buttonClasses}
        />
      );
    }

    return (
      <div
        className={cn(positionClasses, 'animate-in fade-in slide-in-from-bottom-2 duration-300')}
        style={{
          opacity: buttonState?.opacity ?? 1,
          transition: buttonState?.isFading ? 'none' : undefined,
        }}
      >
        {/* Tooltip - styled to match shadcn tooltip */}
        {tooltipState?.isVisible && (
          <div
            className="absolute bottom-full right-0 mb-2 whitespace-nowrap"
            style={{
              opacity: tooltipState.opacity,
              transition: tooltipState.isFading ? 'none' : undefined,
            }}
          >
            <div
              className={cn(
                'z-[10000] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2'
              )}
            >
              {t('mockRole.exitSimulationHint')}
            </div>
          </div>
        )}
        <FmCommonIconButton
          icon={UserX}
          variant="default"
          size="lg"
          onClick={handleExit}
          className={buttonClasses}
        />
      </div>
    );
  }

  // Normal proximity behavior after initial reveal
  return (
    <FmProximityIconButton
      icon={UserX}
      variant="default"
      size="lg"
      tooltip={tooltipText}
      fadeRadius="90vh"
      onClick={handleExit}
      positionClassName={positionClasses}
      className={buttonClasses}
    />
  );
};
