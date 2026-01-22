import { ReactNode, useCallback } from 'react';
import { supabase, logger } from '@/shared';
import { cn } from '@/shared';

interface FmRecordingLinkProps {
  /** The recording ID for tracking */
  recordingId: string;
  /** The external URL (Spotify, SoundCloud, etc.) */
  url: string;
  /** Link content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to open in new tab (default: true) */
  openInNewTab?: boolean;
}

/**
 * Centralized component for recording links that automatically tracks clicks.
 * Use this component whenever linking to external recording platforms to ensure
 * click tracking is captured without manual watcher attachment.
 *
 * @example
 * ```tsx
 * <FmRecordingLink recordingId={recording.id} url={recording.url}>
 *   <span>Listen Now</span>
 * </FmRecordingLink>
 * ```
 */
export function FmRecordingLink({
  recordingId,
  url,
  children,
  className,
  openInNewTab = true,
}: FmRecordingLinkProps) {
  const handleClick = useCallback(() => {
    // Fire-and-forget: don't await to avoid delaying navigation
    supabase
      .rpc('increment_recording_click', { recording_id: recordingId })
      .then(({ error }) => {
        if (error) {
          logger.warn('Failed to track recording click', {
            recordingId,
            error: error.message,
            source: 'FmRecordingLink',
          });
        }
      });
  }, [recordingId]);

  return (
    <a
      href={url}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={cn(className)}
    >
      {children}
    </a>
  );
}
