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
      ? 'h-14 w-14 rounded-full shadow-elegant hover:shadow-glow bg-gradient-gold hover:scale-110'
      : 'rounded-full hover:scale-110 bg-gradient-gold';

  const defaultIconClasses =
    variant === 'floating' ? 'h-6 w-6 text-background' : 'h-5 w-5 text-background';

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
