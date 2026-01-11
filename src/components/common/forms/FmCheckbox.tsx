import { useState } from 'react';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared';

interface FmCheckboxProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox component with label and hover effects
 * Uses FmCommonCheckbox internally for consistent styling
 * Features smooth animations and icon interactions
 */
export const FmCheckbox = ({
  id,
  label,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
}: FmCheckboxProps) => {
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
        'flex items-center justify-between group transition-all duration-300 rounded-none px-[10px] py-[10px]',
        !disabled &&
          'hover:bg-white/5 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        checked && !disabled && 'bg-fm-gold/10',
        className
      )}
      onClick={() => !disabled && handleToggle(!checked)}
    >
      <Label
        htmlFor={id}
        className={cn(
          'flex items-center gap-2 text-white transition-all duration-200 flex-1',
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
      <FmCommonCheckbox
        id={id}
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={disabled}
        className={cn(
          'transition-all duration-300',
          !disabled && 'group-hover:scale-110',
          isAnimating && 'scale-110'
        )}
      />
    </div>
  );
};
