import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Mic2,
  MapPin,
  Calendar,
  Disc3,
  Building2,
  Users,
  UserPlus,
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Database,
  Plus,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
import { refreshAllTableSchemas } from '@/features/data-grid/services/schemaRefresh';
import { useDatabaseCounts, useArtistsData, useVenuesData } from '../hooks/useDeveloperDatabaseData';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { Skeleton } from '@/components/common/shadcn/skeleton';

export function DeveloperDatabaseOverviewTab() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);

  const {
    artistsCount,
    eventsCount,
    venuesCount,
    recordingsCount,
    organizationsCount,
    usersCount,
    pendingRegistrationsCount,
    pendingUserRequestsCount,
    isLoading: isLoadingCounts,
  } = useDatabaseCounts();

  const { artists } = useArtistsData();
  const { venues } = useVenuesData();

  // Calculate data completeness per entity type
  const calculateEntityCompleteness = (
    data: Record<string, unknown>[],
    requiredFields: string[]
  ) => {
    if (!data.length) return { complete: 0, incomplete: 0, percentage: 0 };

    let complete = 0;
    let incomplete = 0;

    data.forEach(record => {
      const hasAllRequired = requiredFields.every(field => {
        const value = record[field];
        return value !== null && value !== undefined && value !== '';
      });
      if (hasAllRequired) {
        complete++;
      } else {
        incomplete++;
      }
    });

    return {
      complete,
      incomplete,
      percentage: data.length > 0 ? Math.round((complete / data.length) * 100) : 0,
    };
  };

  const artistCompleteness = useMemo(
    () =>
      calculateEntityCompleteness(artists, ['name', 'image_url', 'bio']),
    [artists]
  );

  const venueCompleteness = useMemo(
    () =>
      calculateEntityCompleteness(venues, ['name', 'city', 'capacity']),
    [venues]
  );

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

  const totalRecords = artistsCount + eventsCount + venuesCount + recordingsCount + organizationsCount + usersCount;
  const pendingItems = pendingRegistrationsCount + pendingUserRequestsCount;

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
            Database Overview
          </h1>
          <p className='text-muted-foreground'>
            Manage and monitor your database tables and records.
          </p>
        </div>
        <FmCommonButton
          onClick={handleSchemaRefresh}
          disabled={isRefreshingSchema}
          variant='secondary'
          size='sm'
          icon={RefreshCw}
          className={isRefreshingSchema ? '[&_svg]:animate-spin' : ''}
        >
          {isRefreshingSchema ? 'Refreshing...' : 'Refresh Schema'}
        </FmCommonButton>
      </div>

      {/* Summary Stats Row */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {isLoadingCounts ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            <SummaryCard
              label='Total Records'
              value={totalRecords}
              icon={Database}
              color='gold'
            />
            <SummaryCard
              label='Tables'
              value={isAdmin ? 9 : 6}
              icon={BarChart3}
              color='default'
            />
            <SummaryCard
              label='Pending Actions'
              value={pendingItems}
              icon={AlertCircle}
              color={pendingItems > 0 ? 'warning' : 'success'}
              onClick={pendingItems > 0 ? () => navigate('?table=registrations') : undefined}
            />
            <SummaryCard
              label='Data Quality'
              value={`${artistCompleteness.percentage}%`}
              icon={CheckCircle2}
              color={artistCompleteness.percentage > 80 ? 'success' : artistCompleteness.percentage > 50 ? 'warning' : 'danger'}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Quick Actions & Stats */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Table Counts */}
          <div className='bg-black/40 border border-white/10 p-[20px]'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <Database className='h-5 w-5 text-fm-gold' />
              Table Records
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {isLoadingCounts ? (
                <>
                  {Array.from({ length: isAdmin ? 6 : 4 }).map((_, i) => (
                    <TableCountCardSkeleton key={i} />
                  ))}
                </>
              ) : (
                <>
                  <TableCountCard
                    label='Artists'
                    count={artistsCount}
                    icon={Mic2}
                    onClick={() => navigate('?table=artists')}
                  />
                  <TableCountCard
                    label='Events'
                    count={eventsCount}
                    icon={Calendar}
                    onClick={() => navigate('?table=events')}
                  />
                  <TableCountCard
                    label='Venues'
                    count={venuesCount}
                    icon={MapPin}
                    onClick={() => navigate('?table=venues')}
                  />
                  <TableCountCard
                    label='Recordings'
                    count={recordingsCount}
                    icon={Disc3}
                    onClick={() => navigate('?table=recordings')}
                  />
                  {isAdmin && (
                    <>
                      <TableCountCard
                        label='Organizations'
                        count={organizationsCount}
                        icon={Building2}
                        onClick={() => navigate('?table=organizations')}
                      />
                      <TableCountCard
                        label='Users'
                        count={usersCount}
                        icon={Users}
                        onClick={() => navigate('?table=users')}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pending Items (Admin Only) */}
          {isAdmin && (pendingRegistrationsCount > 0 || pendingUserRequestsCount > 0) && (
            <div className='bg-fm-gold/10 border border-fm-gold/30 p-[20px]'>
              <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-fm-gold' />
                Pending Actions
              </h2>
              <div className='space-y-3'>
                {pendingRegistrationsCount > 0 && (
                  <PendingActionCard
                    label='Artist Registrations'
                    count={pendingRegistrationsCount}
                    icon={UserPlus}
                    onClick={() => navigate('?table=registrations')}
                  />
                )}
                {pendingUserRequestsCount > 0 && (
                  <PendingActionCard
                    label='User Requests'
                    count={pendingUserRequestsCount}
                    icon={FileQuestion}
                    onClick={() => navigate('?table=user_requests')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Data Quality */}
          <div className='bg-black/40 border border-white/10 p-[20px]'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-fm-gold' />
              Data Completeness
            </h2>
            <div className='space-y-4'>
              <CompletenessBar
                label='Artists'
                complete={artistCompleteness.complete}
                incomplete={artistCompleteness.incomplete}
                percentage={artistCompleteness.percentage}
                requiredFields='name, image, bio'
              />
              <CompletenessBar
                label='Venues'
                complete={venueCompleteness.complete}
                incomplete={venueCompleteness.incomplete}
                percentage={venueCompleteness.percentage}
                requiredFields='name, city, capacity'
              />
            </div>
          </div>

          {/* Quick Create Actions */}
          <div className='bg-black/40 border border-white/10 p-[20px]'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <Plus className='h-5 w-5 text-fm-gold' />
              Quick Create
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <QuickCreateButton
                label='Artist'
                icon={Mic2}
                onClick={() => navigate('/artists/create')}
              />
              <QuickCreateButton
                label='Event'
                icon={Calendar}
                onClick={() => navigate('/events/create')}
              />
              <QuickCreateButton
                label='Venue'
                icon={MapPin}
                onClick={() => navigate('/venues/create')}
              />
              {isAdmin && (
                <QuickCreateButton
                  label='Organization'
                  icon={Building2}
                  onClick={() => navigate('/organizations/create')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Search */}
        <div className='space-y-6'>
          <div className='bg-black/40 border border-white/10 p-[20px]'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              Quick Search
            </h2>
            <DatabaseNavigatorSearch />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: typeof Database;
  color?: 'default' | 'gold' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

function SummaryCard({ label, value, icon: Icon, color = 'default', onClick }: SummaryCardProps) {
  const colorClasses = {
    default: 'border-white/10 bg-black/40',
    gold: 'border-fm-gold/30 bg-fm-gold/10',
    success: 'border-green-500/30 bg-green-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    danger: 'border-red-500/30 bg-red-500/10',
  };

  const iconColorClasses = {
    default: 'text-muted-foreground',
    gold: 'text-fm-gold',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`${colorClasses[color]} border p-[20px] text-left transition-all duration-200 ${
        onClick ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className='flex items-center justify-between mb-2'>
        <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />
      </div>
      <div className='text-2xl font-bold text-foreground'>{value}</div>
      <div className='text-xs text-muted-foreground mt-1'>{label}</div>
    </button>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className='border-white/10 bg-black/40 border p-[20px]'>
      <div className='flex items-center justify-between mb-2'>
        <Skeleton className='h-5 w-5 rounded-none' />
      </div>
      <Skeleton className='h-8 w-20 rounded-none' />
      <Skeleton className='h-3 w-24 rounded-none mt-2' />
    </div>
  );
}

function TableCountCardSkeleton() {
  return (
    <div className='flex items-center gap-3 p-3 bg-white/5 border border-white/10'>
      <Skeleton className='h-4 w-4 rounded-none' />
      <div className='flex-1'>
        <Skeleton className='h-4 w-16 rounded-none' />
      </div>
      <Skeleton className='h-6 w-8 rounded-none' />
    </div>
  );
}

interface TableCountCardProps {
  label: string;
  count: number;
  icon: typeof Database;
  onClick: () => void;
}

function TableCountCard({ label, count, icon: Icon, onClick }: TableCountCardProps) {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-fm-gold/30 transition-all group text-left'
    >
      <Icon className='h-4 w-4 text-muted-foreground group-hover:text-fm-gold transition-colors' />
      <div className='flex-1'>
        <div className='text-sm font-medium'>{label}</div>
      </div>
      <div className='text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors'>
        {count}
      </div>
    </button>
  );
}

interface PendingActionCardProps {
  label: string;
  count: number;
  icon: typeof Database;
  onClick: () => void;
}

function PendingActionCard({ label, count, icon: Icon, onClick }: PendingActionCardProps) {
  return (
    <button
      onClick={onClick}
      className='w-full flex items-center justify-between p-3 bg-fm-gold/10 hover:bg-fm-gold/20 border border-fm-gold/30 transition-all group'
    >
      <div className='flex items-center gap-3'>
        <Icon className='h-4 w-4 text-fm-gold' />
        <span className='text-sm font-medium'>{label}</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='px-2 py-0.5 bg-fm-gold text-black text-xs font-bold'>
          {count}
        </span>
        <ArrowRight className='h-4 w-4 text-fm-gold opacity-0 group-hover:opacity-100 transition-opacity' />
      </div>
    </button>
  );
}

interface CompletenessBarProps {
  label: string;
  complete: number;
  incomplete: number;
  percentage: number;
  requiredFields: string;
}

function CompletenessBar({ label, complete, incomplete, percentage, requiredFields }: CompletenessBarProps) {
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>{label}</span>
          <span className='text-xs text-muted-foreground'>({requiredFields})</span>
        </div>
        <span className='text-sm font-bold'>{percentage}%</span>
      </div>
      <div className='h-2 bg-white/10 rounded-full overflow-hidden'>
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className='flex justify-between text-xs text-muted-foreground mt-1'>
        <span>{complete} complete</span>
        <span>{incomplete} incomplete</span>
      </div>
    </div>
  );
}

interface QuickCreateButtonProps {
  label: string;
  icon: typeof Database;
  onClick: () => void;
}

function QuickCreateButton({ label, icon: Icon, onClick }: QuickCreateButtonProps) {
  return (
    <button
      onClick={onClick}
      className='flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-fm-gold/10 border border-white/10 hover:border-fm-gold/30 transition-all group'
    >
      <div className='w-10 h-10 rounded-full bg-white/10 group-hover:bg-fm-gold/20 flex items-center justify-center transition-colors'>
        <Icon className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
      </div>
      <span className='text-xs font-medium'>{label}</span>
    </button>
  );
}
