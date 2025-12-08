import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/shadcn/button';
import { Home } from 'lucide-react';
import { logger } from '@/shared/services/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error('404 Error: User attempted to access non-existent route', {
      route: location.pathname,
      source: 'NotFound.tsx',
    });
  }, [location.pathname]);

  return (
    <Layout>
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-6xl font-canela mb-4 text-fm-gold'>404</h1>
          <p className='text-xl text-foreground mb-8'>Oops! Page not found</p>
          <Button asChild variant='outline' className='border-white/20 hover:bg-white/10'>
            <Link to='/'>
              <Home className='mr-2 h-4 w-4' />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
