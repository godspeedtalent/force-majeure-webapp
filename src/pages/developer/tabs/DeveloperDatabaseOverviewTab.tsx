import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
import { refreshAllTableSchemas } from '@/features/data-grid/services/schemaRefresh';
import { useDatabaseCounts, useArtistsData, useVenuesData } from '../hooks/useDeveloperDatabaseData';

export function DeveloperDatabaseOverviewTab() {
  const { t } = useTranslation('common');
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);

  const { eventsCount, recordingsCount } = useDatabaseCounts();
  const { artists } = useArtistsData();
  const { venues } = useVenuesData();

  // Calculate data completeness
  const calculateCompleteness = (data: Record<string, unknown>[]) => {
    if (!data.length) return 0;

    let totalFields = 0;
    let filledFields = 0;

    data.forEach(record => {
      const fields = Object.entries(record);
      fields.forEach(([key, value]) => {
        // Skip internal fields
        if (['id', 'created_at', 'updated_at'].includes(key)) return;
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        }
      });
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  const completeness = calculateCompleteness([...artists, ...venues]);

  const handleSchemaRefresh = async () => {
    setIsRefreshingSchema(true);
    try {
      const result = await refreshAllTableSchemas();
      if (result.success) {
        toast.success(t('devTools.database.schemaRefreshSuccess', { count: result.tablesRefreshed }));
      } else {
        toast.error(result.error || t('devTools.database.schemaRefreshFailed'));
      }
    } catch (error) {
      logger.error('Error refreshing schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DeveloperDatabaseOverviewTab',
        details: {},
      });
      toast.error(t('devTools.database.schemaRefreshFailed'));
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh]'>
      {/* Schema Refresh Button */}
      <div className='w-full max-w-4xl mb-6 flex justify-end'>
        <FmCommonButton
          onClick={handleSchemaRefresh}
          disabled={isRefreshingSchema}
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          className={isRefreshingSchema ? '[&_svg]:animate-spin' : ''}
        >
          {isRefreshingSchema ? 'Refreshing Schema...' : 'Refresh Schema'}
        </FmCommonButton>
      </div>

      {/* Stats Groups in Columns */}
      <div className='w-full max-w-5xl mb-12'>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <StatCard label="Artists" value={artists.length} />
          <StatCard label="Venues" value={venues.length} />
          <StatCard label="Events" value={eventsCount} />
          <StatCard label="Recordings" value={recordingsCount} />
          <StatCard label="Complete Data" value={`${completeness}%`} />
        </div>
      </div>

      {/* Centered Search */}
      <div className='w-full max-w-2xl'>
        <DatabaseNavigatorSearch />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
      <div className='text-xs text-muted-foreground mb-1'>{label}</div>
      <div className='text-2xl font-bold text-foreground'>{value}</div>
    </div>
  );
}
