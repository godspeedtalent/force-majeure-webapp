import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Disc3,
  ArrowUpDown,
  Clock,
  Star,
  Pencil,
  Trash2,
  RefreshCw,
  Plus,
  Music,
} from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiYoutube } from 'react-icons/si';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmRecordingLink } from '@/components/common/links/FmRecordingLink';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmFormSectionHeader } from '@/components/common/forms/FmFormSectionHeader';
import { cn, useIsMobile } from '@/shared';
import type { ArtistRecording } from '@/shared/api/queries/recordingQueries';

type SortOption = 'name' | 'date' | 'primary';

export interface FmRecordingsGridProps {
  /** Recordings to display */
  recordings: ArtistRecording[];
  /** Whether to show edit controls (edit button, context menu, add button) */
  editable?: boolean;
  /** Callback when edit is requested */
  onEdit?: (recording: ArtistRecording) => void;
  /** Callback when delete is requested */
  onDelete?: (recording: ArtistRecording) => void;
  /** Callback when refetch is requested */
  onRefetch?: (recording: ArtistRecording) => void;
  /** Callback when set as primary is requested */
  onSetPrimary?: (recording: ArtistRecording) => void;
  /** Callback when add recording is requested */
  onAdd?: () => void;
  /** Whether the grid is loading */
  isLoading?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Hide the header with sorting controls */
  hideHeader?: boolean;
  /** Grid columns (default responsive) */
  columns?: 2 | 3 | 4;
  /** Title for the section (when wrapped in card) */
  title?: string;
  /** Subtitle/description for the section (when wrapped in card) */
  subtitle?: string;
  /** Wrap in form card styling with border */
  withCardWrapper?: boolean;
}

/**
 * FmRecordingsGrid
 *
 * Reusable grid component for displaying artist recordings.
 * Supports both view mode (ArtistDetails) and edit mode (ArtistManagement).
 *
 * Features:
 * - Grid display with cover art, platform icons, and recording info
 * - Sortable by featured, name, or date
 * - Context menu with edit, refetch, delete, and set primary options
 * - Click tracking via FmRecordingLink
 * - Primary recording badge
 */
