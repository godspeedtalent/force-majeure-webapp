import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { cn } from '@force-majeure/shared';

interface ForceMajeureLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
}

export const ForceMajeureLogo = ({
  className = '',
  size = 'md',
}: ForceMajeureLogoProps) => {
  // For responsive size, don't apply fixed dimensions - let parent control
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28',
    responsive: '', // No size constraints, fully controlled by parent
  };

  // Always use dark theme logo since app is forced to dark mode
  const logoSrc = '/lovable-uploads/394024a3-6b83-4a11-afad-7d3fd0928b66.png';

  // For responsive mode, ensure aspect ratio is maintained
  const aspectRatioClass = size === 'responsive' ? 'aspect-square' : '';

  return (
    <div className={cn('relative', sizeClasses[size], aspectRatioClass, className)}>
      <ImageWithSkeleton
        src={logoSrc}
        alt='Force Majeure'
        className='object-contain w-full h-full'
        skeletonClassName='rounded-none' // Sharp corners per design system
      />
    </div>
  );
};
