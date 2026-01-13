import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Send, X, Check, Clock, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { FmUserSearchEmail } from '@/components/common/search/FmUserSearchEmail';
import { isValidEmail } from '@/components/common/forms/FmCommonEmailField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Label } from '@/components/common/shadcn/label';
import { Badge } from '@/components/common/shadcn/badge';
import { useCompTickets } from '@/features/ticketing/hooks/useCompTickets';
import { CompTicketWithDetails } from '@/features/ticketing/services/compTicketService';
import { supabase } from '@/shared';
import { cn } from '@/shared';

interface CompTicketManagerProps {
  eventId: string;
}

interface TicketTierOption {
  id: string;
  name: string;
  price_cents: number;
  available_inventory: number;
}

/**
 * CompTicketManager - Admin component for issuing and managing complimentary tickets
 *
 * Features:
 * - Issue new comp tickets to any email
 * - View issued comp tickets with status
 * - Revoke pending comp tickets
 */
export function CompTicketManager({ eventId }: CompTicketManagerProps) {
  const { t } = useTranslation('common');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');

  const {
    compTickets,
    isLoading,
    issueCompTicket,
    isIssuing,
    revokeCompTicket,
    isRevoking,
    pendingCount,
    claimedCount,
    totalCount,
  } = useCompTickets(eventId);

  // Fetch ticket tiers for this event
  const { data: ticketTiers = [] } = useQuery<TicketTierOption[]>({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, price_cents, available_inventory')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('tier_order');

      if (error) throw error;
      return data || [];
    },
  });

  const handleIssue = () => {
    if (!recipientEmail || !selectedTierId) return;

    issueCompTicket(
      { ticketTierId: selectedTierId, recipientEmail },
      {
        onSuccess: () => {
          setRecipientEmail('');
          setSelectedTierId('');
        },
      }
    );
  };

  const handleRevoke = (compTicketId: string) => {
    revokeCompTicket(compTicketId);
  };

  const getStatusBadge = (status: CompTicketWithDetails['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='outline' className='border-yellow-500/50 text-yellow-500'>
            <Clock className='h-3 w-3 mr-1' />
            {t('compTickets.statusPending')}
          </Badge>
        );
      case 'claimed':
        return (
          <Badge variant='outline' className='border-green-500/50 text-green-500'>
            <Check className='h-3 w-3 mr-1' />
            {t('compTickets.statusClaimed')}
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant='outline' className='border-muted-foreground/50 text-muted-foreground'>
            <Clock className='h-3 w-3 mr-1' />
            {t('compTickets.statusExpired')}
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant='outline' className='border-destructive/50 text-destructive'>
            <Ban className='h-3 w-3 mr-1' />
            {t('compTickets.statusRevoked')}
          </Badge>
        );
    }
  };

  const canIssue = isValidEmail(recipientEmail) && selectedTierId && !isIssuing;

  return (
    <div className='space-y-6'>
      {/* Header with stats */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Gift className='h-5 w-5 text-fm-gold' />
          <h3 className='font-canela text-lg'>{t('compTickets.title')}</h3>
        </div>
        <div className='flex items-center gap-3 text-sm text-muted-foreground'>
          <span>
            {t('compTickets.pendingCount', { count: pendingCount })}
          </span>
          <span>•</span>
          <span>
            {t('compTickets.claimedCount', { count: claimedCount })}
          </span>
        </div>
      </div>

      {/* Issue Form */}
      <div className='p-4 border border-white/10 bg-white/5 space-y-4'>
        <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
          {t('compTickets.issueNew')}
        </h4>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <FmUserSearchEmail
            value={recipientEmail}
            onChange={(email) => setRecipientEmail(email)}
            label={t('compTickets.recipientEmail')}
          />

          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>
              {t('compTickets.ticketTier')}
            </Label>
            <Select value={selectedTierId} onValueChange={setSelectedTierId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={t('compTickets.selectTier')} />
              </SelectTrigger>
              <SelectContent>
                {ticketTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    <span>{tier.name}</span>
                    <span className='ml-2 text-muted-foreground'>
                      (${(tier.price_cents / 100).toFixed(2)})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end'>
            <FmCommonButton
              onClick={handleIssue}
              disabled={!canIssue}
              loading={isIssuing}
              variant='gold'
              className='w-full'
            >
              <Send className='h-4 w-4 mr-2' />
              {t('compTickets.sendInvite')}
            </FmCommonButton>
          </div>
        </div>
      </div>

      {/* Issued Comp Tickets List */}
      <div className='space-y-3'>
        <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
          {t('compTickets.issuedTickets')} ({totalCount})
        </h4>

        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <FmCommonLoadingSpinner size='md' />
          </div>
        ) : compTickets.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <Gift className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p>{t('compTickets.noTicketsIssued')}</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {compTickets.map((ct) => (
              <div
                key={ct.id}
                className={cn(
                  'flex items-center justify-between p-3 border',
                  ct.status === 'pending'
                    ? 'border-yellow-500/20 bg-yellow-500/5'
                    : ct.status === 'claimed'
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-white/10 bg-white/5'
                )}
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium truncate'>{ct.recipient_email}</span>
                    {getStatusBadge(ct.status)}
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    <span>{ct.tier_name}</span>
                    <span className='mx-2'>•</span>
                    <span>
                      {t('compTickets.issuedBy', { name: ct.issued_by_name || 'Unknown' })}
                    </span>
                    <span className='mx-2'>•</span>
                    <span>
                      {new Date(ct.issued_at).toLocaleDateString()}
                    </span>
                  </div>
                  {ct.status === 'claimed' && ct.claimed_by_name && (
                    <div className='text-xs text-green-500 mt-1'>
                      {t('compTickets.claimedBy', { name: ct.claimed_by_name })}
                    </div>
                  )}
                </div>

                {ct.status === 'pending' && (
                  <FmCommonButton
                    variant='destructive-outline'
                    size='sm'
                    onClick={() => handleRevoke(ct.id)}
                    disabled={isRevoking}
                  >
                    <X className='h-4 w-4' />
                  </FmCommonButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
