/**
 * Screening Feed Card
 *
 * Compact social media feed-style card for DJ Set screening submissions.
 * Features square album art, frosted gold genre badges, and inline actions.
 * Responsive design with similar layout on mobile and desktop.
 */

import {
  User,
  Star,
  ExternalLink,
  Eye,
  EyeOff,
  Trash,
  MoreHorizontal,
  Play,
  AlertTriangle,
  Check,
  X,
  TrendingUp,
  Music,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { SiSpotify, SiSoundcloud, SiYoutube } from 'react-icons/si';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { Badge } from '@/components/common/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { cn } from '@/shared';
import type { ScreeningSubmissionWithDetails, SubmissionStatus } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ScreeningFeedCardProps {
  submission: ScreeningSubmissionWithDetails;
  onReview: () => void;
  onOpenRecording: () => void;
  onViewArtist: () => void;
  onIgnore: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  showIgnored: boolean;
  canApproveReject?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status badge styling
 */
function getStatusStyle(status: SubmissionStatus | undefined): string {
  switch (status) {
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/40';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'pending':
    default:
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  }
}

/**
 * Get relative time string (e.g., "2d")
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 30) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d`;
  } else if (diffHours > 0) {
    return `${diffHours}h`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m`;
  } else {
    return 'now';
  }
}

/**
 * Get context label
 */
function getContextLabel(submission: ScreeningSubmissionWithDetails): string | null {
  if (submission.context_type === 'venue' && submission.venues) {
    return submission.venues.name;
  }
  if (submission.context_type === 'event' && submission.events) {
    return submission.events.title;
  }
  return null;
}

// ============================================================================
// Component
// ============================================================================

export function ScreeningFeedCard({
  submission,
  onReview,
  onOpenRecording,
  onViewArtist,
  onIgnore,
  onApprove,
  onReject,
  onDelete,
  showIgnored,
  canApproveReject = false,
}: ScreeningFeedCardProps) {
  const reviewCount = submission.submission_scores?.review_count ?? 0;
  const indexedScore = submission.submission_scores?.indexed_score ?? null;
  const hotScore = submission.submission_scores?.hot_indexed_score ?? null;
  const platform = submission.artist_recordings?.platform;
  const rawCoverArt = submission.artist_recordings?.cover_art;
  // Validate cover art is a proper URL (not empty string or invalid)
  const coverArt = rawCoverArt && rawCoverArt.trim() !== '' && rawCoverArt.startsWith('http')
    ? rawCoverArt
    : null;
  const artistImage = submission.artists?.image_url;
  const contextLabel = getContextLabel(submission);

  // Determine highlights
  const isHighScore = indexedScore !== null && indexedScore >= 80;
  const hasGenreMismatch = submission.has_genre_mismatch;
  const isTrending =
    hotScore !== null && indexedScore !== null && hotScore > indexedScore;

  // Build genre list
  const artistGenres = submission.artists?.artist_genres ?? [];
  const genreNames = artistGenres
    .filter(ag => ag.genre?.name)
    .map(ag => ag.genre.name);

  // Left border accent for highlighting
  const leftBorderClass = hasGenreMismatch
    ? 'border-l-4 border-l-fm-danger'
    : isHighScore
      ? 'border-l-4 border-l-fm-gold'
      : '';

  // Platform gradient backgrounds for album art placeholder
  const getPlatformStyles = () => {
    switch (platform) {
      case 'spotify':
        return {
          gradient: 'bg-gradient-to-br from-green-600/30 via-green-900/60 to-black',
          icon: <SiSpotify className="h-10 w-10 md:h-12 md:w-12 text-green-400/60" />,
          accent: 'border-green-500/30',
        };
      case 'soundcloud':
        return {
          gradient: 'bg-gradient-to-br from-orange-600/30 via-orange-900/60 to-black',
          icon: <SiSoundcloud className="h-10 w-10 md:h-12 md:w-12 text-orange-400/60" />,
          accent: 'border-orange-500/30',
        };
      case 'youtube':
        return {
          gradient: 'bg-gradient-to-br from-red-600/30 via-red-900/60 to-black',
          icon: <SiYoutube className="h-10 w-10 md:h-12 md:w-12 text-red-400/60" />,
          accent: 'border-red-500/30',
        };
      default:
        return {
          gradient: 'bg-gradient-to-br from-fm-gold/20 via-black/80 to-black',
          icon: <Music className="h-10 w-10 md:h-12 md:w-12 text-fm-gold/40" />,
          accent: 'border-fm-gold/20',
        };
    }
  };

  const platformStyles = getPlatformStyles();

  // Get platform icon for stats row
  const getPlatformIcon = () => {
    switch (platform) {
      case 'spotify':
        return <SiSpotify className="h-3.5 w-3.5 text-green-400" />;
      case 'soundcloud':
        return <SiSoundcloud className="h-3.5 w-3.5 text-orange-400" />;
      case 'youtube':
        return <SiYoutube className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <Music className="h-3.5 w-3.5 text-white/40" />;
    }
  };

  // Get status icon for mobile
  const getStatusIcon = () => {
    switch (submission.status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div
      className={cn(
        'bg-black/70 backdrop-blur-md border border-white/10',
        'hover:border-white/20 transition-all duration-200',
        'max-w-2xl mx-auto',
        leftBorderClass
      )}
    >
      {/* Main Content Row: Large Album Art | Info */}
      <div className="flex gap-[15px] p-[15px]">
        {/* Large Album Art with Play Overlay */}
        <button
          onClick={onOpenRecording}
          className={cn(
            'relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 overflow-hidden group cursor-pointer',
            'border',
            !coverArt && platformStyles.gradient,
            !coverArt && platformStyles.accent,
            coverArt && 'border-white/20'
          )}
          title="Play DJ Set"
        >
          {/* Actual cover art or platform placeholder */}
          {coverArt ? (
            <img
              src={coverArt}
              alt={submission.artist_recordings?.name || 'DJ Set'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Platform icon as placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                {platformStyles.icon}
              </div>

              {/* Subtle waveform decoration */}
              <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center gap-[2px] px-[10px] opacity-30">
                {[3, 5, 8, 12, 10, 14, 8, 11, 6, 9, 4, 7, 10, 5, 8].map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-white/40 rounded-t-sm"
                    style={{ height: `${h * 2}px` }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-fm-gold flex items-center justify-center shadow-lg shadow-fm-gold/30">
              <Play className="h-6 w-6 md:h-7 md:w-7 text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
        </button>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Artist Row + Status Badge */}
          <div className="flex items-start justify-between gap-[10px] mb-[6px]">
            {/* Artist: Avatar + Name + Context */}
            <button
              onClick={onViewArtist}
              className="flex items-center gap-[8px] group/artist min-w-0"
            >
              {artistImage ? (
                <img
                  src={artistImage}
                  alt={submission.artists?.name}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover flex-shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                  <User className="h-3 w-3 text-white/40" />
                </div>
              )}
              <span className="text-xs md:text-sm text-muted-foreground group-hover/artist:text-fm-gold transition-colors truncate">
                {submission.artists?.name || 'Unknown Artist'}
                {contextLabel && (
                  <>
                    <span className="mx-[4px]">·</span>
                    <span className="text-white/40">{contextLabel}</span>
                  </>
                )}
              </span>
            </button>

            {/* Status + Mismatch Warning */}
            <div className="flex flex-col items-end gap-[4px] flex-shrink-0">
              {/* Status icon on mobile, text badge on desktop */}
              <div className="md:hidden">
                {getStatusIcon()}
              </div>
              <Badge
                className={cn(
                  'hidden md:flex rounded-none text-[10px] font-medium border uppercase',
                  getStatusStyle(submission.status ?? 'pending')
                )}
              >
                {submission.status ?? 'pending'}
              </Badge>
              {hasGenreMismatch && (
                <div className="flex items-center gap-[4px] text-[10px] text-fm-danger">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Mismatch</span>
                </div>
              )}
            </div>
          </div>

          {/* DJ Set Title (LOUD AND PROUD) */}
          <h3 className="text-lg md:text-xl text-white font-medium leading-tight mb-[8px] line-clamp-2">
            {submission.artist_recordings?.name || 'DJ Set'}
          </h3>

          {/* Stats Row: Score + Reviews + Timestamp */}
          <div className="flex items-center gap-[12px] mt-auto">
            {indexedScore !== null ? (
              <div className="flex items-center gap-[5px]">
                <span
                  className={cn(
                    'text-xl font-bold',
                    indexedScore >= 80
                      ? 'text-fm-gold'
                      : indexedScore >= 60
                        ? 'text-white'
                        : indexedScore >= 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                  )}
                >
                  {indexedScore}
                </span>
                {isTrending && (
                  <TrendingUp className="h-3 w-3 text-orange-400" />
                )}
              </div>
            ) : (
              <span className="text-xl text-muted-foreground">—</span>
            )}
            <div className="flex items-center gap-[4px] text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>{reviewCount}</span>
            </div>
            <div className="flex items-center gap-[6px] ml-auto">
              <span className="text-[10px] text-muted-foreground">
                {getRelativeTime(submission.created_at)}
              </span>
              {getPlatformIcon()}
            </div>
          </div>
        </div>
      </div>

      {/* Genre Footnotes Row */}
      {genreNames.length > 0 && (
        <div className="px-[15px] pb-[10px] flex flex-wrap items-center gap-[6px]">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Genres:</span>
          {genreNames.slice(0, 4).map((name, i) => (
            <span key={i} className="text-[10px] text-white/50">
              {name}{i < Math.min(genreNames.length, 4) - 1 && ' ·'}
            </span>
          ))}
          {genreNames.length > 4 && (
            <span className="text-[9px] text-white/30">+{genreNames.length - 4}</span>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-[15px] py-[10px] border-t border-white/10 flex items-center gap-[8px]">
        <FmCommonButton variant="gold" size="sm" onClick={onReview}>
          <Star className="h-3 w-3 mr-[4px]" />
          Review
        </FmCommonButton>

        {/* Approve/Reject (when eligible) */}
        {canApproveReject && onApprove && onReject && (
          <div className="hidden md:flex items-center gap-[8px]">
            <FmCommonIconButton
              variant="default"
              size="sm"
              onClick={onApprove}
              icon={Check}
              tooltip="Approve"
              className="border-green-500/40 text-green-400 hover:bg-green-500/20"
            />
            <FmCommonIconButton
              variant="default"
              size="sm"
              onClick={onReject}
              icon={X}
              tooltip="Reject"
              className="border-red-500/40 text-red-400 hover:bg-red-500/20"
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Ignore/Skip (floated right) */}
        <FmCommonIconButton
          variant="default"
          size="sm"
          onClick={onIgnore}
          icon={showIgnored ? Eye : EyeOff}
          tooltip={showIgnored ? 'Restore' : 'Skip'}
        />

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FmCommonIconButton
              variant="default"
              size="sm"
              icon={MoreHorizontal}
              tooltip="More actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-black/90 backdrop-blur-md border-white/20"
          >
            <DropdownMenuItem
              onClick={onViewArtist}
              className="cursor-pointer hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-[10px]" />
              View Artist
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenRecording}
              className="cursor-pointer hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-[10px]" />
              Open DJ Set
            </DropdownMenuItem>

            {/* Mobile approve/reject */}
            {canApproveReject && onApprove && onReject && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onApprove}
                  className="cursor-pointer text-green-400 hover:bg-green-500/20"
                >
                  <Check className="h-4 w-4 mr-[10px]" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onReject}
                  className="cursor-pointer text-red-400 hover:bg-red-500/20"
                >
                  <X className="h-4 w-4 mr-[10px]" />
                  Reject
                </DropdownMenuItem>
              </>
            )}

            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="cursor-pointer text-fm-danger hover:bg-fm-danger/20"
                >
                  <Trash className="h-4 w-4 mr-[10px]" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
