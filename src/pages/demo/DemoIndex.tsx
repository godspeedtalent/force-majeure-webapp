import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Code, ShoppingCart, ArrowRight } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';

export default function DemoIndex() {
  const demos = [
    {
      title: 'Event Checkout',
      description: 'Complete ticket purchasing flow with Stripe checkout integration, inventory management, and order tracking',
      path: '/demo/event-checkout',
      icon: ShoppingCart,
      category: 'E-Commerce',
      status: 'Active',
    },
  ];

  return (
    <DemoLayout
      title="Developer Demos"
      description="Test and explore application features in a controlled environment"
      icon={Code}
    >
      {/* Demo List */}
      <div className="space-y-4">
        {demos.map((demo) => {
          const Icon = demo.icon;
          return (
            <Link 
              key={demo.path} 
              to={demo.path}
              className="block group"
            >
              <div className="p-6 border border-border rounded-lg bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fm-gold/10 rounded-md group-hover:bg-fm-gold/20 transition-colors">
                        <Icon className="h-5 w-5 text-fm-gold" />
                      </div>
                      <h2 className="text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors">
                        {demo.title}
                      </h2>
                      <Badge variant="outline" className="ml-auto">
                        {demo.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground pl-14">
                      {demo.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Open demo</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          These demos are only accessible to admin users and are not visible in production
        </p>
      </div>
    </DemoLayout>
  );
}
