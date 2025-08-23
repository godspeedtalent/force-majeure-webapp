import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CommonCardProps {
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

export const CommonCard = ({
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
}: CommonCardProps) => {
  const pillBase = subtitleSize === 'lg' ? 'px-4 py-1.5 text-base' : 'px-3 py-1 text-sm';

  return (
    <Card
      className={`group cursor-pointer overflow-hidden bg-card hover:shadow-elegant transition-all duration-300 border-0 border-l-[3px] border-l-fm-crimson dark:border-l-fm-gold hover:border-l-[6px] hover:animate-border-shimmer hover:invert ${showHoverEffect ? 'hover:scale-[1.02]' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] overflow-hidden max-h-[400px]">
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover max-h-[675px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          {badgeInline ? (
            <div className="flex items-center gap-2 mb-1">
              {titleAsBadge ? (
                <Badge className={`border-white/20 bg-background/90 text-foreground ${pillBase} font-medium max-w-full truncate`}>
                  <span className="truncate">{subtitle || title}</span>
                </Badge>
              ) : (
                <div className={`inline-flex items-center rounded-full border border-white/20 bg-background/90 text-foreground ${pillBase} font-medium max-w-full truncate`}>
                  <span className="truncate">{subtitle || title}</span>
                </div>
              )}
              {badge && (
                <Badge variant={badgeVariant} className="bg-background/90 text-foreground shrink-0">
                  {badge}
                </Badge>
              )}
            </div>
          ) : (
            <>
              {titleAsBadge ? (
                <Badge className={`border-white/20 bg-background/90 text-foreground ${pillBase} font-medium mb-1 max-w-full truncate`}>
                  <span className="truncate">{subtitle || title}</span>
                </Badge>
              ) : (
                <div className={`inline-flex items-center rounded-full border border-white/20 bg-background/90 text-foreground ${pillBase} font-medium mb-1`}>
                  {subtitle || title}
                </div>
              )}
              {!titleHidden && title && (
                <h3 className="text-white text-xl font-canela font-medium line-clamp-2">{title}</h3>
              )}
            </>
          )}
          {belowTitle && <div className="mt-2">{belowTitle}</div>}
        </div>
        {!badgeInline && badge && (
          <Badge variant={badgeVariant} className="absolute top-4 right-4 bg-background/90 text-foreground">
            {badge}
          </Badge>
        )}
      </div>

      {children && <CardContent className="p-4">{children}</CardContent>}
    </Card>
  );
};