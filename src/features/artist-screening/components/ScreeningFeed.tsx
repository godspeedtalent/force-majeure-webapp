/**
 * Screening Feed
 *
 * Container component that renders a feed of ScreeningFeedCard components.
 * Twitter/Reddit-style vertical feed for desktop screening queue.
 */

import { useNavigate } from 'react-router-dom';
import { ScreeningFeedCard } from './ScreeningFeedCard';
import type { ScreeningSubmissionWithDetails } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ScreeningFeedProps {
  submissions: ScreeningSubmissionWithDetails[];
  onIgnore: (submission: ScreeningSubmissionWithDetails) => void;
  onDelete?: (submission: ScreeningSubmissionWithDetails) => void;
  showIgnored: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ScreeningFeed({
  submissions,
  onIgnore,
  onDelete,
  showIgnored,
}: ScreeningFeedProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-[10px]">
      {submissions.map(submission => (
        <ScreeningFeedCard
          key={submission.id}
          submission={submission}
          onReview={() => navigate(`/staff/screening/review/${submission.id}`)}
          onViewArtist={() => navigate(`/artists/${submission.artist_id}`)}
          onOpenRecording={() => {
            const url = submission.artist_recordings?.url;
            if (url) {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }}
          onIgnore={() => onIgnore(submission)}
          onDelete={onDelete ? () => onDelete(submission) : undefined}
          showIgnored={showIgnored}
        />
      ))}
    </div>
  );
}
