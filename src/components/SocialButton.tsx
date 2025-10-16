import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface SocialButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'floating';
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}

export const SocialButton = ({
  href,
  icon: Icon,
  label,
  variant = 'default',
  className = '',
  iconClassName = '',
}: SocialButtonProps) => {
  const baseClasses =
    variant === 'floating'
      ? 'h-14 w-14 rounded-full bg-background/10 hover:bg-fm-gold hover:text-primary-foreground hover:scale-110'
      : 'p-4 rounded-full bg-background/10 hover:bg-fm-gold hover:text-primary-foreground hover:scale-110';

  const defaultIconClasses =
    variant === 'floating' ? 'h-6 w-6' : 'h-6 w-6';

  return (
    <Button
      asChild
      size={variant === 'floating' ? 'icon' : 'default'}
      className={`transition-all duration-300 ${baseClasses} ${className}`}
    >
      <a href={href} target='_blank' rel='noopener noreferrer' aria-label={label}>
        <Icon className={`${defaultIconClasses} ${iconClassName}`} />
      </a>
    </Button>
  );
};
