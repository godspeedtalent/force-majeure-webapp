import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared/utils/utils';
import { LucideIcon } from 'lucide-react';
import { useDevTools } from '@/contexts/DevToolsContext';

interface FmCommonNavigationButtonProps {
  to: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'outline';
  className?: string;
  description?: string;
}

export const FmCommonNavigationButton = ({
  to,
  label,
  icon: Icon,
  variant = 'outline',
  className,
  description,
}: FmCommonNavigationButtonProps) => {
  const navigate = useNavigate();
  const { isDrawerOpen, toggleDrawer } = useDevTools();

  const handleClick = () => {
    // Close dev tools drawer if open
    if (isDrawerOpen) {
      toggleDrawer();
    }
    navigate(to);
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={cn(
        'w-full justify-start gap-3 h-auto py-3',
        variant === 'outline' && 'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all',
        className
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="flex flex-col items-start gap-0.5 text-left">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="text-xs text-white/50 font-normal">{description}</span>
        )}
      </div>
    </Button>
  );
};
