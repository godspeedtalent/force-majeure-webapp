/**
 * Shared test helper utilities for ticket flow testing
 */
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { TEST_PREFIXES } from './mockData';
/**
 * Wait for a condition to be true with timeout
 */
export const waitFor = async (condition, timeout = 5000, interval = 100) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const result = await Promise.resolve(condition());
        if (result) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};
/**
 * Simulate realistic user delay (thinking time)
 */
export const simulateDelay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
/**
 * Simulate random delay within a range
 */
export const simulateRandomDelay = (minMs, maxMs) => {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return simulateDelay(delay);
};
/**
 * Clean up all test data from the database
 */
export const cleanupTestData = async () => {
    try {
        // Clean up ticketing sessions
        await supabase
            .from('ticketing_sessions')
            .delete()
            .like('user_session_id', `${TEST_PREFIXES.SESSION}%`);
        // Clean up order items (must delete before orders due to FK)
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .like('id', `${TEST_PREFIXES.ORDER}%`);
        if (orders && orders.length > 0) {
            await supabase
                .from('order_items')
                .delete()
                .in('order_id', orders.map(o => o.id));
        }
        // Clean up orders
        await supabase
            .from('orders')
            .delete()
            .like('id', `${TEST_PREFIXES.ORDER}%`);
        // Clean up ticket tiers
        await supabase
            .from('ticket_tiers')
            .delete()
            .like('id', `${TEST_PREFIXES.TIER}%`);
        // Clean up events
        await supabase
            .from('events')
            .delete()
            .like('id', `${TEST_PREFIXES.EVENT}%`);
        logger.info('Test data cleanup completed');
    }
    catch (error) {
        logger.error('Failed to cleanup test data', { error });
        throw error;
    }
};
/**
 * Clean up test data for specific event
 */
export const cleanupEventTestData = async (eventId) => {
    try {
        // Clean up ticketing sessions
        await supabase
            .from('ticketing_sessions')
            .delete()
            .eq('event_id', eventId);
        // Clean up order items and orders
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('event_id', eventId);
        if (orders && orders.length > 0) {
            await supabase
                .from('order_items')
                .delete()
                .in('order_id', orders.map(o => o.id));
            await supabase
                .from('orders')
                .delete()
                .in('id', orders.map(o => o.id));
        }
        // Clean up ticket tiers
        await supabase
            .from('ticket_tiers')
            .delete()
            .eq('event_id', eventId);
        // Clean up event
        await supabase
            .from('events')
            .delete()
            .eq('id', eventId);
        logger.info('Event test data cleanup completed', { eventId });
    }
    catch (error) {
        logger.error('Failed to cleanup event test data', { error, eventId });
        throw error;
    }
};
/**
 * Get or create test venue
 */
export const getOrCreateTestVenue = async (testLogger) => {
    const log = testLogger || logger;
    const venueId = 'test-venue-default';
    // Check if test venue exists
    const { data: existing } = await supabase
        .from('venues')
        .select('id')
        .eq('id', venueId)
        .single();
    if (existing) {
        log.info('Using existing test venue', { venueId });
        return venueId;
    }
    // Create test venue
    const { error } = await supabase.from('venues').insert([{
            id: venueId,
            name: 'Test Venue',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip_code: '12345',
            capacity: 500,
        }]);
    if (error && error.code !== '23505') { // Ignore duplicate key error
        log.error('Failed to create test venue', { error });
        throw new Error(`Failed to create test venue: ${error.message}`);
    }
    log.info('Test venue created', { venueId });
    return venueId;
};
/**
 * Get or create test artist
 */
export const getOrCreateTestArtist = async (testLogger) => {
    const log = testLogger || logger;
    const artistId = 'test-artist-default';
    // Check if test artist exists
    const { data: existing } = await supabase
        .from('artists')
        .select('id')
        .eq('id', artistId)
        .single();
    if (existing) {
        log.info('Using existing test artist', { artistId });
        return artistId;
    }
    // Create test artist
    const { error } = await supabase.from('artists').insert([{
            id: artistId,
            name: 'Test Artist',
            bio: 'Test artist for automated testing',
            genre: 'Electronic',
        }]);
    if (error && error.code !== '23505') { // Ignore duplicate key error
        log.error('Failed to create test artist', { error });
        throw new Error(`Failed to create test artist: ${error.message}`);
    }
    log.info('Test artist created', { artistId });
    return artistId;
};
/**
 * Insert mock event into database
 * Ensures required venue and artist exist first
 */
