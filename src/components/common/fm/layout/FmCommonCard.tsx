/**
 * FmCommonCard
 * 
 * Base card component with consistent styling and hover effects.
 * Provides a foundation for InfoCard, StatCard, and other card-based components.
 */

import { ReactNode } from 'react';
import { Card } from '@/components/ui/shadcn/card';
import { cn } from '@/shared/utils/utils';

interface FmCommonCardProps {
  /** Card content */
  children: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Enable hover effects */
  hoverable?: boolean;
  /** Clickable card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const FmCommonCard = ({
  children,
  size = 'md',
  hoverable = false,
  onClick,
  className,
}: FmCommonCardProps) => {
  return (
    <Card
      className={cn(
        'border-border',
        hoverable && 'transition-all duration-300',
        hoverable && 'hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)]',
        hoverable && 'hover:scale-[1.02]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className={sizeConfig[size]}>
        {children}
      </div>
    </Card>
  );
};
