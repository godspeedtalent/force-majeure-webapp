import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/shadcn/breadcrumb';
import { useBreadcrumbs } from '@/shared/hooks/useBreadcrumbs';
import { cn } from '@/shared/utils/utils';

/**
 * Comprehensive breadcrumb navigation component
 * Automatically generates breadcrumbs based on current route
 * Supports nested routes, dynamic segments, and async data resolution
 */
export const Breadcrumbs = () => {
  const { breadcrumbs, isLoading } = useBreadcrumbs();
  const navigate = useNavigate();
  const [animatingAfter, setAnimatingAfter] = useState<number | null>(null);

  if (breadcrumbs.length === 0) {
    return null;
  }

  const handleBreadcrumbClick = (path: string, index: number) => {
    // Trigger animation for all breadcrumbs after this one
    setAnimatingAfter(index);

    // Navigate after animation starts
    setTimeout(() => {
      navigate(path);
      setAnimatingAfter(null);
    }, 300);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const shouldAnimate = animatingAfter !== null && index > animatingAfter;

          return (
            <div
              key={item.path}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-300",
                shouldAnimate && "opacity-0 -translate-y-2"
              )}
            >
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>
                    {isLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {item.label}
                      </span>
                    ) : (
                      item.label
                    )}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleBreadcrumbClick(item.path, index);
                      }}
                      className="hover:underline cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
