import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/shadcn/badge';
import { Code, Package, ArrowRight, FlaskConical } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';

export default function DeveloperIndex() {
  const pages = [
    {
      title: 'FM Components Catalog',
      description: 'Comprehensive catalog of all Force Majeure common components with live demos, documentation, and relationship graph visualization',
      path: '/developer/components',
      icon: Package,
      category: 'Documentation',
      status: 'Active',
    },
    {
      title: 'Demo Tools',
      description: 'Test application features including event checkout flow, email templates, and interactive demos',
      path: '/developer/demo',
      icon: FlaskConical,
      category: 'Testing',
      status: 'Active',
    },
  ];

  return (
    <DemoLayout
      title="Developer Tools"
      description="Developer resources, component documentation, and testing utilities"
      icon={Code}
    >
      {/* Page List */}
      <div className="space-y-4">
        {pages.map((page) => {
          const Icon = page.icon;
          return (
            <Link 
              key={page.path} 
              to={page.path}
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
                        {page.title}
                      </h2>
                      <Badge variant="outline" className="ml-auto">
                        {page.category}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground pl-14">
                      {page.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-fm-gold pl-14 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Open page</span>
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
          These tools are only accessible to admin and developer users
        </p>
      </div>
    </DemoLayout>
  );
}
