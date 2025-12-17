import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { toast } from 'sonner';

interface CheckoutTimerProps {
  onExpire: () => void;
  duration?: number; // in seconds
}

export const CheckoutTimer = ({
  onExpire,
  duration = 600,
}: CheckoutTimerProps) => {
  const { t } = useTranslation('common');
  const { isCheckoutActive } = useCheckoutTimer();
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isCheckoutActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCheckoutActive, onExpire]);

  useEffect(() => {
    if (!isCheckoutActive) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Show warning at 2 minutes
    if (timeLeft === 120) {
      toast.warning(t('checkoutTimer.hurryUp'), {
        description: t('checkoutTimer.twoMinutesRemaining'),
        duration: 5000,
      });
    }

    // Show urgent warning at 30 seconds
    if (timeLeft === 30) {
      toast.error(t('checkoutTimer.timeRunningOut'), {
        description: t('checkoutTimer.thirtySecondsRemaining'),
        duration: 5000,
      });
    }

    // Update persistent toast
    if (timeLeft > 0) {
      toast.info(
        <div className='flex items-center gap-2'>
          <Clock className='h-4 w-4' />
          <div>
            <div className='font-medium'>{t('checkoutTimer.ticketsReserved')}</div>
            <div className='text-xs text-muted-foreground'>
              {t('checkoutTimer.timeRemaining', { time: timeString })}
            </div>
          </div>
        </div>,
        {
          id: 'checkout-timer',
          duration: Infinity,
          position: 'bottom-left',
        }
      );
    } else {
      toast.dismiss('checkout-timer');
    }
  }, [timeLeft, isCheckoutActive]);

  return null;
};
