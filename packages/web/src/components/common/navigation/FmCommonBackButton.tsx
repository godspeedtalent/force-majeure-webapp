import { ArrowLeft, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@force-majeure/shared';

interface FmCommonBackButtonProps {
  /** Text to display on the button */
  text?: string;
  /** Icon to display (defaults to ArrowLeft) */
  icon?: LucideIcon;
  /** Path to navigate to (if not provided, uses browser back) */
  to?: string;
  /** Custom onClick handler (overrides navigation) */
  onClick?: () => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
}

/**
 * A reusable back button component with consistent styling
 * Can navigate to a specific path or use browser history
 */
export function FmCommonBackButton({
  text = 'Back',
  icon: Icon = ArrowLeft,
  to,
  onClick,
  variant = 'ghost',
  className,
}: FmCommonBackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={cn('gap-2', className)}
    >
      <Icon className='h-4 w-4' />
      {text}
    </Button>
  );
}
