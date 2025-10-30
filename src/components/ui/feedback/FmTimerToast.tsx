import { useEffect, useState, useRef } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

interface FmTimerToastProps {
  duration: number; // in seconds
  title?: string;
  message?: string;
  onExpire: () => void;
  onAction?: () => Promise<void>;
  actionLabel?: string;
  id?: string;
}

export const FmTimerToast = ({
  duration,
  title = 'Tickets Reserved',
  message,
  onExpire,
  onAction,
  actionLabel = 'Extend Time',
  id = 'fm-timer-toast',
}: FmTimerToastProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isExecuting, setIsExecuting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onExpire();
          sonnerToast.dismiss(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration, onExpire, id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const progress = ((duration - timeLeft) / duration) * 100;

    // Calculate progress bar color
    let barColor = 'bg-fm-gold';
    if (progress > 80) {
      barColor = progress > 95 ? 'bg-[hsl(348,60%,50%)]' : 'bg-gradient-to-r from-white to-[hsl(348,60%,50%)]';
    } else if (progress > 0) {
      barColor = progress < 20 ? 'bg-fm-gold' : 'bg-gradient-to-r from-fm-gold to-white';
    }

    const content = (
      <div className="relative w-full">
        <div className="flex items-center gap-3 pb-3">
          <Clock className="h-4 w-4 text-fm-gold flex-shrink-0" />
          <div className="flex-1">
            <div className="font-canela font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">
              {message || `${timeString} remaining`}
            </div>
          </div>
          {onAction && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setIsExecuting(true);
                try {
                  await onAction();
                  sonnerToast.dismiss(id);
                } catch (error) {
                  console.error('Action failed:', error);
                } finally {
                  setIsExecuting(false);
                }
              }}
              disabled={isExecuting}
              className="text-xs text-fm-gold hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                actionLabel
              )}
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/30">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );

    sonnerToast(content, {
      id,
      duration: Infinity,
      position: 'bottom-left',
      className: 'bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl',
      style: {
        paddingBottom: '0.75rem',
      },
    });
  }, [timeLeft, duration, title, message, onAction, actionLabel, id]);

  return null;
};
