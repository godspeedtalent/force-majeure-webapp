import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast?: boolean;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];

      // Home is always first
      items.push({ label: 'Home', path: '/' });

      if (pathSegments.length === 0) {
        setBreadcrumbs([]);
        return;
      }

      // Handle event details page
      if (pathSegments[0] === 'event' && pathSegments[1]) {
        try {
          const { data: eventData } = await supabase
            .from('events')
            .select('title, headliner_artist:artists!events_headliner_id_fkey(name)')
            .eq('id', pathSegments[1])
            .single();

          if (eventData) {
            items.push({
              label: eventData.headliner_artist?.name || 'Event',
              path: `/event/${pathSegments[1]}`,
              isLast: true
            });
          }
        } catch (error) {
          items.push({
            label: 'Event',
            path: `/event/${pathSegments[1]}`,
            isLast: true
          });
        }
      }

      // Handle merch page
      if (pathSegments[0] === 'merch') {
        items.push({
          label: 'Merchandise',
          path: '/merch',
          isLast: true
        });
      }

      // Handle profile page
      if (pathSegments[0] === 'profile') {
        items.push({
          label: 'Profile Settings',
          path: '/profile',
          isLast: true
        });
      }

      setBreadcrumbs(items.slice(1)); // Remove home from display (we show it differently)
    };

    generateBreadcrumbs();
  }, [location.pathname]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {item.isLast ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link 
              to={item.path}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};