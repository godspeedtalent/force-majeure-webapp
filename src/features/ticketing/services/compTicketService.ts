import { supabase } from '@/shared';
import { logger } from '@/shared';

export interface CompTicket {
  id: string;
  event_id: string;
  ticket_tier_id: string;
  recipient_email: string;
  recipient_user_id: string | null;
  issued_by_user_id: string;
  issued_at: string;
  status: 'pending' | 'claimed' | 'expired' | 'revoked';
  claim_token: string;
  claimed_at: string | null;
  claimed_by_user_id: string | null;
  ticket_id: string | null;
  order_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompTicketWithDetails extends CompTicket {
  event_title?: string;
  tier_name?: string;
  issued_by_name?: string;
  claimed_by_name?: string;
}

export interface IssueCompTicketParams {
  eventId: string;
  ticketTierId: string;
  recipientEmail: string;
  expiresAt?: string;
}

export interface ClaimCompTicketResult {
  success: boolean;
  orderId?: string;
  ticketId?: string;
  error?: string;
}

export const compTicketService = {
  /**
   * Get all comp tickets for an event
   */
  async getCompTicketsForEvent(eventId: string): Promise<CompTicketWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('comp_tickets')
        .select(`
          *,
          events!comp_tickets_event_id_fkey(title),
          ticket_tiers!comp_tickets_ticket_tier_id_fkey(name),
          issued_by:profiles!comp_tickets_issued_by_user_id_fkey(display_name, full_name),
          claimed_by:profiles!comp_tickets_claimed_by_user_id_fkey(display_name, full_name)
        `)
        .eq('event_id', eventId)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((ct: any) => ({
        ...ct,
        event_title: ct.events?.title,
        tier_name: ct.ticket_tiers?.name,
        issued_by_name: ct.issued_by?.display_name || ct.issued_by?.full_name,
        claimed_by_name: ct.claimed_by?.display_name || ct.claimed_by?.full_name,
      }));
    } catch (error) {
      logger.error('Failed to fetch comp tickets', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'compTicketService.getCompTicketsForEvent',
        event_id: eventId,
      });
      return [];
    }
  },

  /**
   * Get a comp ticket by claim token
   */
  async getCompTicketByToken(claimToken: string): Promise<{
    compTicket: CompTicketWithDetails | null;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_comp_ticket_by_token', {
        p_claim_token: claimToken,
      });

      if (error) throw error;

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { compTicket: null, error: 'Comp ticket not found' };
      }

      const ct = Array.isArray(data) ? data[0] : data;
      return {
        compTicket: {
          id: ct.id,
          event_id: ct.event_id,
          ticket_tier_id: ct.ticket_tier_id,
          recipient_email: ct.recipient_email,
          status: ct.status,
          expires_at: ct.expires_at,
          event_title: ct.event_title,
          tier_name: ct.tier_name,
        } as CompTicketWithDetails,
      };
    } catch (error) {
      logger.error('Failed to fetch comp ticket by token', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'compTicketService.getCompTicketByToken',
      });
      return { compTicket: null, error: 'Failed to fetch comp ticket' };
    }
  },

  /**
   * Issue a new comp ticket (admin only)
   * This creates the comp ticket record and sends an email invitation
   */
  async issueCompTicket(params: IssueCompTicketParams): Promise<{
    success: boolean;
    compTicket?: CompTicket;
    error?: string;
  }> {
    try {
      // Call edge function to issue comp ticket
      const { data, error } = await supabase.functions.invoke('issue-comp-ticket', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error || 'Failed to issue comp ticket' };
      }

      logger.info('Comp ticket issued', {
        event_id: params.eventId,
        recipient_email: params.recipientEmail,
        comp_ticket_id: data.compTicket?.id,
      });

      return { success: true, compTicket: data.compTicket };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to issue comp ticket', {
        error: message,
        source: 'compTicketService.issueCompTicket',
        params,
      });
      return { success: false, error: message };
    }
  },

  /**
   * Claim a comp ticket (converts it to an actual ticket)
   */
  async claimCompTicket(claimToken: string): Promise<ClaimCompTicketResult> {
    try {
      // Call edge function to claim comp ticket
      const { data, error } = await supabase.functions.invoke('claim-comp-ticket', {
        body: { claimToken },
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error || 'Failed to claim comp ticket' };
      }

      logger.info('Comp ticket claimed', {
        claim_token: claimToken,
        order_id: data.orderId,
        ticket_id: data.ticketId,
      });

      return {
        success: true,
        orderId: data.orderId,
        ticketId: data.ticketId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to claim comp ticket', {
        error: message,
        source: 'compTicketService.claimCompTicket',
      });
      return { success: false, error: message };
    }
  },

  /**
   * Revoke a comp ticket (admin only)
   */
  async revokeCompTicket(compTicketId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comp_tickets')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', compTicketId)
        .eq('status', 'pending'); // Can only revoke pending tickets

      if (error) throw error;

      logger.info('Comp ticket revoked', { comp_ticket_id: compTicketId });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to revoke comp ticket', {
        error: message,
        source: 'compTicketService.revokeCompTicket',
        comp_ticket_id: compTicketId,
      });
      return { success: false, error: message };
    }
  },
};
