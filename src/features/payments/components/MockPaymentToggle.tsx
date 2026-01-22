/**
 * MockPaymentToggle - Floating toggle for mock payment mode
 *
 * Only visible to admin and developer users.
 * Allows bypassing real Stripe payments for testing purposes.
 */

import { useState } from 'react';
import { CreditCard, ChevronRight, ChevronLeft, Zap, XCircle } from 'lucide-react';
import { cn } from '@/shared';
import { useMockPaymentStore } from '@/shared/stores/mockPaymentStore';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';

export const MockPaymentToggle = () => {
  const { hasAnyRole } = useUserPermissions();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isMockMode,
    simulateFailure,
    toggleMockMode,
    toggleSimulateFailure,
  } = useMockPaymentStore();

  // Only show for admin or developer users
  const canAccess = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  if (!canAccess) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-1/2 -translate-y-1/2 z-50',
        'transition-all duration-300 ease-in-out',
        isExpanded ? 'translate-x-0' : '-translate-x-[calc(100%-40px)]'
      )}
    >
      <div
        className={cn(
          'flex items-stretch',
          'bg-background/80 backdrop-blur-md',
          'border border-white/20 rounded-r-none',
          'shadow-lg shadow-black/30'
        )}
      >
        {/* Main content panel */}
        <div
          className={cn(
            'flex flex-col gap-[10px] p-[10px]',
            'transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Mock Mode Toggle */}
          <button
            onClick={toggleMockMode}
            className={cn(
              'flex items-center gap-[10px] px-[10px] py-[5px] rounded-none',
              'text-xs font-medium uppercase tracking-wider',
              'transition-all duration-200',
              'border',
              isMockMode
                ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                : 'bg-transparent border-white/20 text-muted-foreground hover:border-white/40'
            )}
          >
            <Zap className='h-3.5 w-3.5' />
            <span className='whitespace-nowrap'>Mock payments</span>
            <div
              className={cn(
                'w-8 h-4 rounded-full relative transition-colors duration-200',
                isMockMode ? 'bg-fm-gold' : 'bg-white/20'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200',
                  isMockMode
                    ? 'left-[calc(100%-14px)] bg-black'
                    : 'left-0.5 bg-white/60'
                )}
              />
            </div>
          </button>

          {/* Simulate Failure Toggle (only when mock mode is on) */}
          {isMockMode && (
            <button
              onClick={toggleSimulateFailure}
              className={cn(
                'flex items-center gap-[10px] px-[10px] py-[5px] rounded-none',
                'text-xs font-medium uppercase tracking-wider',
                'transition-all duration-200',
                'border',
                simulateFailure
                  ? 'bg-fm-danger/20 border-fm-danger text-fm-danger'
                  : 'bg-transparent border-white/20 text-muted-foreground hover:border-white/40'
              )}
            >
              <XCircle className='h-3.5 w-3.5' />
              <span className='whitespace-nowrap'>Simulate failure</span>
              <div
                className={cn(
                  'w-8 h-4 rounded-full relative transition-colors duration-200',
                  simulateFailure ? 'bg-fm-danger' : 'bg-white/20'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200',
                    simulateFailure
                      ? 'left-[calc(100%-14px)] bg-black'
                      : 'left-0.5 bg-white/60'
                  )}
                />
              </div>
            </button>
          )}
        </div>

        {/* Toggle button (always visible) */}
        <FmPortalTooltip
          content={isExpanded ? 'Collapse' : 'Mock payment options'}
          side='right'
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-[10px] py-[20px]',
              'border-l border-white/10',
              'hover:bg-white/5 transition-colors duration-200',
              isMockMode && 'bg-fm-gold/10'
            )}
          >
            <CreditCard
              className={cn(
                'h-4 w-4',
                isMockMode ? 'text-fm-gold' : 'text-muted-foreground'
              )}
            />
            {isMockMode && (
              <div className='w-1.5 h-1.5 rounded-full bg-fm-gold animate-pulse' />
            )}
            {isExpanded ? (
              <ChevronLeft className='h-3 w-3 text-muted-foreground' />
            ) : (
              <ChevronRight className='h-3 w-3 text-muted-foreground' />
            )}
          </button>
        </FmPortalTooltip>
      </div>
    </div>
  );
};
