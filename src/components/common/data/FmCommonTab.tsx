import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared';

interface FmCommonTabProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  variant?: 'vertical' | 'horizontal';
  className?: string;
  badge?: number;
}

export const FmCommonTab = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  onContextMenu,
  variant = 'vertical',
  className = '',
  badge,
}: FmCommonTabProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses =
    'relative flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer';

  const variantClasses = {
    vertical: 'w-12 h-12 writing-mode-vertical',
    horizontal: 'h-12 px-4',
  };

  const activeClasses = isActive
    ? 'bg-fm-gold/80 backdrop-blur-md text-black border-fm-gold hover:bg-white/90'
    : 'text-white hover:bg-white/10';

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        baseClasses,
        variantClasses[variant],
        activeClasses,
        className
      )}
      aria-label={label}
      title={label}
    >
      <Icon className='h-5 w-5' />
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 flex items-center justify-center',
            'min-w-4 h-4 px-1 rounded-full text-[9px] font-bold',
            'transition-colors duration-200',
            isHovered
              ? 'bg-black text-white ring-1 ring-white/60'
              : 'bg-fm-gold text-black ring-1 ring-fm-gold/50'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </button>
  );
};
