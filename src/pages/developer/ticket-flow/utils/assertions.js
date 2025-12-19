/**
 * Custom assertions for ticket flow testing
 */
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { getSession, getTicketTier, getOrder, countSessionsByStatus, } from './testHelpers';
/**
 * Assert that a ticketing session exists with expected status
 */
export const assertSessionStatus = async (userSessionId, expectedStatus) => {
    const session = await getSession(userSessionId);
    if (!session) {
        throw new Error(`Session not found: ${userSessionId}`);
    }
    if (session.status !== expectedStatus) {
        throw new Error(`Expected session status to be '${expectedStatus}' but got '${session.status}'`);
    }
    logger.info('Session status assertion passed', { userSessionId, expectedStatus });
};
/**
 * Assert that a session does not exist
 */
export const assertSessionNotExists = async (userSessionId) => {
    const session = await getSession(userSessionId);
    if (session) {
        throw new Error(`Expected session not to exist, but found session with status '${session.status}'`);
    }
    logger.info('Session not exists assertion passed', { userSessionId });
};
/**
 * Assert queue position for a session
 */
export const assertQueuePosition = async (userSessionId, expectedPosition) => {
    const session = await getSession(userSessionId);
    if (!session) {
        throw new Error(`Session not found: ${userSessionId}`);
    }
    if (session.status !== 'waiting') {
        throw new Error(`Cannot check queue position for session with status '${session.status}'. Must be 'waiting'.`);
    }
    // Get sessions created before this one
    const { count } = await supabase
        .from('ticketing_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', session.event_id)
        .eq('status', 'waiting')
        .lt('created_at', session.created_at);
    const actualPosition = (count ?? 0) + 1;
    if (actualPosition !== expectedPosition) {
        throw new Error(`Expected queue position ${expectedPosition} but got ${actualPosition}`);
    }
    logger.info('Queue position assertion passed', {
        userSessionId,
        expectedPosition,
    });
};
/**
 * Assert number of sessions with specific status for an event
 */
export const assertSessionCount = async (eventId, status, expectedCount) => {
    const actualCount = await countSessionsByStatus(eventId, status);
    if (actualCount !== expectedCount) {
        throw new Error(`Expected ${expectedCount} sessions with status '${status}' but got ${actualCount}`);
    }
    logger.info('Session count assertion passed', {
        eventId,
        status,
        expectedCount,
    });
};
/**
 * Assert that inventory was decremented
 */
export const assertInventoryDecremented = async (tierId, decrementAmount, originalInventory) => {
    const tier = await getTicketTier(tierId);
    if (!tier) {
        throw new Error(`Ticket tier not found: ${tierId}`);
    }
    if (originalInventory !== undefined) {
        const expectedInventory = originalInventory - decrementAmount;
        if (tier.available_inventory !== expectedInventory) {
            throw new Error(`Expected inventory to be ${expectedInventory} but got ${tier.available_inventory}`);
        }
    }
    logger.info('Inventory decrement assertion passed', {
        tierId,
        currentInventory: tier.available_inventory,
    });
};
/**
 * Assert that an order was created
 */
export const assertOrderCreated = async (orderId, expectedUserId, expectedEventId) => {
    const order = await getOrder(orderId);
    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }
    if (expectedUserId && order.user_id !== expectedUserId) {
        throw new Error(`Expected order user_id to be '${expectedUserId}' but got '${order.user_id}'`);
    }
    if (expectedEventId && order.event_id !== expectedEventId) {
        throw new Error(`Expected order event_id to be '${expectedEventId}' but got '${order.event_id}'`);
    }
    logger.info('Order creation assertion passed', { orderId });
};
/**
 * Assert that order items were created
 */
export const assertOrderItemsCreated = async (orderId, expectedItemCount) => {
    const order = await getOrder(orderId);
    if (!order) {
        throw new Error(`Order not found: ${orderId}`);
    }
    const actualItemCount = order.order_items?.length ?? 0;
    if (actualItemCount !== expectedItemCount) {
        throw new Error(`Expected ${expectedItemCount} order items but got ${actualItemCount}`);
    }
    logger.info('Order items assertion passed', { orderId, expectedItemCount });
};
/**
 * Assert cart contains specific items
 */
export const assertCartContains = (cart, expectedItemId, expectedQuantity) => {
    const item = cart.find(i => i.id === expectedItemId);
    if (!item) {
        throw new Error(`Cart does not contain item: ${expectedItemId}`);
    }
    if (expectedQuantity !== undefined && item.quantity !== expectedQuantity) {
        throw new Error(`Expected item quantity to be ${expectedQuantity} but got ${item.quantity}`);
    }
    logger.info('Cart contains assertion passed', { expectedItemId, expectedQuantity });
};
/**
 * Assert cart total
 */
export const assertCartTotal = (cart, expectedTotal, tolerance = 0.01) => {
    const actualTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(actualTotal - expectedTotal) > tolerance) {
        throw new Error(`Expected cart total to be ${expectedTotal} but got ${actualTotal}`);
    }
    logger.info('Cart total assertion passed', { expectedTotal, actualTotal });
};
/**
 * Assert localStorage contains key
 */
export const assertLocalStorageContains = (key) => {
    const value = localStorage.getItem(key);
    if (value === null) {
        throw new Error(`localStorage does not contain key: ${key}`);
    }
    logger.info('localStorage contains assertion passed', { key });
};
/**
 * Assert localStorage does not contain key
 */
export const assertLocalStorageNotContains = (key) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
        throw new Error(`localStorage should not contain key: ${key}`);
    }
    logger.info('localStorage not contains assertion passed', { key });
};
/**
 * Assert that a value is within a range
 */
export const assertInRange = (value, min, max, label = 'Value') => {
    if (value < min || value > max) {
        throw new Error(`${label} (${value}) is not within range [${min}, ${max}]`);
    }
    logger.info('Range assertion passed', { value, min, max, label });
};
/**
 * Assert two numbers are approximately equal
 */
export const assertApproximatelyEqual = (actual, expected, tolerance = 0.01, label = 'Value') => {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${label}: expected ${expected} but got ${actual} (tolerance: ${tolerance})`);
    }
    logger.info('Approximately equal assertion passed', { actual, expected, tolerance, label });
};
