import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/common/shadcn/breadcrumb';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
import { useBreadcrumbs } from '@/shared/hooks/useBreadcrumbs';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { cn } from '@/shared';

const MAX_BREADCRUMB_LENGTH = 20;

/**
 * Truncates text to a maximum length with ellipsis
 */
const truncateLabel = (label: string, maxLength: number = MAX_BREADCRUMB_LENGTH): string => {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength)}...`;
};

/**
 * Comprehensive breadcrumb navigation component
 * Automatically generates breadcrumbs based on current route
 * Supports nested routes, dynamic segments, and async data resolution
 */
export const Breadcrumbs = () => {
  const { breadcrumbs, isLoading } = useBreadcrumbs();
  const navigate = useNavigate();
  const { hasRole } = useUserPermissions();
  const [animatingAfter, setAnimatingAfter] = useState<number | null>(null);

  const isAdminOrDeveloper = hasRole(ROLES.ADMIN) || hasRole(ROLES.DEVELOPER);

  // Don't render anything if no breadcrumbs (including the separator)
  if (breadcrumbs.length === 0) {
    return null;
  }

  const handleBreadcrumbClick = (path: string, index: number, label: string) => {
    // Trigger animation for all breadcrumbs after this one
    setAnimatingAfter(index);

    // Navigate after animation starts
    setTimeout(() => {
      let targetPath = path;

      // Special breadcrumb redirects
      // Venues breadcrumb always goes to homepage (no public venues listing yet)
      if (label.toLowerCase() === 'venues') {
        targetPath = '/';
      }
      // If user is admin/developer, redirect Artists/Events breadcrumbs to database
      else if (isAdminOrDeveloper) {
        // Check if this is an event detail page or artists page
        if (path.startsWith('/event/') || label.toLowerCase() === 'events') {
          targetPath = '/developer/database?table=events';
        } else if (path.startsWith('/artist/') || label.toLowerCase() === 'artists') {
          targetPath = '/developer/database?table=artists';
        }
      }

      navigate(targetPath);
      setAnimatingAfter(null);
    }, 300);
  };

  return (
    <>
      <span className='mx-3 text-muted-foreground'>&gt;</span>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const shouldAnimate =
              animatingAfter !== null && index > animatingAfter;

            return (
              <div
                key={item.path}
                className={cn(
                  'flex items-center gap-1.5 transition-all duration-300',
                  shouldAnimate && 'opacity-0 -translate-y-2'
                )}
              >
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage>
                      {isLoading ? (
                        <span className='flex items-center gap-1'>
                          <FmGoldenGridLoader size="sm" />
                          {truncateLabel(item.label)}
                        </span>
                      ) : (
                        truncateLabel(item.label)
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          handleBreadcrumbClick(item.path, index, item.label);
                        }}
                        className='hover:underline cursor-pointer'
                      >
                        {truncateLabel(item.label)}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
};
