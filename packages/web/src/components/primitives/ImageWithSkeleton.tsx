import { useState } from 'react';

import { Skeleton } from '@/components/common/shadcn/skeleton';
import {
  ImageAnchor,
  getObjectPositionClass,
} from '@force-majeure/shared/types/imageAnchor';
import { cn } from '@force-majeure/shared/utils/utils';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  aspectRatio?: string;
  anchor?: ImageAnchor;
}

export const ImageWithSkeleton = ({
  src,
  alt,
  className,
  skeletonClassName,
  aspectRatio,
  anchor = ImageAnchor.CENTER,
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

  const objectPositionClass = getObjectPositionClass(anchor);

  return (
    <div className='relative w-full h-full'>
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
          objectPositionClass,
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
