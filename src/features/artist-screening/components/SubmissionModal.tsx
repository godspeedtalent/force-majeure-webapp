/**
 * Submission Modal
 *
 * Modal for artists to submit DJ sets for screening.
 * Used for venue bookings and general submissions.
 */

import { useState, useEffect } from 'react';
import {
  Music,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Label } from '@/components/common/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { handleError, supabase } from '@/shared';
import { toast } from 'sonner';
import { useCreateSubmission } from '../hooks';
import type { SubmissionContext } from '../types';

// ============================================================================
// Types
// ============================================================================

interface SubmissionModalProps {
  /**
   * Whether modal is open
   */
  open: boolean;

  /**
   * Callback when modal closes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Artist ID (required)
   */
  artistId: string;

  /**
   * Submission context
   */
  context: SubmissionContext;

  /**
   * Event ID (required if context='event')
   */
  eventId?: string;

  /**
   * Event title (for display)
   */
  eventTitle?: string;

  /**
   * Venue ID (required if context='venue')
   */
  venueId?: string;

  /**
   * Venue name (for display)
   */
  venueName?: string;
}

interface Recording {
  id: string;
  name: string;
  url: string;
  platform: 'spotify' | 'soundcloud' | 'youtube';
}

// ============================================================================
// Component
// ============================================================================

export function SubmissionModal({
  open,
  onOpenChange,
  artistId,
  context,
  eventId,
  eventTitle,
  venueId,
  venueName,
}: SubmissionModalProps) {
  // State
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>('');
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [hasGenreMismatch, setHasGenreMismatch] = useState(false);
  const [isCheckingGenres, setIsCheckingGenres] = useState(false);

  // Mutations
  const createSubmission = useCreateSubmission();

  // Fetch artist's DJ set recordings
  useEffect(() => {
    if (!open || !artistId) return;

    const fetchRecordings = async () => {
      setIsLoadingRecordings(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('artist_recordings')
          .select('id, name, url, platform')
          .eq('artist_id', artistId)
          .eq('recording_type', 'dj_set')
          .order('is_primary_dj_set', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        setRecordings(data || []);

        // Auto-select first recording
        if (data && data.length > 0) {
          setSelectedRecordingId(data[0].id);
        }
      } catch (error) {
        handleError(error, {
          title: 'Failed to load recordings',
          context: 'SubmissionModal.fetchRecordings',
        });
      } finally {
        setIsLoadingRecordings(false);
      }
    };

    fetchRecordings();
  }, [open, artistId]);

  // Check for genre mismatch (venue context only)
  useEffect(() => {
    if (
      !open ||
      context !== 'venue' ||
      !venueId ||
      !artistId
    ) {
      setHasGenreMismatch(false);
      return;
    }

    const checkGenreMismatch = async () => {
      setIsCheckingGenres(true);
      try {
        // Get venue's required genres
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: venueGenres, error: venueError } = await (supabase as any)
          .from('venue_required_genres')
          .select('genre_id')
          .eq('venue_id', venueId);

        if (venueError) throw venueError;

        // If no genre requirements, no mismatch
        if (!venueGenres || venueGenres.length === 0) {
          setHasGenreMismatch(false);
          return;
        }

        // Get artist's genres
        const { data: artistGenres, error: artistError } = await supabase
          .from('artist_genres')
          .select('genre_id')
          .eq('artist_id', artistId);

        if (artistError) throw artistError;

        // Check if any of artist's genres match venue's requirements
        const artistGenreIds = new Set(
          artistGenres?.map((ag: any) => ag.genre_id) || []
        );
        const hasMatch = venueGenres.some((vg: any) =>
          artistGenreIds.has(vg.genre_id)
        );

        setHasGenreMismatch(!hasMatch);
      } catch (error) {
        handleError(error, {
          title: 'Failed to check genre match',
          context: 'SubmissionModal.checkGenreMismatch',
        });
      } finally {
        setIsCheckingGenres(false);
      }
    };

    checkGenreMismatch();
  }, [open, context, venueId, artistId]);

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedRecordingId) {
      toast.error('Please select a recording');
      return;
    }

    try {
      await createSubmission.mutateAsync({
        artist_id: artistId,
        recording_id: selectedRecordingId,
        context_type: context,
        event_id: eventId,
        venue_id: venueId,
      });

      // Success - modal will close via onSuccess in mutation
      onOpenChange(false);
    } catch (error) {
      // Error handling done in mutation
    }
  };

  // Get context display text
  const getContextText = () => {
    if (context === 'event' && eventTitle) {
      return `for ${eventTitle}`;
    }
    if (context === 'venue' && venueName) {
      return `to ${venueName}`;
    }
    return 'for general review';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-black/90 backdrop-blur-lg border-2 border-white/20 rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-[10px] text-white font-canela">
            <Music className="h-6 w-6 text-fm-gold" />
            Submit for Screening
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Submit your DJ set {getContextText()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-[20px] py-[20px]">
          {/* Recording Selection */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-[10px] block">
              Select DJ Set Recording
            </Label>

            {isLoadingRecordings ? (
              <div className="flex items-center justify-center py-[40px]">
                <Loader2 className="h-6 w-6 animate-spin text-fm-gold" />
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-[40px]">
                <Music className="h-12 w-12 mx-auto text-fm-gold/40 mb-[15px]" />
                <p className="text-sm text-muted-foreground mb-[10px]">
                  No DJ sets found
                </p>
                <p className="text-xs text-white/40">
                  Please add a DJ set recording to your profile first.
                </p>
              </div>
            ) : (
              <Select
                value={selectedRecordingId}
                onValueChange={setSelectedRecordingId}
              >
                <SelectTrigger className="w-full bg-black/60 border-white/20 rounded-none">
                  <SelectValue placeholder="Select a recording" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-lg border-white/20 rounded-none">
                  {recordings.map(recording => (
                    <SelectItem
                      key={recording.id}
                      value={recording.id}
                      className="text-white hover:bg-white/10"
                    >
                      <div className="flex items-center gap-[10px]">
                        <span>{recording.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({recording.platform.toUpperCase()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Genre Mismatch Warning */}
          {isCheckingGenres && (
            <div className="flex items-center gap-[10px] text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking genre compatibility...
            </div>
          )}

          {hasGenreMismatch && !isCheckingGenres && (
            <div className="p-[15px] bg-fm-danger/10 border border-fm-danger/40 rounded-none">
              <div className="flex items-start gap-[10px]">
                <AlertTriangle className="h-5 w-5 text-fm-danger flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-fm-danger mb-[5px]">
                    Genre Mismatch Warning
                  </div>
                  <p className="text-xs text-white/80">
                    Your artist genres don't match this venue's requirements.
                    You can still submit, but approval may be less likely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-[15px] bg-fm-gold/10 border border-fm-gold/40 rounded-none">
            <div className="flex items-start gap-[10px]">
              <CheckCircle className="h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-fm-gold mb-[5px]">
                  What happens next?
                </div>
                <p className="text-xs text-white/80">
                  FM staff will review your submission within 7 days. You'll
                  receive a notification with their decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[10px] pt-[20px] border-t border-white/20">
          <FmCommonButton
            variant="default"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={createSubmission.isPending}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            variant="gold"
            onClick={handleSubmit}
            className="flex-1"
            disabled={
              !selectedRecordingId ||
              recordings.length === 0 ||
              createSubmission.isPending
            }
          >
            {createSubmission.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Music className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </FmCommonButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
