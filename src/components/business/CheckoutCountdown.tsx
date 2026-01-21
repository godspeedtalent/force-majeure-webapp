import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { logger } from '@/shared';

const CRITICAL_THRESHOLD = 120; // 2 minutes
const DANGER_THRESHOLD = 10; // 10 seconds

interface CheckoutCountdownProps {
  onExpire: () => void;
  redirectUrl?: string;
}

export const CheckoutCountdown = ({
  onExpire,
  redirectUrl,
}: CheckoutCountdownProps) => {
  const { t } = useTranslation('toasts');
  const { checkoutDuration } = useCheckoutTimer();

  // Use the duration from context (in seconds)
  const initialDuration = useMemo(() => checkoutDuration, [checkoutDuration]);

  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration);

  // Use refs to track cleanup state and interval/timeout IDs
  const isMountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable callback refs
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const handleExpiration = useCallback(() => {
    toast.error(t('checkout.ticketsReturned'), {
      description: t('checkout.reselectTickets'),
      className: 'bg-[hsl(348,60%,20%)]/90 border-[hsl(348,60%,30%)]',
    });

    try {
      onExpireRef.current();
    } catch (error: unknown) {
      logger.error('Error in checkout expiration callback', {
        error: error instanceof Error ? error.message : 'Unknown',
        context: 'CheckoutCountdown.handleExpiration',
      });
    }

    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.reload();
      }
    }, 2000);
  }, [t, redirectUrl]);

  useEffect(() => {
    isMountedRef.current = true;

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Clear interval before handling expiration
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          handleExpiration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMountedRef.current = false;
      // Always clear interval unconditionally
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Always clear timeout unconditionally
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [handleExpiration]);

  const getTextColor = () => {
    if (secondsRemaining <= DANGER_THRESHOLD) {
      return 'hsl(348, 83%, 47%)'; // Full crimson
    }

    if (secondsRemaining <= CRITICAL_THRESHOLD) {
      // Interpolate from white to crimson
      const progress =
        1 -
        (secondsRemaining - DANGER_THRESHOLD) /
          (CRITICAL_THRESHOLD - DANGER_THRESHOLD);
      const white = { h: 0, s: 0, l: 100 };
      const crimson = { h: 348, s: 83, l: 47 };

      const h = white.h + (crimson.h - white.h) * progress;
      const s = white.s + (crimson.s - white.s) * progress;
      const l = white.l + (crimson.l - white.l) * progress;

      return `hsl(${h}, ${s}%, ${l}%)`;
    }

    return 'hsl(0, 0%, 100%)'; // White
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex items-center gap-2 font-canela'>
      <Clock className='h-4 w-4' style={{ color: getTextColor() }} />
      <span
        className='text-sm font-medium transition-colors duration-1000'
        style={{ color: getTextColor() }}
      >
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
};
