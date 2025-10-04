import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  aspectRatio?: string;
}

export const ImageWithSkeleton = ({
  src,
  alt,
  className,
  skeletonClassName,
  aspectRatio,
}: ImageWithSkeletonProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <Skeleton 
          className={cn(
            'absolute inset-0 w-full h-full',
            aspectRatio && `aspect-[${aspectRatio}]`,
            skeletonClassName
          )} 
        />
      )}
      <img
        src={hasError ? '/placeholder.svg' : src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
