import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, ShoppingCart } from 'lucide-react';

export default function DemoIndex() {
  const demos = [
    {
      title: 'Event Checkout',
      description: 'Test the complete ticket purchasing flow with Stripe integration',
      path: '/demo/event-checkout',
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Developer Demos</h1>
          </div>
          <p className="text-muted-foreground">
            Test and debug application features in isolation
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {demos.map((demo) => {
            const Icon = demo.icon;
            return (
              <Link key={demo.path} to={demo.path}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle>{demo.title}</CardTitle>
                    </div>
                    <CardDescription>{demo.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-muted-foreground">
                      Click to open demo →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
