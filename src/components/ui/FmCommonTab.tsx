import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface FmCommonTabProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'vertical' | 'horizontal';
  className?: string;
}

export const FmCommonTab = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  variant = 'vertical',
  className = '',
}: FmCommonTabProps) => {
  const baseClasses =
    'flex items-center justify-center bg-white/50 hover:bg-fm-gold hover:text-primary-foreground transition-all duration-300 cursor-pointer';

  const variantClasses = {
    vertical: 'w-12 h-12 writing-mode-vertical',
    horizontal: 'h-12 px-4',
  };

  const activeClasses = isActive ? 'bg-fm-gold text-primary-foreground' : '';

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, variantClasses[variant], activeClasses, className)}
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
