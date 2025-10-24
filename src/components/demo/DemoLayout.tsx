import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import { Badge } from '@/components/ui/badge';

interface DemoLayoutProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  demoTools?: ReactNode;
}

export const DemoLayout = ({
  title,
  description,
  icon: Icon,
  children,
  demoTools,
}: DemoLayoutProps) => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with Demo Tools on the Right */}
          <div className="mb-4 flex gap-6">
            {/* Left: Header Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-6 w-6 text-fm-gold" />
                <h1 className="text-3xl font-canela font-bold">{title}</h1>
              </div>
              <p className="text-muted-foreground">{description}</p>
              <Badge variant="outline" className="mt-2 border-fm-gold/50">
                Development Only
              </Badge>
            </div>

            {/* Right: Demo Tools */}
            {demoTools && (
              <div className="w-80 flex-shrink-0">
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
    </>
  );
};
