import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  compTicketService,
  CompTicketWithDetails,
  IssueCompTicketParams,
} from '../services/compTicketService';
import { handleError } from '@/shared/services/errorHandler';

/**
 * Hook for managing comp tickets for an event (admin use)
 */
export function useCompTickets(eventId: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query: Get all comp tickets for an event
  const {
    data: compTickets = [],
    isLoading,
    error,
  } = useQuery<CompTicketWithDetails[]>({
    queryKey: ['comp-tickets', eventId],
    queryFn: () => compTicketService.getCompTicketsForEvent(eventId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Issue a new comp ticket
  const issueCompTicketMutation = useMutation({
    mutationFn: (params: Omit<IssueCompTicketParams, 'eventId'>) =>
      compTicketService.issueCompTicket({ ...params, eventId }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('compTickets.issued'));
        queryClient.invalidateQueries({ queryKey: ['comp-tickets', eventId] });
      } else {
        toast.error(result.error || t('compTickets.issueFailed'));
      }
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('compTickets.issueFailed'),
        context: 'useCompTickets.issueCompTicket',
      });
    },
  });

  // Mutation: Revoke a comp ticket
  const revokeCompTicketMutation = useMutation({
    mutationFn: (compTicketId: string) =>
      compTicketService.revokeCompTicket(compTicketId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('compTickets.revoked'));
        queryClient.invalidateQueries({ queryKey: ['comp-tickets', eventId] });
      } else {
        toast.error(result.error || t('compTickets.revokeFailed'));
      }
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('compTickets.revokeFailed'),
        context: 'useCompTickets.revokeCompTicket',
      });
    },
  });

  // Stats
  const pendingCount = compTickets.filter((ct) => ct.status === 'pending').length;
  const claimedCount = compTickets.filter((ct) => ct.status === 'claimed').length;
  const totalCount = compTickets.length;

  return {
    compTickets,
    isLoading,
    error,
    issueCompTicket: issueCompTicketMutation.mutate,
    isIssuing: issueCompTicketMutation.isPending,
    revokeCompTicket: revokeCompTicketMutation.mutate,
    isRevoking: revokeCompTicketMutation.isPending,
    pendingCount,
    claimedCount,
    totalCount,
  };
}

/**
 * Hook for claiming a comp ticket (user use)
 */
export function useClaimCompTicket() {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  // Query for comp ticket by token
  const useCompTicketByToken = (claimToken: string | undefined) =>
    useQuery({
      queryKey: ['comp-ticket', claimToken],
      queryFn: async () => {
        if (!claimToken) return null;
        const result = await compTicketService.getCompTicketByToken(claimToken);
        if (result.error) throw new Error(result.error);
        return result.compTicket;
      },
      enabled: !!claimToken,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

  // Mutation for claiming
  const claimMutation = useMutation({
    mutationFn: (claimToken: string) => compTicketService.claimCompTicket(claimToken),
    onSuccess: (result, claimToken) => {
      if (result.success) {
        toast.success(t('compTickets.claimed'));
        queryClient.invalidateQueries({ queryKey: ['comp-ticket', claimToken] });
        queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      } else {
        toast.error(result.error || t('compTickets.claimFailed'));
      }
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('compTickets.claimFailed'),
        context: 'useClaimCompTicket.claim',
      });
    },
  });

  return {
    useCompTicketByToken,
    claimCompTicket: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
}
