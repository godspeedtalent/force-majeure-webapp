import { ReactNode } from 'react';

import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';

interface FmImageCardProps {
  image: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  showHoverEffect?: boolean;
  // Optional layout controls
  titleHidden?: boolean;
  badgeInline?: boolean; // place badge on same row as subtitle/title pill
  subtitleSize?: 'sm' | 'lg';
  // Custom content row rendered below the title (inside image overlay)
  belowTitle?: ReactNode;
  // Render the title/subtitle pill as a Badge instead of a plain pill
  titleAsBadge?: boolean;
}

export const FmImageCard = ({
  image,
  imageAlt,
  title,
  subtitle,
  badge,
  badgeVariant = 'secondary',
  children,
  onClick,
  className = '',
  showHoverEffect = true,
  titleHidden = false,
  badgeInline = false,
  subtitleSize = 'sm',
  belowTitle,
  titleAsBadge = false,
}: FmImageCardProps) => {
  const pillBase =
    subtitleSize === 'lg' ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm';

  return (
    <FmCommonCard
      className={`group cursor-pointer overflow-hidden bg-card/20 backdrop-blur-sm hover:bg-white/30 hover:backdrop-blur-md hover:shadow-elegant transition-all duration-300 border-0 border-t-0 border-r-0 border-b-0 border-l-[3px] border-l-fm-crimson dark:border-l-fm-gold hover:border-l-white hover:border-l-[6px] hover:animate-border-shimmer ${showHoverEffect ? 'hover:scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      <div className='relative aspect-[4/5] overflow-hidden max-h-[400px]'>
        <ImageWithSkeleton
          src={image}
          alt={imageAlt}
          className='w-full h-full object-cover object-center max-h-[675px]'
          aspectRatio='4/5'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

        {/* Only show belowTitle content in overlay if provided */}
        {belowTitle && (
          <div className='absolute bottom-4 left-4 right-4'>{belowTitle}</div>
        )}

        {/* Keep non-inline badges in top-right corner */}
        {!badgeInline && badge && (
          <Badge
            variant={badgeVariant}
            className='absolute top-4 right-4 bg-background/90 text-foreground'
          >
            {badge}
          </Badge>
        )}
      </div>

      {children && (
        <FmCommonCardContent className='p-4'>
          {/* Move title badge to card body */}
          {badgeInline ? (
            <div className='flex items-center gap-2 mb-3'>
              {titleAsBadge ? (
                <Badge
                  className={`${pillBase} font-medium max-w-full truncate`}
                >
                  <span className='truncate'>{subtitle || title}</span>
                </Badge>
              ) : (
                <div
                  className={`inline-flex items-center rounded-full border border-border bg-secondary text-secondary-foreground ${pillBase} font-medium max-w-full truncate`}
                >
                  <span className='truncate'>{subtitle || title}</span>
                </div>
              )}
              {badge && (
                <Badge variant={badgeVariant} className='shrink-0'>
                  {badge}
                </Badge>
              )}
            </div>
          ) : (
            <>
              {titleAsBadge ? (
                <Badge
                  className={`${pillBase} font-medium mb-3 max-w-full truncate`}
                >
                  <span className='truncate'>{subtitle || title}</span>
                </Badge>
              ) : null}
              {!titleHidden && title && subtitle && (
                <h3 className='text-foreground text-xl font-canela font-medium line-clamp-2 mb-3'>
                  {title}
                </h3>
              )}
            </>
          )}
          {children}
        </FmCommonCardContent>
      )}
    </FmCommonCard>
  );
};
