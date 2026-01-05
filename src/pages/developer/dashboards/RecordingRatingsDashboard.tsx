/**
 * RecordingRatingsDashboard
 *
 * Dashboard component for analyzing recording ratings.
 * Provides filtering, sorting, and drill-down capabilities to find artists for events.
 *
 * This is rendered inside the DeveloperDashboards page.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  BarChart3,
  Users,
  TrendingUp,
  Download,
  Filter,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';
import { SiSpotify, SiSoundcloud } from 'react-icons/si';
import { cn } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import {
  useRecordingsWithRatings,
  useRatingDashboardStats,
} from '@/shared/api/queries/recordingRatingQueries';
import type { RecordingAnalyticsFilters } from '@/shared/types/recordingRatings';

// Score range options
const SCORE_RANGE_OPTIONS = [
  { value: 'all', label: 'All scores' },
  { value: '8-10', label: '8+ (Excellent)' },
  { value: '6-10', label: '6+ (Good)' },
  { value: '4-10', label: '4+ (Average)' },
  { value: '1-5', label: 'Below 6' },
];

// Platform options
const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All platforms' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'youtube', label: 'YouTube' },
];

// Recording type options
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'dj_set', label: 'DJ Sets' },
  { value: 'track', label: 'Tracks' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'average_score-desc', label: 'Highest rated' },
  { value: 'average_score-asc', label: 'Lowest rated' },
  { value: 'rating_count-desc', label: 'Most reviewed' },
  { value: 'rating_count-asc', label: 'Least reviewed' },
  { value: 'created_at-desc', label: 'Newest' },
  { value: 'created_at-asc', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

// Min rating count options
const MIN_RATINGS_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '1', label: 'At least 1' },
  { value: '2', label: 'At least 2' },
  { value: '3', label: 'At least 3' },
  { value: '5', label: 'At least 5' },
];

// Grid columns
const recordingColumns = [
  {
    key: 'cover_art',
    label: '',
    width: '60px',
    render: (value: string) => (
      <div className="w-10 h-10 bg-muted rounded overflow-hidden">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'name',
    label: 'Recording',
    sortable: true,
    render: (value: string, row: any) => (
      <div className="max-w-[200px]">
        <p className="font-medium truncate">{value}</p>
        <p className="text-xs text-muted-foreground truncate">
          {row.artists?.name || 'Unknown Artist'}
        </p>
      </div>
    ),
  },
  {
    key: 'platform',
    label: 'Platform',
    width: '100px',
    render: (value: string) => (
      <div className="flex items-center gap-1.5">
        {value === 'spotify' ? (
          <SiSpotify className="h-4 w-4 text-[#1DB954]" />
        ) : (
          <SiSoundcloud className="h-4 w-4 text-[#FF5500]" />
        )}
        <span className="text-xs capitalize">{value}</span>
      </div>
    ),
  },
  {
    key: 'recording_type',
    label: 'Type',
    width: '80px',
    render: (value: string) => (
      <span
        className={cn(
          'text-xs px-2 py-0.5 uppercase',
          value === 'dj_set'
            ? 'bg-fm-navy/20 text-fm-navy'
            : 'bg-white/10 text-white/70'
        )}
      >
        {value === 'dj_set' ? 'DJ Set' : 'Track'}
      </span>
    ),
  },
  {
    key: 'avg_score',
    label: 'Avg Score',
    width: '100px',
    sortable: true,
    render: (_value: any, row: any) => {
      const ratings = row.recording_ratings || [];
      if (ratings.length === 0) return <span className="text-muted-foreground">-</span>;
      const avg = ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length;
      return (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-fm-gold text-fm-gold" />
          <span className="font-bold text-fm-gold">{avg.toFixed(1)}</span>
        </div>
      );
    },
  },
  {
    key: 'rating_count',
    label: 'Ratings',
    width: '80px',
    sortable: true,
    render: (_value: any, row: any) => {
      const count = row.recording_ratings?.length || 0;
      return (
        <span className={count === 0 ? 'text-muted-foreground' : ''}>
          {count}
        </span>
      );
    },
  },
  {
    key: 'created_at',
    label: 'Added',
    width: '100px',
    sortable: true,
    render: (value: string) => (
      <span className="text-xs text-muted-foreground">
        {new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        })}
      </span>
    ),
  },
];

export default function RecordingRatingsDashboard() {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();

  // Filter state
  const [scoreRange, setScoreRange] = useState('all');
  const [platform, setPlatform] = useState<'all' | 'spotify' | 'soundcloud' | 'youtube'>('all');
  const [recordingType, setRecordingType] = useState<'all' | 'track' | 'dj_set'>('all');
  const [sortOption, setSortOption] = useState('average_score-desc');
  const [minRatings, setMinRatings] = useState('0');

  // Parse sort option
  const [sortBy, sortDirection] = sortOption.split('-') as [
    'average_score' | 'rating_count' | 'created_at' | 'name',
    'asc' | 'desc'
  ];

  // Parse score range
  const scoreFilter = useMemo(() => {
    if (scoreRange === 'all') return {};
    const [min, max] = scoreRange.split('-').map(Number);
    return { minScore: min, maxScore: max };
  }, [scoreRange]);

  // Build filters
  const filters: RecordingAnalyticsFilters = useMemo(
    () => ({
      ...scoreFilter,
      platform: platform as 'spotify' | 'soundcloud' | 'youtube' | 'all',
      recordingType: recordingType as 'track' | 'dj_set' | 'all',
      minRatingCount: parseInt(minRatings),
      sortBy,
      sortDirection,
    }),
    [scoreFilter, platform, recordingType, minRatings, sortBy, sortDirection]
  );

  // Fetch data
  const { data: recordings, isLoading: recordingsLoading } =
    useRecordingsWithRatings(filters);
  const { data: dashboardStats, isLoading: statsLoading } =
    useRatingDashboardStats();

  // Calculate distribution for chart
  const distributionData = useMemo(() => {
    if (!recordings) return [];

    const counts: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      counts[i] = 0;
    }

    recordings.forEach(recording => {
      recording.recording_ratings.forEach(rating => {
        counts[rating.score]++;
      });
    });

    return Object.entries(counts).map(([score, count]) => ({
      score: parseInt(score),
      count,
    }));
  }, [recordings]);

  // Calculate ratings over time
  const ratingsOverTime = useMemo(() => {
    if (!recordings) return [];

    const byMonth: Record<string, number> = {};

    recordings.forEach(recording => {
      recording.recording_ratings.forEach(rating => {
        const date = new Date(rating.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
      });
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        count,
      }));
  }, [recordings]);

  // Context menu actions
  const contextMenuActions: DataGridAction[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => navigate(`/recordings/${row.id}`),
    },
    {
      label: 'Open Link',
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: (row: any) => {
        if (row.url) {
          window.open(row.url, '_blank', 'noopener,noreferrer');
        }
      },
    },
  ];

  // Export to CSV
  const handleExport = () => {
    if (!recordings) return;

    const headers = ['Name', 'Artist', 'Platform', 'Type', 'Avg Score', 'Rating Count', 'URL'];
    const rows = recordings.map(r => {
      const avg = r.recording_ratings.length > 0
        ? (r.recording_ratings.reduce((s, rt) => s + rt.score, 0) / r.recording_ratings.length).toFixed(1)
        : '-';
      return [
        r.name,
        r.artists?.name || 'Unknown',
        r.platform,
        r.recording_type,
        avg,
        r.recording_ratings.length,
        r.url,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-ratings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = recordingsLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-canela font-bold">
            {t('recordingAnalytics.title', 'Recording Ratings')}
          </h1>
          <p className="text-muted-foreground">
            {t(
              'recordingAnalytics.description',
              'Analyze ratings to find artists for your events'
            )}
          </p>
        </div>
        <FmCommonButton
          variant="secondary"
          icon={Download}
          onClick={handleExport}
          disabled={!recordings || recordings.length === 0}
        >
          Export CSV
        </FmCommonButton>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <FmCommonCard key={i} className="h-24 animate-pulse bg-white/5">
              <div className="h-full" />
            </FmCommonCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FmCommonCard size="sm" className="text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-3xl font-bold">
              {dashboardStats?.totalRatedRecordings || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Rated Recordings
            </p>
          </FmCommonCard>

          <FmCommonCard size="sm" className="text-center">
            <Star className="h-5 w-5 mx-auto text-fm-gold mb-2" />
            <p className="text-3xl font-bold text-fm-gold">
              {dashboardStats?.averageOverallScore?.toFixed(1) || '-'}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Avg Score
            </p>
          </FmCommonCard>

          <FmCommonCard size="sm" className="text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-3xl font-bold">
              {dashboardStats?.totalRatings || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Total Ratings
            </p>
          </FmCommonCard>

          <FmCommonCard size="sm" className="text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-lg font-bold truncate px-2">
              {dashboardStats?.topRatedRecording?.name || '-'}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Top Rated
            </p>
          </FmCommonCard>
        </div>
      )}

      {/* Filters */}
      <FmCommonCard>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FmCommonSelect
            options={SCORE_RANGE_OPTIONS}
            value={scoreRange}
            onChange={(value) => setScoreRange(value)}
            placeholder="Score range"
          />
          <FmCommonSelect
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(value) => setPlatform(value as 'all' | 'spotify' | 'soundcloud' | 'youtube')}
            placeholder="Platform"
          />
          <FmCommonSelect
            options={TYPE_OPTIONS}
            value={recordingType}
            onChange={(value) => setRecordingType(value as 'all' | 'track' | 'dj_set')}
            placeholder="Type"
          />
          <FmCommonSelect
            options={MIN_RATINGS_OPTIONS}
            value={minRatings}
            onChange={(value) => setMinRatings(value)}
            placeholder="Min ratings"
          />
          <FmCommonSelect
            options={SORT_OPTIONS}
            value={sortOption}
            onChange={(value) => setSortOption(value)}
            placeholder="Sort by"
          />
        </div>
      </FmCommonCard>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score Distribution */}
        <FmCommonCard>
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Score Distribution
          </h4>
          <div className="h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <FmCommonLoadingSpinner size="md" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <XAxis
                    dataKey="score"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    width={30}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#dfba7d' : '#374151'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </FmCommonCard>

        {/* Ratings Over Time */}
        <FmCommonCard>
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-4">
            Ratings Over Time
          </h4>
          <div className="h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <FmCommonLoadingSpinner size="md" />
              </div>
            ) : ratingsOverTime.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingsOverTime}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: 0,
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#dfba7d"
                    strokeWidth={2}
                    dot={{ fill: '#dfba7d', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </FmCommonCard>
      </div>

      {/* Data Grid */}
      <FmCommonCard className="p-0">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-medium">
            Recordings ({recordings?.length || 0})
          </h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <FmCommonLoadingSpinner size="lg" />
          </div>
        ) : (
          <FmConfigurableDataGrid
            gridId="recording-ratings-dashboard"
            data={recordings || []}
            columns={recordingColumns}
            contextMenuActions={contextMenuActions}
            loading={false}
            pageSize={15}
            resourceName="Recording"
          />
        )}
      </FmCommonCard>
    </div>
  );
}
