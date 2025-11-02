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

export default function TestingIndex() {
  const testSuites = [
    {
      title: 'Authentication Tests',
      description: 'Test user registration, login, logout, password reset, and session management flows',
      icon: Shield,
      category: 'Security',
      status: 'Ready',
      testCount: 12,
    },
    {
      title: 'Database Tests',
      description: 'Validate data persistence, relationships, constraints, and query performance across all tables',
      icon: Database,
      category: 'Backend',
      status: 'Ready',
      testCount: 24,
    },
    {
      title: 'User Management Tests',
      description: 'Test user roles, permissions, profile updates, and access control mechanisms',
      icon: Users,
      category: 'Security',
      status: 'Ready',
      testCount: 18,
    },
    {
      title: 'Checkout Flow Tests',
      description: 'End-to-end testing of ticket purchasing, payment processing, and order confirmation',
      icon: ShoppingCart,
      category: 'E-Commerce',
      status: 'Ready',
      testCount: 15,
    },
    {
      title: 'Performance Tests',
      description: 'Load testing, stress testing, and performance benchmarking across critical user paths',
      icon: Zap,
      category: 'Performance',
      status: 'Ready',
      testCount: 8,
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
              className="group"
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
