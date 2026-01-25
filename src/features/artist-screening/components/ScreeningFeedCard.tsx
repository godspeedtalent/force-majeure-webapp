/**
 * Screening Feed Card
 *
 * Twitter/Reddit-style card for screening submissions.
 * Compact layout optimized for quick scanning and triage.
 */

import { User, Star, ExternalLink, Eye, EyeOff, Trash, MoreHorizontal, Play, AlertTriangle } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { Badge } from '@/components/common/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { cn, formatTimeDisplay } from '@/shared';
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
  onDelete?: () => void;
  showIgnored: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status badge color using design system colors
 */
function getStatusColor(status: SubmissionStatus | undefined): string {
  switch (status) {
    case 'approved':
      return 'bg-fm-success/20 text-fm-success border-fm-success/40';
    case 'rejected':
      return 'bg-fm-danger/20 text-fm-danger border-fm-danger/40';
    case 'pending':
    default:
      return 'bg-fm-gold/20 text-fm-gold border-fm-gold/40';
  }
}

/**
 * Get platform display info
 */
function getPlatformDisplay(platform: string | undefined): { icon: string; name: string } {
  switch (platform) {
    case 'spotify':
      return { icon: '🎵', name: 'Spotify' };
    case 'soundcloud':
      return { icon: '☁️', name: 'SoundCloud' };
    case 'youtube':
      return { icon: '▶️', name: 'YouTube' };
    default:
      return { icon: '🎧', name: 'Audio' };
  }
}

/**
 * Get relative time string (e.g., "2 days ago")
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
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
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
  onDelete,
  showIgnored,
}: ScreeningFeedCardProps) {
  const reviewCount = submission.submission_scores?.review_count ?? 0;
  const indexedScore = submission.submission_scores?.indexed_score ?? null;
  const platform = getPlatformDisplay(submission.artist_recordings?.platform);
  const duration = submission.artist_recordings?.duration_seconds;

  // Build genre badges
  const artistGenres = submission.artists?.artist_genres ?? [];
  const venueRequiredGenreIds =
    submission.venues?.venue_required_genres?.map(vrg => vrg.genre_id) ?? [];

  const genreBadges = artistGenres
    .filter(ag => ag.genre?.name)
    .slice(0, 3)
    .map(ag => ({
      id: ag.genre_id,
      label: ag.genre.name,
      variant: venueRequiredGenreIds.includes(ag.genre_id)
        ? ('primary' as const)
        : ('secondary' as const),
    }));

  return (
    <div className="bg-black/60 backdrop-blur-sm border border-white/10 p-[20px] hover:border-white/20 transition-colors">
      {/* Header Row: Image + Info + Status */}
      <div className="flex gap-[15px]">
        {/* Artist Image */}
        <div className="flex-shrink-0">
          {submission.artists?.image_url ? (
            <img
              src={submission.artists.image_url}
              alt={submission.artists?.name || 'Artist'}
              className="h-12 w-12 object-cover rounded-none"
            />
          ) : (
            <div className="h-12 w-12 bg-white/10 flex items-center justify-center rounded-none">
              <User className="h-6 w-6 text-white/40" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Line: Artist Name • Time | Status */}
          <div className="flex items-center justify-between gap-[10px] mb-[5px]">
            <div className="flex items-center gap-[10px] min-w-0">
              <span className="font-medium text-white truncate">
                {submission.artists?.name || 'Unknown Artist'}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                • {getRelativeTime(submission.created_at)}
              </span>
            </div>
            <Badge
              className={cn(
                'rounded-none text-xs font-medium border flex-shrink-0',
                getStatusColor(submission.status ?? 'pending')
              )}
            >
              {(submission.status ?? 'pending').toUpperCase()}
            </Badge>
          </div>

          {/* Track Title */}
          <div className="text-sm text-white/80 mb-[5px] truncate">
            {submission.artist_recordings?.name || 'Unknown Track'}
          </div>

          {/* Genre Tags */}
          {genreBadges.length > 0 && (
            <div className="mb-[10px]">
              <FmCommonBadgeGroup
                badges={genreBadges}
                maxDisplay={3}
                gap="sm"
                wrap={false}
              />
            </div>
          )}

          {/* Genre Mismatch Warning */}
          {submission.has_genre_mismatch && (
            <div className="flex items-center gap-[5px] text-xs text-fm-danger mb-[10px]">
              <AlertTriangle className="h-3 w-3" />
              Genre mismatch with venue requirements
            </div>
          )}
        </div>
      </div>

      {/* Audio Preview Bar */}
      <div className="mt-[15px] flex items-center gap-[10px]">
        <button
          onClick={onOpenRecording}
          className="flex-shrink-0 h-8 w-8 bg-fm-gold/20 hover:bg-fm-gold/40 flex items-center justify-center rounded-none transition-colors"
          title="Open recording"
        >
          <Play className="h-4 w-4 text-fm-gold" />
        </button>
        <div className="flex-1 h-1 bg-white/10 rounded-none relative">
          <div className="absolute inset-y-0 left-0 w-0 bg-fm-gold/60 rounded-none" />
        </div>
        {duration && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTimeDisplay(duration)}
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="mt-[15px] flex items-center gap-[15px] text-sm text-muted-foreground">
        {indexedScore !== null && (
          <div className="flex items-center gap-[5px]">
            <Star className="h-4 w-4 text-fm-gold" />
            <span className="font-bold text-fm-gold">{indexedScore}</span>
          </div>
        )}
        <div className="flex items-center gap-[5px]">
          <span className="text-xs">💬</span>
          <span>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
        </div>
        <div className="flex items-center gap-[5px]">
          <span>{platform.icon}</span>
          <span>{platform.name}</span>
        </div>
        {/* Context (venue/event) */}
        {submission.context_type === 'venue' && submission.venues && (
          <div className="text-xs">
            📍 {submission.venues.name}
          </div>
        )}
        {submission.context_type === 'event' && submission.events && (
          <div className="text-xs">
            🎪 {submission.events.title}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-[15px] flex items-center gap-[10px]">
        <FmCommonButton
          variant="gold"
          size="sm"
          onClick={onReview}
        >
          <Star className="h-4 w-4 mr-[5px]" />
          Review
        </FmCommonButton>
        <FmCommonButton
          variant="default"
          size="sm"
          onClick={onIgnore}
        >
          {showIgnored ? (
            <>
              <Eye className="h-4 w-4 mr-[5px]" />
              Restore
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-[5px]" />
              Skip
            </>
          )}
        </FmCommonButton>

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
          <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-md border-white/20">
            <DropdownMenuItem
              onClick={onViewArtist}
              className="cursor-pointer hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-[10px]" />
              View Artist Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenRecording}
              className="cursor-pointer hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-[10px]" />
              Open Recording
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="cursor-pointer text-fm-danger hover:bg-fm-danger/20"
                >
                  <Trash className="h-4 w-4 mr-[10px]" />
                  Delete Permanently
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
