import { Skeleton } from '@/components/ui/skeleton';

export const EventRowSkeleton = () => {
  return (
    <div className='flex items-center gap-4 p-4 bg-card border border-border rounded-lg'>
      {/* Image skeleton */}
      <Skeleton className='flex-shrink-0 w-20 h-20 rounded-md' />

      {/* Content skeleton */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-start justify-between mb-2'>
          <div className='flex-1'>
            <Skeleton className='h-6 w-48 mb-1' />
            <Skeleton className='h-5 w-32 mb-1' />
            <Skeleton className='h-4 w-64' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-6 w-20' />
            <Skeleton className='h-6 w-24' />
          </div>
        </div>

        <div className='flex items-center gap-4 mb-3'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-4 w-24' />
        </div>

        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-24' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>
    </div>
  );
};
