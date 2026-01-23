import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import type { MobileMessage } from '@/shared/types/mobileMessages';

export interface MobileMessageBannerProps {
  /** Array of messages to display */
  messages: MobileMessage[];
  /** Auto-rotation interval in ms (default: 5000) */
  rotationInterval?: number;
  /** Additional className */
  className?: string;
}

/**
 * Mobile message banner with carousel rotation
 * Displays messages below the nav bar with smooth background transitions
 */
export function MobileMessageBanner({
  messages,
  rotationInterval = 5000,
  className,
}: MobileMessageBannerProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset index when messages change
  useEffect(() => {
    if (currentIndex >= messages.length) {
      setCurrentIndex(0);
    }
  }, [messages.length, currentIndex]);

  // Auto-rotation
  useEffect(() => {
    if (messages.length <= 1) return;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        handleNext();
      }, rotationInterval);
    };

    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [messages.length, rotationInterval]);

  // Handle transition to next message
  const handleNext = useCallback(() => {
    if (messages.length <= 1) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
      setIsTransitioning(false);
    }, 300); // Match text transition duration
  }, [messages.length]);

  // Handle dot click
  const handleDotClick = useCallback(
    (index: number) => {
      if (index === currentIndex) return;

      // Reset timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);

        // Restart timer
        if (messages.length > 1) {
          timerRef.current = setInterval(() => {
            handleNext();
          }, rotationInterval);
        }
      }, 300);
    },
    [currentIndex, messages.length, rotationInterval, handleNext]
  );

  // Handle message tap
  const handleMessageClick = useCallback(() => {
    const message = messages[currentIndex];
    if (!message?.action) return;

    if (message.action.type === 'navigate') {
      navigate(message.action.target);
    } else if (message.action.type === 'link') {
      window.open(message.action.target, '_blank', 'noopener,noreferrer');
    }
    // 'callback' type would need to be handled by parent
  }, [messages, currentIndex, navigate]);

  // Don't render on desktop or if no messages
  if (!isMobile || messages.length === 0) return null;

  const currentMessage = messages[currentIndex];
  if (!currentMessage) return null;

  const Icon = currentMessage.icon;
  const hasAction = !!currentMessage.action;
  const showDots = messages.length > 1;

  return (
    <div
      className={cn(
        // Fixed positioning below navigation bar
        'fixed top-[64px] left-0 right-0 w-screen z-40',
        // Frosted glass effect (always applied)
        'backdrop-blur-md',
        // Border on bottom
        'border-b',
        // Smooth background transition
        'transition-all duration-500 ease-in-out',
        // Dynamic styles from current message
        currentMessage.style.background,
        currentMessage.style.border,
        // Cursor for clickable messages
        hasAction && 'cursor-pointer',
        className
      )}
      onClick={hasAction ? handleMessageClick : undefined}
      role={hasAction ? 'button' : undefined}
      tabIndex={hasAction ? 0 : undefined}
      onKeyDown={
        hasAction
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMessageClick();
              }
            }
          : undefined
      }
    >
      {/* Content wrapper with padding */}
      <div className='px-[20px] py-[12px]'>
        {/* Message content with slide transition */}
        <div className='overflow-hidden'>
          <div
            className={cn(
              'flex items-center justify-center gap-[10px]',
              'transition-all duration-300 ease-out',
              isTransitioning
                ? 'opacity-0 -translate-x-4'
                : 'opacity-100 translate-x-0'
            )}
          >
            {/* Icon */}
            {Icon && (
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  currentMessage.style.icon || currentMessage.style.text
                )}
              />
            )}

            {/* Message text */}
            <span
              className={cn(
                'text-sm font-canela',
                'transition-colors duration-500',
                currentMessage.style.text
              )}
            >
              {t(currentMessage.textKey)}
            </span>

            {/* Action indicator */}
            {hasAction && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  'transition-colors duration-500',
                  currentMessage.style.text
                )}
              />
            )}
          </div>
        </div>

        {/* Dot indicators */}
        {showDots && (
          <div className='flex items-center justify-center gap-[6px] mt-[8px]'>
            {messages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDotClick(index);
                }}
                className={cn(
                  'w-[6px] h-[6px] rounded-full',
                  'transition-all duration-300',
                  index === currentIndex
                    ? 'bg-fm-gold scale-125'
                    : 'bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to message ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
