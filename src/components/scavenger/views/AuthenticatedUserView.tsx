import { MessagePanel } from '@/components/MessagePanel';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Button } from '@/components/ui/button';

interface AuthenticatedUserViewProps {
  displayName?: string;
  totalUndiscoveredCheckpoints: number;
  isLoading?: boolean;
}

export function AuthenticatedUserView({ 
  displayName, 
  totalUndiscoveredCheckpoints, 
  isLoading 
}: AuthenticatedUserViewProps) {
  return (
    <MessagePanel
      isLoading={isLoading}
      title={`Welcome back, ${displayName || 'Raver'}!`}
      description={totalUndiscoveredCheckpoints > 0 ? "Each checkpoint you discover gets you and a friend on the guestlist! Head out and scan the QR codes." : undefined}
      action={
        <>
          <div className="text-center mb-8">
            {totalUndiscoveredCheckpoints > 0 ? (
              <>
                <p className="text-lg text-muted-foreground mb-4">
                  Undiscovered Checkpoints
                </p>
                <AnimatedCounter value={totalUndiscoveredCheckpoints} />
              </>
            ) : (
              <>
                <p className="text-xl text-muted-foreground mb-6">
                  All checkpoints have been discovered! Tickets are still available below:
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  asChild
                >
                  <a 
                    href="https://www.etix.com/ticket/p/45040939/lf-system-austin-kingdom-nightclub?partner_id=100&_gl=1*1nkxwlr*_gcl_au*ODMxOTAwNDA1LjE3NTMxMDk5NzU.*_ga*MTYzNTgzMjU4MS4xNzUzMTA5OTc1*_ga_FE6TSQF71T*czE3NTYyMjUzMTkkbzkkZzEkdDE3NTYyMjUzNTIkajI3JGwwJGgxMjA5MDYyMDIx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Tickets
                  </a>
                </Button>
              </>
            )}
          </div>
        </>
      }
    />
  );
}