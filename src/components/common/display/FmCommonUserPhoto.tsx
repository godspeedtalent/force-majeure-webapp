/**
 * FmCommonUserPhoto
 *
 * Standardized user photo/avatar component
 * Displays user avatar with fallback to initials or animated gradient
 * Consistent styling across the application
 */

import { User } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/common/shadcn/avatar';
import { cn } from '@/shared/utils/utils';
import { FmAnimatedGradientAvatar } from './FmAnimatedGradientAvatar';

interface FmCommonUserPhotoProps {
  /** Avatar image URL */
  src?: string | null;
  /** User's display name or email for fallback initials */
  name?: string | null;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'square';
  /** Additional CSS classes */
  className?: string;
  /** Show border */
  showBorder?: boolean;
  /** Use animated gradient instead of initials/icon fallback */
  useAnimatedGradient?: boolean;
}

const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    icon: 'w-3 h-3',
    text: 'text-[8px]',
  },
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-xs',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-sm',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    text: 'text-base',
  },
  xl: {
    container: 'w-24 h-24',
    icon: 'w-12 h-12',
    text: 'text-xl',
  },
  '2xl': {
    container: 'w-32 h-32',
    icon: 'w-16 h-16',
    text: 'text-2xl',
  },
  square: {
    container: 'w-full h-full aspect-square',
    icon: 'w-24 h-24',
    text: 'text-4xl',
  },
};

/**
 * Generate initials from name
 */
const getInitials = (name?: string | null): string => {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const FmCommonUserPhoto = ({
  src,
  name,
  size = 'md',
  className,
  showBorder = false,
  useAnimatedGradient = false,
}: FmCommonUserPhotoProps) => {
  const config = sizeConfig[size];
  const initials = getInitials(name);
  const isSquare = size === 'square';

  // For square size with animated gradient
  if (isSquare && useAnimatedGradient && !src) {
    return (
      <div
        className={cn(
          'relative',
          config.container,
          showBorder &&
            'ring-2 ring-border ring-offset-2 ring-offset-background rounded-md',
          className
        )}
      >
        <FmAnimatedGradientAvatar />
      </div>
    );
  }

  // For square size with image
  if (isSquare) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted',
          config.container,
          showBorder &&
            'ring-2 ring-border ring-offset-2 ring-offset-background',
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'User avatar'}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-gold'>
            {initials ? (
              <span
                className={cn(
                  'text-black font-canela font-medium',
                  config.text
                )}
              >
                {initials}
              </span>
            ) : (
              <User className={config.icon} />
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular circular avatar
  return (
    <Avatar
      className={cn(
        config.container,
        showBorder && 'ring-2 ring-border ring-offset-2 ring-offset-background',
        className
      )}
    >
      {src && <AvatarImage src={src} alt={name || 'User avatar'} />}
      <AvatarFallback className='bg-gradient-gold text-black font-canela font-medium'>
        {initials || <User className={config.icon} />}
      </AvatarFallback>
    </Avatar>
  );
};
