import { Badge } from '@/components/ui/shadcn/badge';
import {
  FlaskConical,
  Zap,
  Database,
  Shield,
  Users,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { useNavigate } from 'react-router-dom';

export default function TestingIndex() {
  const navigate = useNavigate();

  const testSuites = [
    {
      title: 'Ticket Purchase Load Tests',
      description: 'Performance load testing simulating thousands of concurrent ticket purchases',
      icon: ShoppingCart,
      category: 'Performance',
      status: 'Ready',
      testCount: 7,
      route: '/testing/checkout-flow',
    },
  ];

  return (
    <DemoLayout
      title="Testing Dashboard"
      description="Launch comprehensive smoke tests and validate application functionality"
      icon={FlaskConical}
    >
      {/* Test Suites */}
      <div className="space-y-4">
        {testSuites.map((suite) => {
          const Icon = suite.icon;
          return (
            <div
              key={suite.title}
              className="group cursor-pointer"
              onClick={() => navigate(suite.route)}
            >
              <div className="p-6 border border-border rounded-lg bg-card hover:bg-accent/5 hover:border-fm-gold/50 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-fm-gold/10 rounded-md group-hover:bg-fm-gold/20 transition-colors">
                        <Icon className="h-5 w-5 text-fm-gold" />
                      </div>
                      <h2 className="text-2xl font-canela font-semibold group-hover:text-fm-gold transition-colors">
                        {suite.title}
                      </h2>
                      <Badge variant="outline" className="ml-auto">
                        {suite.category}
                      </Badge>
                      <Badge variant="secondary">
                        {suite.testCount} tests
                      </Badge>
                    </div>
                    <p className="text-muted-foreground pl-14">
                      {suite.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Run test suite</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          Testing tools are only accessible to admin and developer users in development mode
        </p>
      </div>
    </DemoLayout>
  );
}
