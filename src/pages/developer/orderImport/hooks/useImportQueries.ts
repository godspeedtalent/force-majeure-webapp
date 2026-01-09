/**
 * Import Queries Hook
 *
 * React Query hooks for fetching import-related data.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';

import type { ProcessRecord, ImportStep } from '../types';

interface UseImportQueriesOptions {
  selectedEventId: string;
  step: ImportStep;
}

export function useImportQueries({ selectedEventId, step }: UseImportQueriesOptions) {
  // Fetch import history
  const {
    data: importHistory,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['import-processes'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('processes')
        .select('*')
        .eq('process_type', 'order_import')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as ProcessRecord[];
    },
    enabled: step === 'home',
  });

  // Fetch event details
  const { data: eventDetails } = useQuery({
    queryKey: ['event-details-for-import', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_time')
        .eq('id', selectedEventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
  });

  // Fetch ticket tiers
  const { data: ticketTiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['ticket-tiers-for-import', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, price_cents')
        .eq('event_id', selectedEventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEventId,
  });

  // Tier options for select
  const tierOptions = useMemo(() => {
    if (!ticketTiers || ticketTiers.length === 0) return [];
    return ticketTiers.map(t => ({
      value: t.id,
      label: `${t.name} ($${(t.price_cents / 100).toFixed(2)})`,
    }));
  }, [ticketTiers]);

  return {
    importHistory,
    historyLoading,
    refetchHistory,
    eventDetails,
    ticketTiers,
    tiersLoading,
    tierOptions,
  };
}
