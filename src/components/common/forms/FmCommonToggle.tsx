import { useState } from 'react';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared';

interface FmCommonToggleProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Hide the label text (for use when context already provides the label) */
  hideLabel?: boolean;
}

/**
 * Enhanced toggle component with smooth animations and dopamine-inducing interactions
 * Features icon bounce on toggle and enhanced shadow effects
 */
export const FmCommonToggle = ({
  id,
  label,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
  hideLabel = false,
}: FmCommonToggleProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (newChecked: boolean) => {
    if (!disabled) {
      setIsAnimating(true);
      onCheckedChange(newChecked);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between group transition-all duration-300 rounded-none px-3 py-2',
        !disabled &&
          'hover:bg-white/5 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        checked && !disabled && 'bg-fm-gold/10',
        className
      )}
      onClick={() => !disabled && handleToggle(!checked)}
    >
      {!hideLabel && (
        <Label
          htmlFor={id}
          className={cn(
            'flex items-center gap-2 text-white transition-all duration-200',
            !disabled &&
              'cursor-pointer group-hover:text-fm-gold group-hover:translate-x-1',
            disabled && 'cursor-not-allowed'
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                'h-4 w-4 transition-all duration-300',
                isAnimating && 'scale-125 rotate-12',
                checked && 'text-fm-gold'
              )}
            />
          )}
          <span className='transition-all duration-200'>{label}</span>
        </Label>
      )}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={disabled}
        className={cn(
          'data-[state=checked]:bg-fm-gold transition-all duration-300',
          !disabled &&
            'group-hover:shadow-[0_0_12px_rgba(207,173,118,0.5)] group-hover:scale-110',
          isAnimating && 'scale-110',
          checked && 'shadow-[0_0_8px_rgba(207,173,118,0.4)]'
        )}
      />
    </div>
  );
};