export function FmRecordingsGrid({
  recordings,
  editable = false,
  onEdit,
  onDelete,
  onRefetch,
  onSetPrimary,
  onAdd,
  isLoading: _isLoading = false,
  className,
  hideHeader = false,
  columns,
  title,
  subtitle,
  withCardWrapper = false,
}: FmRecordingsGridProps) {
  const { t } = useTranslation('common');
  const [sortBy, setSortBy] = useState<SortOption>('primary');
  const isMobile = useIsMobile();

  const sortedRecordings = useMemo(() => {
    if (!recordings || recordings.length === 0) return [];

    return [...recordings].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case 'primary':
        default:
          // Primary first, then by name
          if (a.is_primary_dj_set && !b.is_primary_dj_set) return -1;
          if (!a.is_primary_dj_set && b.is_primary_dj_set) return 1;
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [recordings, sortBy]);

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'soundcloud':
        return <SiSoundcloud className='h-4 w-4 text-[#d48968]' />;
      case 'spotify':
        return <SiSpotify className='h-4 w-4 text-[#5aad7a]' />;
      case 'youtube':
        return <SiYoutube className='h-4 w-4 text-[#FF0000]' />;
      default:
        return <Disc3 className='h-4 w-4 text-fm-gold' />;
    }
  };

  const getContextMenuActions = (
    recording: ArtistRecording
  ): ContextMenuAction<ArtistRecording>[] => {
    if (!editable) return [];

    const actions: ContextMenuAction<ArtistRecording>[] = [];

    if (onEdit) {
      actions.push({
        label: t('buttons.edit'),
        icon: <Pencil className='h-4 w-4' />,
        onClick: onEdit,
      });
    }

    if (onRefetch) {
      actions.push({
        label: t('labels.refetchDetails'),
        icon: <RefreshCw className='h-4 w-4' />,
        onClick: onRefetch,
      });
    }

    if (onSetPrimary && !recording.is_primary_dj_set) {
      actions.push({
        label: t('labels.setAsFeatured'),
        icon: <Star className='h-4 w-4' />,
        onClick: onSetPrimary,
        separator: true,
      });
    }

    if (onDelete) {
      actions.push({
        label: t('buttons.delete'),
        icon: <Trash2 className='h-4 w-4' />,
        onClick: onDelete,
        variant: 'destructive',
      });
    }

    return actions;
  };

  const gridColsClass = columns
    ? {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
      }[columns]
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  if (!recordings || (recordings.length === 0 && !editable)) {
    return null;
  }

  const renderRecordingCard = (recording: ArtistRecording) => {
    const cardContent = (
      <div
        className={cn(
          'group relative flex flex-col p-3 rounded-none border bg-black/40 backdrop-blur-sm transition-all duration-300 w-full max-w-[180px]',
          'hover:bg-white/10 hover:border-fm-gold/50',
          recording.is_primary_dj_set
            ? 'border-fm-gold/40 ring-1 ring-fm-gold/20'
            : 'border-white/20'
        )}
      >
        {/* Featured badge */}
        {recording.is_primary_dj_set && (
          <div className='absolute -top-2 -right-2 bg-fm-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-sm z-20'>
            {t('labels.featured').toUpperCase()}
          </div>
        )}

        {/* Cover art or placeholder */}
        <div className='w-full aspect-square mb-2 rounded-sm overflow-hidden bg-white/5 border border-white/10'>
          {recording.cover_art ? (
            <img
              src={recording.cover_art}
              alt={recording.name}
              className='w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              {getPlatformIcon(recording.platform)}
            </div>
          )}
        </div>

        {/* Recording info */}
        <div className='flex-1 min-w-0'>
          <h3 className='font-canela text-sm text-white truncate group-hover:text-fm-gold transition-colors'>
            {recording.name}
          </h3>
          <div className='flex items-center gap-2 mt-1 flex-wrap'>
            {getPlatformIcon(recording.platform)}
            <span className='text-xs text-white/50 capitalize'>
              {recording.platform}
            </span>
            <span className='text-white/30'>•</span>
            <span className='text-xs text-white/50'>
              {recording.is_primary_dj_set ? t('labels.djSet') : t('labels.track')}
            </span>
            {recording.duration && (
              <>
                <span className='text-white/30'>•</span>
                <span className='text-xs text-white/50'>{recording.duration}</span>
              </>
            )}
          </div>
        </div>

        {/* Edit button overlay (only in edit mode) */}
        {editable && onEdit && (
          <div className='absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200'>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(recording);
              }}
              className='p-1.5 bg-black/60 hover:bg-fm-gold text-white transition-colors'
            >
              <Pencil className='h-4 w-4' />
            </button>
          </div>
        )}
      </div>
    );

    // Wrap with context menu if editable
    if (editable) {
      return (
        <FmCommonContextMenu
          key={recording.id}
          actions={getContextMenuActions(recording)}
          data={recording}
        >
          <FmRecordingLink
            recordingId={recording.id}
            url={recording.url}
            className='flex justify-center'
          >
            {cardContent}
          </FmRecordingLink>
        </FmCommonContextMenu>
      );
    }

    // Just wrap with recording link for click tracking
    return (
      <FmRecordingLink
        key={recording.id}
        recordingId={recording.id}
        url={recording.url}
        className='flex justify-center'
      >
        {cardContent}
      </FmRecordingLink>
    );
  };

  // Mobile row layout renderer
  const renderRecordingRow = (recording: ArtistRecording) => {
    const rowContent = (
      <div
        className={cn(
          'group relative flex items-center gap-3 p-3 rounded-none border bg-black/40 backdrop-blur-sm transition-all duration-300 w-full',
          'hover:bg-white/10 hover:border-fm-gold/50',
          recording.is_primary_dj_set
            ? 'border-fm-gold/40 ring-1 ring-fm-gold/20'
            : 'border-white/20'
        )}
      >
        {/* Featured badge - absolutely positioned */}
        {recording.is_primary_dj_set && (
          <div className='absolute -top-2 -right-2 bg-fm-gold text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm z-20'>
            {t('labels.featured').toUpperCase()}
          </div>
        )}

        {/* Cover art thumbnail */}
        <div className='w-16 h-16 flex-shrink-0 rounded-sm overflow-hidden bg-white/5 border border-white/10'>
          {recording.cover_art ? (
            <img
              src={recording.cover_art}
              alt={recording.name}
              className='w-full h-full object-cover object-center'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              {getPlatformIcon(recording.platform)}
            </div>
          )}
        </div>

        {/* Recording info */}
        <div className='flex-1 min-w-0'>
          <h3 className='font-canela text-sm text-white group-hover:text-fm-gold transition-colors'>
            {recording.name}
          </h3>
          <div className='flex items-center gap-2 mt-1'>
            {getPlatformIcon(recording.platform)}
            <span className='text-xs text-white/50 capitalize'>
              {recording.platform}
            </span>
            <span className='text-white/30'>•</span>
            <span className='text-xs text-white/50'>
              {recording.is_primary_dj_set ? t('labels.djSet') : t('labels.track')}
            </span>
          </div>
        </div>

        {/* Edit button (only in edit mode) - smaller */}
        {editable && onEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(recording);
            }}
            className='p-1.5 bg-black/60 hover:bg-fm-gold text-white transition-colors flex-shrink-0'
          >
            <Pencil className='h-3.5 w-3.5' />
          </button>
        )}
      </div>
    );

    // Wrap with context menu if editable
    if (editable) {
      return (
        <FmCommonContextMenu
          key={recording.id}
          actions={getContextMenuActions(recording)}
          data={recording}
        >
          <FmRecordingLink
            recordingId={recording.id}
            url={recording.url}
            className='block w-full'
          >
            {rowContent}
          </FmRecordingLink>
        </FmCommonContextMenu>
      );
    }

    // Just wrap with recording link for click tracking
    return (
      <FmRecordingLink
        key={recording.id}
        recordingId={recording.id}
        url={recording.url}
        className='block w-full'
      >
        {rowContent}
      </FmRecordingLink>
    );
  };

  // Add Recording button for mobile row layout
  const renderAddRecordingRow = () => (
    <button
      onClick={onAdd}
      className='flex items-center gap-3 p-3 w-full border-2 border-dashed border-white/20 hover:border-fm-gold/50 bg-black/20 hover:bg-fm-gold/5 transition-all duration-200 group'
    >
      <div className='w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white/5 group-hover:bg-fm-gold/20 transition-colors'>
        <Plus className='h-6 w-6 text-muted-foreground group-hover:text-fm-gold' />
      </div>
      <span className='text-sm text-muted-foreground group-hover:text-fm-gold font-medium'>
        {t('labels.addRecording')}
      </span>
    </button>
  );

  // Main content renderer
  const renderContent = () => (
    <>
      {/* Header with sorting - hide on mobile */}
      {!hideHeader && !isMobile && (
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-canela flex items-center gap-2'>
            <Disc3 className='h-6 w-6 text-fm-gold' />
            {t('sections.recordings')}
          </h2>

          <div className='flex items-center gap-2'>
            <span className='text-xs text-white/50 mr-2'>
              {t('labels.sortBy')}:
            </span>
            <FmCommonButton
              variant={sortBy === 'primary' ? 'default' : 'secondary'}
              size='sm'
              onClick={() => setSortBy('primary')}
              className='h-7 text-xs gap-1'
              icon={Star}
            >
              {t('labels.featured')}
            </FmCommonButton>
            <FmCommonButton
              variant={sortBy === 'name' ? 'default' : 'secondary'}
              size='sm'
              onClick={() => setSortBy('name')}
              className='h-7 text-xs gap-1'
              icon={ArrowUpDown}
            >
              {t('labels.name')}
            </FmCommonButton>
            <FmCommonButton
              variant={sortBy === 'date' ? 'default' : 'secondary'}
              size='sm'
              onClick={() => setSortBy('date')}
              className='h-7 text-xs gap-1'
              icon={Clock}
            >
              {t('labels.recent')}
            </FmCommonButton>
          </div>
        </div>
      )}

      {/* Mobile: Row layout / Desktop: Grid layout */}
      {isMobile ? (
        <div className='flex flex-col gap-3'>
          {sortedRecordings.map(renderRecordingRow)}
          {editable && onAdd && renderAddRecordingRow()}
        </div>
      ) : (
        <div className={cn('grid gap-4 justify-items-center', gridColsClass)}>
          {sortedRecordings.map(renderRecordingCard)}

          {/* Add Recording Button (only in edit mode) */}
          {editable && onAdd && (
            <button
              onClick={onAdd}
              className='aspect-square border-2 border-dashed border-white/20 hover:border-fm-gold/50 bg-black/20 hover:bg-fm-gold/5 flex flex-col items-center justify-center gap-3 transition-all duration-200 group w-full max-w-[180px]'
            >
              <div className='p-3 rounded-full bg-white/5 group-hover:bg-fm-gold/20 transition-colors'>
                <Plus className='h-6 w-6 text-muted-foreground group-hover:text-fm-gold' />
              </div>
              <span className='text-sm text-muted-foreground group-hover:text-fm-gold font-medium'>
                {t('labels.addRecording')}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Empty state for editable mode */}
      {editable && recordings.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          <Music className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p className='text-sm'>{t('labels.noRecordingsYet')}</p>
          {onAdd && (
            <FmCommonButton
              variant='secondary'
              size='sm'
              onClick={onAdd}
              className='mt-4'
              icon={Plus}
            >
              {t('labels.addFirstRecording')}
            </FmCommonButton>
          )}
        </div>
      )}
    </>
  );

  // Wrap in card if requested
  if (withCardWrapper) {
    return (
      <FmCommonCard size='lg' hoverable={false} className={className}>
        {/* Card header using form section header styling */}
        {title && (
          <FmFormSectionHeader
            title={title}
            description={subtitle}
            icon={Disc3}
            showDivider={false}
            className='mb-6'
          />
        )}
        {renderContent()}
      </FmCommonCard>
    );
  }

  return (
    <div className={cn('mt-8', className)}>
      {renderContent()}
    </div>
  );
}
