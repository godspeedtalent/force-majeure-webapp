import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// A skeleton placeholder that mirrors the EventCard/CommonCard layout
export const EventCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card border-0 border-l-[3px] border-l-fm-crimson dark:border-l-fm-gold">
      {/* Image area */}
      <div className="relative aspect-[4/5] overflow-hidden max-h-[400px]">
        <Skeleton className="absolute inset-0" />

        {/* Bottom content: pill + title + optional badge (inline style) */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-background/70 text-foreground px-4 py-1.5 text-base font-medium max-w-full">
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-56" />
        </div>

        {/* Top-right badge (when not inline) — keep hidden to match space if layout changes */}
      </div>

      {/* Footer content to mimic EventCard details */}
      <CardContent className="p-4">
        <Skeleton className="h-4 w-[85%] mb-3" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
};
