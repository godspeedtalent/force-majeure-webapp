/**
 * Ticket Service
 *
 * Centralized service for fetching ticket data for the wallet feature.
 * Follows the pattern established by orderService.ts.
 */

import { supabase, logger } from '@/shared';
import type { TicketWithDetails } from '../types';

/**
 * Base select query for tickets with all related data
 */
const TICKET_SELECT_QUERY = `
  *,
  ticket_tier:ticket_tiers!tickets_ticket_tier_id_fkey(
    id,
    name,
    description
  ),
  event:events!tickets_event_id_fkey(
    id,
    title,
    start_time,
    end_time,
    hero_image_url,
    venue:venues(
      id,
      name,
      address_line_1,
      city,
      state
    )
  ),
  order:orders!tickets_order_id_fkey(
    id,
    created_at,
    user_id
  )
`;

export const ticketService = {
  /**
   * Fetch all tickets for a user (via their orders)
   */
  async getTicketsByUserId(userId: string): Promise<TicketWithDetails[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_QUERY)
      .eq('order.user_id', userId)
      .in('status', ['valid', 'used'])
      .eq('test_data', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching tickets by user', {
        error: error.message,
        source: 'ticketService.getTicketsByUserId',
        userId,
      });
      throw error;
    }

    // Filter out tickets where the join didn't match (user_id filter on nested relation)
    const filteredData = (data || []).filter(
      ticket => ticket.order && ticket.order.user_id === userId
    );

    return filteredData as unknown as TicketWithDetails[];
  },

  /**
   * Fetch upcoming tickets for a user (events in the future)
   */
  async getUpcomingTickets(userId: string): Promise<TicketWithDetails[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_QUERY)
      .eq('status', 'valid')
      .eq('test_data', false)
      .gte('event.start_time', now)
      .order('event.start_time', { ascending: true });

    if (error) {
      logger.error('Error fetching upcoming tickets', {
        error: error.message,
        source: 'ticketService.getUpcomingTickets',
        userId,
      });
      throw error;
    }

    // Filter to only tickets belonging to this user
    const filteredData = (data || []).filter(
      ticket => ticket.order && ticket.order.user_id === userId
    );

    return filteredData as unknown as TicketWithDetails[];
  },

  /**
   * Fetch past tickets for a user (events in the past or used tickets)
   */
  async getPastTickets(userId: string): Promise<TicketWithDetails[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_QUERY)
      .eq('test_data', false)
      .or(`status.eq.used,event.start_time.lt.${now}`)
      .order('event.start_time', { ascending: false });

    if (error) {
      logger.error('Error fetching past tickets', {
        error: error.message,
        source: 'ticketService.getPastTickets',
        userId,
      });
      throw error;
    }

    // Filter to only tickets belonging to this user
    const filteredData = (data || []).filter(
      ticket => ticket.order && ticket.order.user_id === userId
    );

    return filteredData as unknown as TicketWithDetails[];
  },

  /**
   * Fetch tickets for a specific order
   */
  async getTicketsByOrderId(orderId: string): Promise<TicketWithDetails[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_QUERY)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching tickets by order', {
        error: error.message,
        source: 'ticketService.getTicketsByOrderId',
        orderId,
      });
      throw error;
    }

    return (data || []) as unknown as TicketWithDetails[];
  },

  /**
   * Fetch a single ticket by ID with full details
   */
  async getTicketById(ticketId: string): Promise<TicketWithDetails | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT_QUERY)
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching ticket by ID', {
        error: error.message,
        source: 'ticketService.getTicketById',
        ticketId,
      });
      throw error;
    }

    return data as unknown as TicketWithDetails;
  },

  /**
   * Get ticket count for a user
   */
  async getTicketCountByUserId(userId: string): Promise<{
    upcoming: number;
    past: number;
    total: number;
  }> {
    const now = new Date().toISOString();

    // Get all tickets for user
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        event:events!tickets_event_id_fkey(start_time),
        order:orders!tickets_order_id_fkey(user_id)
      `)
      .eq('test_data', false);

    if (error) {
      logger.error('Error counting tickets', {
        error: error.message,
        source: 'ticketService.getTicketCountByUserId',
        userId,
      });
      return { upcoming: 0, past: 0, total: 0 };
    }

    // Filter to user's tickets
    const userTickets = (data || []).filter(
      ticket => ticket.order && ticket.order.user_id === userId
    );

    const upcoming = userTickets.filter(
      ticket =>
        ticket.status === 'valid' &&
        ticket.event &&
        ticket.event.start_time &&
        new Date(ticket.event.start_time) > new Date(now)
    ).length;

    const past = userTickets.filter(
      ticket =>
        ticket.status === 'used' ||
        (ticket.event && ticket.event.start_time && new Date(ticket.event.start_time) <= new Date(now))
    ).length;

    return {
      upcoming,
      past,
      total: userTickets.length,
    };
  },
};
