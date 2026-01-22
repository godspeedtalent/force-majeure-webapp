/**
 * Submit to Venue Button
 *
 * Button component for venue pages that allows artists to submit
 * their DJ sets for venue booking consideration.
 */

import { useState } from 'react';
import { Music } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SubmissionModal } from './SubmissionModal';

// ============================================================================
// Types
// ============================================================================

interface SubmitToVenueButtonProps {
  /**
   * Venue ID
   */
  venueId: string;

  /**
   * Venue name (for display in modal)
   */
  venueName: string;

  /**
   * Artist ID (current user's artist profile)
   */
  artistId: string;

  /**
   * Button variant
   */
  variant?: 'default' | 'secondary' | 'destructive' | 'destructive-outline' | 'gold' | 'success';

  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SubmitToVenueButton({
  venueId,
  venueName,
  artistId,
  variant = 'gold',
  size = 'default',
  className,
}: SubmitToVenueButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <FmCommonButton
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <Music className="h-4 w-4 mr-2" />
        Submit to Venue
      </FmCommonButton>

      <SubmissionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        artistId={artistId}
        context="venue"
        venueId={venueId}
        venueName={venueName}
      />
    </>
  );
}
