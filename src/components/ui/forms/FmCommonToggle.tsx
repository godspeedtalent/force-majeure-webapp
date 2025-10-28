import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface FmCommonToggleProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const FmCommonToggle = ({
  id,
  label,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
}: FmCommonToggleProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between group transition-all duration-300',
        !disabled && 'hover:shadow-[0_0_12px_rgba(207,173,118,0.2)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Label
        htmlFor={id}
        className={cn(
          'flex items-center gap-2 text-white transition-colors',
          !disabled && 'cursor-pointer group-hover:text-fm-gold',
          disabled && 'cursor-not-allowed'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'data-[state=checked]:bg-fm-gold',
          !disabled && 'group-hover:shadow-[0_0_8px_rgba(207,173,118,0.3)]'
        )}
      />
    </div>
  );
};
