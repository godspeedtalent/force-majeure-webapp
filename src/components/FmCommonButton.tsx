import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/shared/utils/utils';

interface FmCommonButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  variant?: 'default' | 'floating';
  className?: string;
  iconClassName?: string;
  isExternal?: boolean;
}

export const FmCommonButton = ({
  href,
  icon: Icon,
  label,
  tooltip,
  variant = 'default',
  className = '',
  iconClassName = '',
  isExternal = true,
}: FmCommonButtonProps) => {
  const baseClasses =
    variant === 'floating'
      ? 'h-14 w-14 rounded-full bg-white/50 hover:bg-fm-gold hover:text-primary-foreground hover:scale-110'
      : 'h-14 w-14 rounded-full bg-white/50 hover:bg-fm-gold hover:text-primary-foreground hover:scale-110';

  const defaultIconClasses = 'h-6 w-6';

  const buttonContent = (
    <Button
      asChild
      size={variant === 'floating' ? 'icon' : 'default'}
      className={cn('transition-all duration-300', baseClasses, className)}
    >
      {isExternal ? (
        <a href={href} target='_blank' rel='noopener noreferrer' aria-label={label}>
          <Icon className={cn(defaultIconClasses, iconClassName)} />
        </a>
      ) : (
        <Link to={href} aria-label={label}>
          <Icon className={cn(defaultIconClasses, iconClassName)} />
        </Link>
      )}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{buttonContent}</div>
          </TooltipTrigger>
          <TooltipContent side='left'>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};
