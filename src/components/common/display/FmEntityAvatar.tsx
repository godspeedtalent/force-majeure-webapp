import { User, Music, MapPin, Building2, Calendar, Disc3 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/common/shadcn/avatar';
import { cn } from '@/shared';

export type EntityType = 'user' | 'artist' | 'venue' | 'organization' | 'event' | 'recording';

interface FmEntityAvatarProps {
  /** URL to the entity's avatar/image */
  imageUrl?: string | null;
  /** Display name for fallback text (first letter) */
  displayName?: string | null;
  /** Type of entity (determines icon) */
  entityType: EntityType;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Shape of the avatar */
  shape?: 'square' | 'circle';
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const entityIcons = {
  user: User,
  artist: Music,
  venue: MapPin,
  organization: Building2,
  event: Calendar,
  recording: Disc3,
};

/**
 * Generic entity avatar component with type-specific fallback icons.
 * Displays entity image if available, otherwise shows appropriate icon or initials.
 * Used throughout the app for consistent entity representation.
 */
export function FmEntityAvatar({
  imageUrl,
  displayName,
  entityType,
  size = 'md',
  shape = 'circle',
  className,
}: FmEntityAvatarProps) {
  const fallbackText = displayName?.[0]?.toUpperCase() || '';
  const IconComponent = entityIcons[entityType];

  return (
    <Avatar className={cn(
      sizeClasses[size],
      shape === 'square' && 'rounded-none',
      className
    )}>
      {imageUrl && (
        <AvatarImage
          src={imageUrl}
          alt={displayName || entityType}
          className={shape === 'square' ? 'rounded-none' : ''}
        />
      )}
      <AvatarFallback className={cn(
        'bg-white/10',
        shape === 'square' && 'rounded-none'
      )}>
        {fallbackText ? (
          <span className='text-white/70 font-medium'>{fallbackText}</span>
        ) : (
          <IconComponent className={cn(iconSizes[size], 'text-white/50')} />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Specialized avatar components for each entity type
 */

export function FmUserAvatar({
  imageUrl,
  displayName,
  size = 'md',
  className,
}: Omit<FmEntityAvatarProps, 'entityType' | 'shape'>) {
  return (
    <FmEntityAvatar
      imageUrl={imageUrl}
      displayName={displayName}
      entityType='user'
      size={size}
      shape='circle'
      className={className}
    />
  );
}

export function FmArtistAvatar({
  imageUrl,
  displayName,
  size = 'md',
  className,
}: Omit<FmEntityAvatarProps, 'entityType' | 'shape'>) {
  return (
    <FmEntityAvatar
      imageUrl={imageUrl}
      displayName={displayName}
      entityType='artist'
      size={size}
      shape='circle'
      className={className}
    />
  );
}

export function FmVenueAvatar({
  imageUrl,
  displayName,
  size = 'md',
  className,
}: Omit<FmEntityAvatarProps, 'entityType' | 'shape'>) {
  return (
    <FmEntityAvatar
      imageUrl={imageUrl}
      displayName={displayName}
      entityType='venue'
      size={size}
      shape='square'
      className={className}
    />
  );
}

export function FmOrganizationAvatar({
  imageUrl,
  displayName,
  size = 'md',
  className,
}: Omit<FmEntityAvatarProps, 'entityType' | 'shape'>) {
  return (
    <FmEntityAvatar
      imageUrl={imageUrl}
      displayName={displayName}
      entityType='organization'
      size={size}
      shape='square'
      className={className}
    />
  );
}

export function FmEventAvatar({
  imageUrl,
  displayName,
  size = 'md',
  className,
}: Omit<FmEntityAvatarProps, 'entityType' | 'shape'>) {
  return (
    <FmEntityAvatar
      imageUrl={imageUrl}
      displayName={displayName}
      entityType='event'
      size={size}
      shape='square'
      className={className}
    />
  );
}