export const insertMockEvent = async (event, testLogger) => {
    const log = testLogger || logger;
    try {
        // Ensure test venue and artist exist
        await getOrCreateTestVenue(testLogger);
        await getOrCreateTestArtist(testLogger);
        const { error } = await supabase.from('events').insert([event]).select();
        if (error) {
            log.error('Failed to insert mock event', {
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                event,
            });
            throw new Error(`Failed to insert mock event: ${error.message}\nDetails: ${error.details}\nHint: ${error.hint}`);
        }
        log.info('Mock event inserted successfully', { eventId: event.id });
    }
    catch (err) {
        const error = err;
        log.error('Exception inserting mock event', {
            message: error.message,
            stack: error.stack,
            event,
        });
        throw err;
    }
};
/**
 * Insert mock ticket tiers into database
 */
export const insertMockTicketTiers = async (tiers) => {
    const { error } = await supabase.from('ticket_tiers').insert(tiers);
    if (error) {
        logger.error('Failed to insert mock ticket tiers', { error, tiers });
        throw new Error(`Failed to insert mock ticket tiers: ${error.message}`);
    }
};
/**
 * Insert mock ticketing session
 */
export const insertMockSession = async (session) => {
    try {
        const { error } = await supabase.from('ticketing_sessions').insert([session]).select();
        if (error) {
            logger.error('Failed to insert mock session', {
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                session,
            });
            throw new Error(`Failed to insert mock session: ${error.message}\nDetails: ${error.details}\nHint: ${error.hint}`);
        }
        logger.info('Mock session inserted successfully', { sessionId: session.user_session_id });
    }
    catch (err) {
        const error = err;
        logger.error('Exception inserting mock session', {
            message: error.message,
            stack: error.stack,
            session,
        });
        throw err;
    }
};
/**
 * Get session by user_session_id
 */
export const getSession = async (userSessionId) => {
    const { data, error } = await supabase
        .from('ticketing_sessions')
        .select('*')
        .eq('user_session_id', userSessionId)
        .single();
    if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get session', { error, userSessionId });
        throw new Error(`Failed to get session: ${error.message}`);
    }
    return data;
};
/**
 * Count sessions by status for an event
 */
export const countSessionsByStatus = async (eventId, status) => {
    const { count, error } = await supabase
        .from('ticketing_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', status);
    if (error) {
        logger.error('Failed to count sessions', { error, eventId, status });
        throw new Error(`Failed to count sessions: ${error.message}`);
    }
    return count ?? 0;
};
/**
 * Get ticket tier by ID
 */
export const getTicketTier = async (tierId) => {
    const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('id', tierId)
        .single();
    if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get ticket tier', { error, tierId });
        throw new Error(`Failed to get ticket tier: ${error.message}`);
    }
    return data;
};
/**
 * Get order by ID
 */
export const getOrder = async (orderId) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
    if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get order', { error, orderId });
        throw new Error(`Failed to get order: ${error.message}`);
    }
    return data;
};
/**
 * Update ticket tier inventory
 */
export const updateTicketInventory = async (tierId, availableInventory) => {
    const { error } = await supabase
        .from('ticket_tiers')
        .update({ available_inventory: availableInventory })
        .eq('id', tierId);
    if (error) {
        logger.error('Failed to update ticket inventory', { error, tierId, availableInventory });
        throw new Error(`Failed to update ticket inventory: ${error.message}`);
    }
};
/**
 * Generate unique test session ID
 */
export const generateTestSessionId = () => {
    return `${TEST_PREFIXES.SESSION}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
/**
 * Format currency for display in tests
 */
export const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
};
/**
 * Calculate total with fees
 */
export const calculateTotalWithFees = (subtotal, serviceFeePercent = 0.1, processingFeePercent = 0.029) => {
    const serviceFee = subtotal * serviceFeePercent;
    const processingFee = (subtotal + serviceFee) * processingFeePercent;
    return subtotal + serviceFee + processingFee;
};
