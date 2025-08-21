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
}
export const CommonCard = ({
  image,
  imageAlt,
  title,
  subtitle,
  badge,
  badgeVariant = "secondary",
  children,
  onClick,
  className = "",
  showHoverEffect = true
}: CommonCardProps) => {
  return <Card className={`group cursor-pointer overflow-hidden bg-card border-border hover:shadow-elegant transition-all duration-300 ${showHoverEffect ? 'hover:scale-[1.02]' : ''} ${className}`} onClick={onClick}>
      <div className="relative aspect-[4/5] overflow-hidden">
        <img src={image} alt={imageAlt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-background/90 text-foreground px-3 py-1 text-sm font-medium mb-1">
            {subtitle || title}
          </div>
          <h3 className="text-white text-xl font-canela font-medium line-clamp-2">
            {title}
          </h3>
        </div>
        {badge && <Badge variant={badgeVariant} className="absolute top-4 right-4 bg-background/90 text-foreground">
            {badge}
          </Badge>}
      </div>
      
      {children && <CardContent className="p-4">
          {children}
        </CardContent>}
    </Card>;
};