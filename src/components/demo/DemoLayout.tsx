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
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-6 w-6 text-fm-gold" />
              <h1 className="text-3xl font-canela font-bold">{title}</h1>
            </div>
            <p className="text-muted-foreground">{description}</p>
            <Badge variant="outline" className="mt-2 border-fm-gold/50">
              Development Only
            </Badge>
          </div>

          {/* Decorative Divider */}
          <DecorativeDivider
            marginTop="mt-8"
            marginBottom="mb-8"
            lineWidth="w-32"
            opacity={0.5}
          />

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-3">{children}</div>

            {/* Right Column - Demo Tools */}
            {demoTools && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="p-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg">
                    <h3 className="font-canela text-lg text-white mb-4">
                      Demo Tools
                    </h3>
                    {demoTools}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
