import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';

interface UseShareEventOptions {
  eventId: string;
  eventTitle: string;
}

export const useShareEvent = ({ eventId, eventTitle }: UseShareEventOptions) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mutation to increment share count
  const shareMutation = useMutation({
    mutationFn: async () => {
      // Increment share count in database
      const { data, error } = await supabase.rpc('increment_event_share_count' as any, {
        event_id: eventId,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate event queries to refetch with updated share count
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });

      logger.info('Event share tracked', {
        eventId,
        eventTitle,
      });
    },
    onError: (error) => {
      logger.error('Failed to track event share', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId,
      });
      // Don't show error toast - sharing still worked from user perspective
    },
  });

  const handleOpenShareModal = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const handleShare = useCallback(() => {
    // Track the share in the database
    shareMutation.mutate();
  }, [shareMutation]);

  // Legacy support for navigator.share API
  const handleNativeShare = useCallback(async () => {
    const shareData = {
      title: eventTitle,
      text: `Check out ${eventTitle}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // Track share after successful native share
        shareMutation.mutate();
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          logger.error('Native share failed', {
            error: error.message,
            eventId,
          });
        }
      }
    } else {
      // Fallback to modal if native share not supported
      handleOpenShareModal();
    }
  }, [eventTitle, eventId, shareMutation, handleOpenShareModal]);

  return {
    isShareModalOpen,
    handleOpenShareModal,
    handleCloseShareModal,
    handleShare,
    handleNativeShare,
    isSharing: shareMutation.isPending,
  };
};
