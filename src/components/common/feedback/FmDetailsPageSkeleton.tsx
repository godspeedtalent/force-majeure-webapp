import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';

interface FmDetailsPageSkeletonProps {
  /**
   * Whether to show a hero/banner image placeholder
   */
  showHero?: boolean;
  /**
   * Whether to show sidebar cards
   */
  showSidebar?: boolean;
  /**
   * Number of content sections to show
   */
  contentSections?: number;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmDetailsPageSkeleton - A skeleton placeholder for detail pages.
 *
 * Mirrors the layout of detail pages like ArtistDetails, VenueDetails, etc.
 * with header, hero image, content sections, and optional sidebar.
 *
 * @example
 * // Basic usage
 * <FmDetailsPageSkeleton />
 *
 * @example
 * // With hero and sidebar
 * <FmDetailsPageSkeleton showHero showSidebar />
 */
export const FmDetailsPageSkeleton = ({
  showHero = false,
  showSidebar = true,
  contentSections = 2,
  className,
}: FmDetailsPageSkeletonProps) => {
  return (
    <div className={cn('w-full lg:w-[70%] mx-auto py-8 px-4 space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          {/* Back button */}
          <Skeleton className='h-9 w-20 rounded-none' />
          <div className='space-y-2'>
            {/* Title with icon */}
            <div className='flex items-center gap-3'>
              <Skeleton className='h-8 w-8 rounded-none' />
              <Skeleton className='h-8 w-48 rounded-none' />
            </div>
            {/* Subtitle */}
            <Skeleton className='h-4 w-32 rounded-none' />
          </div>
        </div>
      </div>

      <Separator />

      {/* Hero Image */}
      {showHero && (
        <Skeleton className='w-full h-64 rounded-none' />
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className={cn('space-y-6', showSidebar ? 'md:col-span-2' : 'md:col-span-3')}>
          {Array.from({ length: contentSections }).map((_, index) => (
            <FmCommonCard key={index}>
              <FmCommonCardHeader>
                <Skeleton className='h-6 w-40 rounded-none' />
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-4'>
                {/* Image placeholder for first section */}
                {index === 0 && (
                  <Skeleton className='w-48 h-48 rounded-none' />
                )}

                {/* Field rows */}
                <div className='space-y-3'>
                  <div>
                    <Skeleton className='h-3 w-16 rounded-none mb-1' />
                    <Skeleton className='h-5 w-32 rounded-none' />
                  </div>
                  <div>
                    <Skeleton className='h-3 w-20 rounded-none mb-1' />
                    <Skeleton className='h-5 w-24 rounded-none' />
                  </div>
                  <div>
                    <Skeleton className='h-3 w-24 rounded-none mb-1' />
                    <Skeleton className='h-16 w-full rounded-none' />
                  </div>
                </div>
              </FmCommonCardContent>
            </FmCommonCard>
          ))}
        </div>

        {/* Right Column - Sidebar */}
        {showSidebar && (
          <div className='space-y-6'>
            {/* Metadata Card */}
            <FmCommonCard>
              <FmCommonCardHeader>
                <Skeleton className='h-6 w-24 rounded-none' />
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-3'>
                <div>
                  <Skeleton className='h-3 w-12 rounded-none mb-1' />
                  <Skeleton className='h-4 w-full rounded-none font-mono' />
                </div>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <Skeleton className='h-4 w-4 rounded-none' />
                    <Skeleton className='h-3 w-16 rounded-none' />
                  </div>
                  <Skeleton className='h-4 w-28 rounded-none' />
                </div>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <Skeleton className='h-4 w-4 rounded-none' />
                    <Skeleton className='h-3 w-20 rounded-none' />
                  </div>
                  <Skeleton className='h-4 w-28 rounded-none' />
                </div>
              </FmCommonCardContent>
            </FmCommonCard>

            {/* Actions Card */}
            <FmCommonCard>
              <FmCommonCardHeader>
                <Skeleton className='h-6 w-20 rounded-none' />
              </FmCommonCardHeader>
              <FmCommonCardContent className='space-y-2'>
                <Skeleton className='h-10 w-full rounded-none' />
                <Skeleton className='h-10 w-full rounded-none' />
              </FmCommonCardContent>
            </FmCommonCard>
          </div>
        )}
      </div>
    </div>
  );
};
