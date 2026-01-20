import { forwardRef, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

import { cn } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useEventRsvp } from '@/features/events/hooks/useEventRsvp';

interface FmRsvpButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Event ID to RSVP to */
  eventId: string;
  /** Event title for toast messages */
  eventTitle?: string;
  /** Event status - used to include test RSVPs for test events */
  eventStatus?: string;
  /** Past event state - shows 'Past Event' text and disables button */
  isPastEvent?: boolean;
  /** Disable animations (respects prefers-reduced-motion) */
  disableAnimations?: boolean;
}

/**
 * FmRsvpButton - RSVP Button for Free Events
 *
 * A call-to-action button for RSVPing to free events.
 * Features:
 *
 * - Redirects unauthenticated users to sign in
 * - RSVP to events (one-way action - shows confirmed state when done)
 * - Capacity awareness (shows "Event Full" when at capacity)
 * - Loading state during RSVP
 * - Optimistic updates
 * - Fully accessible with keyboard support
 */
export const FmRsvpButton = forwardRef<HTMLButtonElement, FmRsvpButtonProps>(
  (
    {
      eventId,
      eventTitle,
      eventStatus,
      className,
      isPastEvent = false,
      disableAnimations = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { hasRsvp, isFull, isLoading, toggleRsvp, isCheckingRsvp } = useEventRsvp(eventId, eventTitle, eventStatus);

    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Merge refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(buttonRef.current);
        } else {
          ref.current = buttonRef.current;
        }
      }
    }, [ref]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Don't allow clicking if already RSVP'd, disabled, or loading
      if (disabled || isLoading || isCheckingRsvp || hasRsvp) return;

      // If not authenticated, redirect to login
      if (!user) {
        navigate('/auth', { state: { returnTo: window.location.pathname } });
        return;
      }

      // Create ripple effect
      const button = buttonRef.current;
      if (button && !disableAnimations) {
        const rect = button.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const ripple = { x, y, id: Date.now() };
        setRipples(prev => [...prev, ripple]);

        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== ripple.id));
        }, 600);
      }

      toggleRsvp();
    };

    // Determine button state and text
    const isDisabledState = isPastEvent || (isFull && !hasRsvp) || hasRsvp;
    const showLoading = isLoading || isCheckingRsvp;

    const getButtonText = () => {
      if (isPastEvent) return t('buttons.pastEvent');
      if (!user) return t('buttons.signInToRsvp');
      if (showLoading) return t('buttons.processing');
      if (isFull && !hasRsvp) return t('buttons.eventFull');
      if (hasRsvp) return t('buttons.rsvpConfirmed');
      return t('buttons.rsvpNow');
    };

    const getButtonIcon = () => {
      if (showLoading || !user || isPastEvent || (isFull && !hasRsvp)) return null;
      if (hasRsvp) return <Check className="h-4 w-4" />;
      return null;
    };

    // Determine color scheme based on state - gold only, no green/red
    const getColorClasses = () => {
      if (isPastEvent || (isFull && !hasRsvp)) {
        return 'border-border bg-background text-muted-foreground';
      }
      if (hasRsvp) {
        // Confirmed state - frosted gold, disabled appearance
        return 'border-fm-gold/40 bg-fm-gold/10 text-fm-gold/80';
      }
      // Default RSVP state
      return 'border-fm-gold/50 bg-background text-fm-gold hover:border-fm-gold/70 hover:bg-fm-gold/5';
    };

    return (
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || showLoading || isDisabledState}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group relative overflow-hidden',
          'w-full px-8 py-3.5',
          'font-canela text-base font-light tracking-[0.15em] uppercase',
          'transition-all duration-300',
          'focus:outline-none focus-visible:ring-4 focus-visible:ring-fm-gold/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-default',
          // Cursor
          !disabled && !showLoading && !isDisabledState && 'cursor-pointer',
          // Border width
          'border-2',
          // Color scheme
          getColorClasses(),
          // Hover transform - only if not confirmed
          !disabled && !showLoading && !isDisabledState && 'hover:scale-[1.02]',
          // Active state - only if not confirmed
          !disabled && !showLoading && !isDisabledState && 'active:scale-[0.99]',
          className
        )}
        style={{
          boxShadow: isDisabledState
            ? hasRsvp
              ? '0 0 12px rgb(223 186 125 / 0.08), inset 0 0 8px rgb(223 186 125 / 0.03)'
              : 'none'
            : isHovered
              ? '0 0 24px rgb(223 186 125 / 0.2), 0 0 12px rgb(223 186 125 / 0.1), inset 0 0 20px rgb(223 186 125 / 0.06)'
              : '0 0 16px rgb(223 186 125 / 0.12), inset 0 0 12px rgb(223 186 125 / 0.04)',
        }}
        {...props}
      >
        {/* Animated border shimmer - only when not confirmed */}
        {!isDisabledState && !disableAnimations && (
          <div
            className={cn(
              'absolute inset-0 border-2 border-transparent',
              'motion-safe:animate-[border-glow_3s_ease-in-out_infinite]',
              'pointer-events-none opacity-0 group-hover:opacity-100',
              'transition-opacity duration-300'
            )}
            style={{
              background: 'linear-gradient(90deg, transparent, rgb(223 186 125 / 0.3), transparent) border-box',
              WebkitMask:
                'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        )}

        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none animate-ripple bg-fm-gold/30"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {showLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-fm-gold" />
              <span>{t('buttons.processing')}</span>
            </>
          ) : (
            <>
              {getButtonIcon()}
              <span
                className={cn(
                  'transition-all duration-200',
                  isHovered && !disableAnimations && !isDisabledState && 'tracking-[0.18em]'
                )}
              >
                {getButtonText()}
              </span>
            </>
          )}
        </span>
      </button>
    );
  }
);

FmRsvpButton.displayName = 'FmRsvpButton';
