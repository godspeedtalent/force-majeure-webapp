/**
 * FmProximityIconButton
 *
 * An icon button that fades in as the cursor approaches it.
 * The button is invisible and unselectable at the configured radius boundary,
 * transitioning to 100% opacity by the time the cursor is within 10% of the boundary.
 *
 * Features:
 * - Configurable fade radius (default: 10vw)
 * - Press-and-hold / right-click context menu support
 * - Built on FmCommonIconButton for consistent styling
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { LucideIcon } from 'lucide-react';
import { FmCommonIconButton } from './FmCommonIconButton';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';
import { cn } from '@/shared';

export interface FmProximityIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** The Lucide icon to display */
  icon: LucideIcon;
  /** Button variant */
  variant?: 'default' | 'secondary' | 'destructive' | 'gold' | 'create';
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Optional tooltip text */
  tooltip?: string;
  /** Loading state */
  loading?: boolean;
  /** Fade radius in CSS units (default: '10vw') */
  fadeRadius?: string;
  /** Click handler */
  onClick?: () => void;
  /** Context menu actions (shown on right-click or press-and-hold) */
  contextMenuActions?: ContextMenuAction<void>[];
  /** Press-and-hold delay in ms (default: 500) */
  pressHoldDelay?: number;
  /** Custom positioning styles */
  positionClassName?: string;
}

export const FmProximityIconButton = ({
  icon,
  variant = 'default',
  size = 'default',
  tooltip,
  loading = false,
  fadeRadius = '10vw',
  onClick,
  contextMenuActions = [],
  pressHoldDelay = 500,
  positionClassName,
  className,
  disabled,
  ...props
}: FmProximityIconButtonProps) => {
  const [opacity, setOpacity] = useState(0);
  const [isInteractable, setIsInteractable] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Convert fadeRadius to pixels for calculation
  const getRadiusInPixels = useCallback(() => {
    if (fadeRadius.endsWith('vw')) {
      const vw = parseFloat(fadeRadius);
      return (vw / 100) * window.innerWidth;
    } else if (fadeRadius.endsWith('vh')) {
      const vh = parseFloat(fadeRadius);
      return (vh / 100) * window.innerHeight;
    } else if (fadeRadius.endsWith('px')) {
      return parseFloat(fadeRadius);
    } else if (fadeRadius.endsWith('%')) {
      const pct = parseFloat(fadeRadius);
      return (pct / 100) * window.innerWidth;
    }
    return parseFloat(fadeRadius) || 100;
  }, [fadeRadius]);

  // Calculate opacity based on cursor distance
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;

      const distanceX = e.clientX - buttonCenterX;
      const distanceY = e.clientY - buttonCenterY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      const radiusPx = getRadiusInPixels();
      const transitionStart = radiusPx;
      const transitionEnd = radiusPx * 0.1;

      if (distance >= transitionStart) {
        setOpacity(0);
        setIsInteractable(false);
      } else if (distance <= transitionEnd) {
        setOpacity(1);
        setIsInteractable(true);
      } else {
        const progress =
          (transitionStart - distance) / (transitionStart - transitionEnd);
        setOpacity(progress);
        setIsInteractable(progress > 0.5);
      }
    },
    [getRadiusInPixels]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (contextMenuActions.length === 0 || disabled) return;
      if (e.button !== 0) return;

      setIsLongPressing(true);
      pressTimerRef.current = setTimeout(() => {
        setShowContextMenu(true);
        setIsLongPressing(false);
      }, pressHoldDelay);
    },
    [contextMenuActions.length, pressHoldDelay, disabled]
  );

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPressing && !showContextMenu && onClick) {
      onClick();
    }
  }, [isLongPressing, showContextMenu, onClick]);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const buttonElement = (
    <div
      ref={buttonRef}
      className={cn(
        'transition-opacity duration-150',
        positionClassName,
        className
      )}
      style={{
        opacity,
        pointerEvents: isInteractable ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <FmCommonIconButton
        icon={icon}
        variant={variant}
        size={size}
        tooltip={tooltip}
        loading={loading}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          isLongPressing && 'scale-95 transition-transform duration-100'
        )}
        {...props}
      />
    </div>
  );

  if (contextMenuActions.length > 0) {
    return (
      <FmCommonContextMenu
        actions={contextMenuActions}
        data={undefined}
        onOpenChange={setShowContextMenu}
      >
        {buttonElement}
      </FmCommonContextMenu>
    );
  }

  return buttonElement;
};

export default FmProximityIconButton;
