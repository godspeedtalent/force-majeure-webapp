import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const HOLD_DURATION_SECONDS = 540; // 9 minutes
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
  const [secondsRemaining, setSecondsRemaining] = useState(
    HOLD_DURATION_SECONDS
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleExpiration = () => {
      toast.error('Your tickets have been returned', {
        description: 'Please reselect and check out again to purchase tickets',
        className: 'bg-[hsl(348,60%,20%)]/90 border-[hsl(348,60%,30%)]',
      });

      onExpire();

      timeoutId = setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.reload();
        }
      }, 2000);
    };

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpiration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onExpire, redirectUrl]);

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
