import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils/utils';

interface FmCommonCreateButtonProps {
  onClick: () => void;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export const FmCommonCreateButton = ({
  onClick,
  label,
  variant = 'outline',
  className,
}: FmCommonCreateButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      className={cn(
        'justify-start gap-2',
        variant === 'outline' && 'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all',
        className
      )}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
};
