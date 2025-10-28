import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { Badge } from '@/components/ui/shadcn/badge';
import { TopographicBackground } from '@/components/ui/misc/TopographicBackground';
import { cn } from '@/shared/utils/utils';

interface DemoLayoutProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  demoTools?: ReactNode;
  condensed?: boolean;
}

export const DemoLayout = ({
  title,
  description,
  icon: Icon,
  children,
  demoTools,
  condensed = false,
}: DemoLayoutProps) => {
  return (
    <>
      <Navigation />
      <div className="relative min-h-screen overflow-hidden">
        <TopographicBackground opacity={0.03} />
        
        <div className="container mx-auto pt-24 pb-8 px-4 relative z-10">
          <div className={cn("mx-auto", condensed ? "max-w-4xl" : "max-w-7xl")}>
          {/* Header with Demo Tools on the Right */}
          <div className="mb-4 flex gap-6">
            {/* Left: Header Info - 33% */}
            <div className="w-1/3 flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-6 w-6 text-fm-gold" />
                <h1 className="text-3xl font-canela font-bold">{title}</h1>
              </div>
              <p className="text-muted-foreground">{description}</p>
              <Badge variant="outline" className="mt-2 border-fm-gold/50">
                Development Only
              </Badge>
            </div>

            {/* Right: Demo Tools - 67% */}
            {demoTools && (
              <div className="flex-1">
                <div className="p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg">
                  <h3 className="font-canela text-lg text-white mb-4">
                    Demo Tools
                  </h3>
                  {demoTools}
                </div>
              </div>
            )}
          </div>

          {/* Decorative Divider */}
          <DecorativeDivider
            marginTop="mt-0"
            marginBottom="mb-8"
            lineWidth="w-32"
            opacity={0.5}
          />

          {/* Main Content Below Divider */}
          <div>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};
