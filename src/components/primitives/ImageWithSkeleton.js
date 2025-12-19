import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Skeleton } from '@/components/common/shadcn/skeleton';
import { ImageAnchor, getObjectPositionClass, } from '@/shared';
import { cn } from '@/shared';
export const ImageWithSkeleton = ({ src, alt, className, skeletonClassName, aspectRatio, anchor = ImageAnchor.CENTER, }) => {
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
    return (_jsxs("div", { className: 'relative w-full h-full', children: [!isLoaded && (_jsx(Skeleton, { className: cn('absolute inset-0 w-full h-full', aspectRatio && `aspect-[${aspectRatio}]`, skeletonClassName) })), _jsx("img", { src: hasError ? '/placeholder.svg' : src, alt: alt, className: cn('transition-opacity duration-300', objectPositionClass, isLoaded ? 'opacity-100' : 'opacity-0', className), onLoad: handleLoad, onError: handleError })] }));
};
