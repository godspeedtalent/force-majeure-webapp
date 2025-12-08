import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonIconButton } from './FmCommonIconButton';
import { FmCommonButton } from './FmCommonButton';
import { cn } from '@force-majeure/shared/utils/utils';

interface FmBackButtonProps {
  /** Display variant: icon-only or with text label */
  variant?: 'icon' | 'text';
  /** Position style: floating (absolute) or inline (flex item) */
  position?: 'floating' | 'inline';
  /** Custom onClick handler (default: navigate(-1)) */
  onClick?: () => void;
  /** Tooltip text for icon-only variant (deprecated - text variant preferred) */
  tooltip?: string;
  /** Additional CSS classes */
  className?: string;
  /** Text label showing destination page name (e.g., "Event Details", "Profile") */
  label?: string;
  /** Size of button */
  size?: 'default' | 'sm' | 'lg';
}

/**
 * FmBackButton
 *
 * Consistent back button component for navigation across the application.
 * Follows Force Majeure design system with gold accent colors and sharp edges.
 *
 * Features:
 * - Icon-only or text+icon variants
 * - Floating (absolute positioned) or inline positioning
 * - Default behavior: navigate(-1) using react-router
 * - Design system compliant: gold hover states, sharp corners, 20px positioning
 * - Built-in ripple effects and scale animations
 * - Accessible with tooltips and keyboard navigation
 *
 * @example
 * // Floating icon button (top-left corner)
 * <FmBackButton position="floating" tooltip="Back to list" />
 *
 * @example
 * // Inline text button (in header)
 * <FmBackButton variant="text" position="inline" label="Back" />
 *
 * @example
 * // Custom click handler
 * <FmBackButton onClick={() => navigate('/custom-route')} />
 */
export const FmBackButton = ({
  variant = 'text',
  position = 'floating',
  onClick,
  tooltip = 'Go back',
  className,
  label = 'Back',
  size = 'sm',
}: FmBackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  const positionClasses =
    position === 'floating' ? 'absolute top-[20px] left-[20px] z-20' : '';

  if (variant === 'icon') {
    return (
      <div className={cn(positionClasses, className)}>
        <FmCommonIconButton
          icon={ArrowLeft}
          onClick={handleClick}
          tooltip={tooltip}
          variant='default'
          size={size}
        />
      </div>
    );
  }

  return (
    <div className={cn(positionClasses, className)}>
      <FmCommonButton
        icon={ArrowLeft}
        iconPosition='left'
        onClick={handleClick}
        variant='default'
        size={size}
      >
        {label}
      </FmCommonButton>
    </div>
  );
};
