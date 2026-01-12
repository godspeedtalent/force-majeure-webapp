/**
 * Hook for Mock Order Generation
 *
 * Provides state management and actions for the mock order generator UI.
 * Includes context-aware event detection for Event Management pages.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { mockOrderService } from '../MockOrderService';
import { handleError } from '@/shared/services/errorHandler';
import type {
  MockOrderConfig,
  MockOrderGenerationResult,
  TestEventSummary,
  TierSelection,
} from '../types';
import { DEFAULT_MOCK_ORDER_CONFIG } from '../types';

/**
 * Extract event ID from URL if on an event management page
 */
function extractEventIdFromUrl(pathname: string): string | null {
  // Match patterns like /events/:id/manage or /events/:id
  const eventManageMatch = pathname.match(/\/events\/([a-f0-9-]+)(?:\/manage)?/i);
  return eventManageMatch?.[1] || null;
}

export function useMockOrderGenerator() {
  const { t } = useTranslation('common');
  const location = useLocation();

  // State
  const [testEvents, setTestEvents] = useState<TestEventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<MockOrderConfig>>({
    ...DEFAULT_MOCK_ORDER_CONFIG,
    dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateRangeEnd: new Date().toISOString(),
  });
  const [tierSelections, setTierSelections] = useState<TierSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastResult, setLastResult] = useState<MockOrderGenerationResult | null>(null);
  const [autoLoadedEventId, setAutoLoadedEventId] = useState<string | null>(null);

  // Derived state
  const selectedEvent = useMemo(
    () => testEvents.find(e => e.id === selectedEventId),
    [testEvents, selectedEventId]
  );

  // Check if we're on an event management page
  const urlEventId = useMemo(
    () => extractEventIdFromUrl(location.pathname),
    [location.pathname]
  );

  // Load test events
  const loadTestEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const events = await mockOrderService.getTestEventsWithSummary();
      setTestEvents(events);
      return events;
    } catch (error) {
      handleError(error, {
        title: t('mockOrderGenerator.errors.loadEventsFailed'),
        context: 'useMockOrderGenerator.loadTestEvents',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load event from URL context (for Event Management page)
  const loadEventFromUrl = useCallback(async (eventId: string) => {
    try {
      const event = await mockOrderService.getEventForMockGenerator(eventId);
      if (event && event.status === 'test') {
        // Add to test events if not already there
        setTestEvents(prev => {
          const exists = prev.some(e => e.id === event.id);
          if (exists) return prev;
          return [...prev, event];
        });
        setSelectedEventId(event.id);
        setAutoLoadedEventId(event.id);
        return event;
      }
      return null;
    } catch (error) {
      // Silently fail - just don't auto-select
      return null;
    }
  }, []);

  // Initialize tier selections when event changes
  useEffect(() => {
    if (selectedEvent?.ticketTiers) {
      const selections: TierSelection[] = selectedEvent.ticketTiers.map(tier => ({
        tierId: tier.id,
        tierName: tier.name,
        minQuantity: 1,
        maxQuantity: 4,
        weight: 1,
      }));
      setTierSelections(selections);
    } else {
      setTierSelections([]);
    }
  }, [selectedEvent]);

  // Auto-load event from URL on mount
  useEffect(() => {
    const init = async () => {
      // First load all test events
      const events = await loadTestEvents();

      // Then check if we should auto-select from URL
      if (urlEventId) {
        const urlEvent = events.find(e => e.id === urlEventId);
        if (urlEvent) {
          setSelectedEventId(urlEventId);
          setAutoLoadedEventId(urlEventId);
        } else {
          // Event might not be in test status yet, try to load it anyway
          await loadEventFromUrl(urlEventId);
        }
      }
    };

    init();
  }, []); // Only run on mount

  // Generate mock orders
  const generateOrders = useCallback(async () => {
    if (!selectedEventId) {
      toast.error(t('mockOrderGenerator.errors.noEventSelected'));
      return;
    }

    if (tierSelections.length === 0) {
      toast.error(t('mockOrderGenerator.errors.noTiersSelected'));
      return;
    }

    const dateRangeStart = config.dateRangeStart ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateRangeEnd = config.dateRangeEnd || new Date().toISOString();

    const fullConfig: MockOrderConfig = {
      eventId: selectedEventId,
      totalOrders: config.totalOrders || 50,
      registeredUserRatio: config.registeredUserRatio ?? 30,
      tierSelections,
      includeTicketProtection: config.includeTicketProtection ?? true,
      ticketProtectionRatio: config.ticketProtectionRatio ?? 40,
      dateRangeStart,
      dateRangeEnd,
      statusDistribution: config.statusDistribution || {
        paid: 90,
        refunded: 5,
        cancelled: 5,
      },
    };

    setIsGenerating(true);
    try {
      const result = await mockOrderService.generateMockOrders(fullConfig);
      setLastResult(result);

      if (result.success) {
        toast.success(t('mockOrderGenerator.success', {
          orders: result.ordersCreated,
          tickets: result.ticketsCreated,
        }));
        // Refresh event list to update counts
        await loadTestEvents();
      } else {
        toast.error(t('mockOrderGenerator.errors.generationFailed', {
          errors: result.errors.length,
        }));
      }
    } catch (error) {
      handleError(error, {
        title: t('mockOrderGenerator.errors.generationFailed'),
        context: 'useMockOrderGenerator.generateOrders',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedEventId, tierSelections, config, t, loadTestEvents]);

  // Delete mock orders
  const deleteMockOrders = useCallback(async () => {
    if (!selectedEventId) return;

    setIsDeleting(true);
    try {
      const result = await mockOrderService.deleteMockOrdersByEvent(selectedEventId);

      if (result.success) {
        toast.success(t('mockOrderGenerator.deleteSuccess', {
          orders: result.deletedOrders,
          tickets: result.deletedTickets,
        }));
        setLastResult(null);
        await loadTestEvents();
      } else {
        toast.error(result.error || t('mockOrderGenerator.errors.deleteFailed'));
      }
    } catch (error) {
      handleError(error, {
        title: t('mockOrderGenerator.errors.deleteFailed'),
        context: 'useMockOrderGenerator.deleteMockOrders',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEventId, t, loadTestEvents]);

  // Update config
  const updateConfig = useCallback(<K extends keyof MockOrderConfig>(
    key: K,
    value: MockOrderConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update tier selection
  const updateTierSelection = useCallback((tierId: string, updates: Partial<TierSelection>) => {
    setTierSelections(prev => prev.map(tier =>
      tier.tierId === tierId ? { ...tier, ...updates } : tier
    ));
  }, []);

  // Toggle tier enabled
  const toggleTierEnabled = useCallback((tierId: string) => {
    setTierSelections(prev => {
      const existing = prev.find(t => t.tierId === tierId);
      if (existing) {
        // Remove from selections
        return prev.filter(t => t.tierId !== tierId);
      } else {
        // Add to selections
        const tier = selectedEvent?.ticketTiers.find(t => t.id === tierId);
        if (tier) {
          return [...prev, {
            tierId: tier.id,
            tierName: tier.name,
            minQuantity: 1,
            maxQuantity: 4,
            weight: 1,
          }];
        }
      }
      return prev;
    });
  }, [selectedEvent]);

  // Check if current event was auto-loaded from URL
  const isAutoLoaded = selectedEventId === autoLoadedEventId && autoLoadedEventId !== null;

  return {
    // State
    testEvents,
    selectedEventId,
    selectedEvent,
    config,
    tierSelections,
    isLoading,
    isGenerating,
    isDeleting,
    lastResult,
    isAutoLoaded,
    urlEventId,

    // Actions
    loadTestEvents,
    setSelectedEventId,
    generateOrders,
    deleteMockOrders,
    updateConfig,
    updateTierSelection,
    toggleTierEnabled,
  };
}
