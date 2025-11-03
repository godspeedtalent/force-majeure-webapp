import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/common/shadcn/card';
import { supabase } from '@/shared/api/supabase/client';
import { LoadingState } from '@/components/common/LoadingState';

export default function Statistics() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setUserCount(count || 0);
      } catch (error) {
        console.error('Error fetching user count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Layout>
      <div className="container mx-auto pt-8 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6 text-fm-gold" />
            <h1 className="text-3xl font-canela font-bold">Statistics</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Application metrics and analytics
          </p>

          <DecorativeDivider
            marginTop="mt-0"
            marginBottom="mb-8"
            lineWidth="w-32"
            opacity={0.5}
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 bg-black/40 border-white/20">
              <div className="space-y-2">
                <p className="text-sm text-white/60 uppercase tracking-wide">
                  Registered Users
                </p>
                <p className="text-4xl font-canela font-bold text-fm-gold">
                  {userCount?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-white/50">
                  Total number of user accounts
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
