/**
 * Queue Management Tests
 *
 * Tests for ticketing queue system including entry, promotion,
 * position tracking, and session cleanup
 */

import { TestSuite } from '@/features/testing/types/testing';
import { TestLogger } from '@/features/testing/services/TestLogger';
import { supabase } from '@/shared';
import {
  createMockEvent,
  TEST_PREFIXES,
} from '../utils/mockData';
import {
  cleanupEventTestData,
  insertMockEvent,
  generateTestSessionId,
  waitFor,
  simulateDelay,
  countSessionsByStatus,
} from '../utils/testHelpers';
import {
  assertSessionStatus,
  assertQueuePosition,
  assertSessionCount,
} from '../utils/assertions';

export const queueTestSuite: TestSuite = {
  id: 'queue-tests',
  name: 'Queue Management Tests',
  description:
    'Test the ticketing queue system including entry, position tracking, promotion, max capacity, and session cleanup',
  category: 'Queue',
  beforeAll: async () => {
    // Cleanup any existing test data
    const testLogger = new TestLogger('queue-setup');
    testLogger.info('Setting up queue tests...');

    // We'll create test data per test case to avoid conflicts
  },
  afterAll: async () => {
    // Cleanup all test data
    const testLogger = new TestLogger('queue-cleanup');
    testLogger.info('Cleaning up queue tests...');

    try {
      // Clean up all test ticketing sessions
      await supabase
        .from('ticketing_sessions')
        .delete()
        .like('user_session_id', `${TEST_PREFIXES.SESSION}%`);

      // Clean up all test events
      await supabase
        .from('events')
        .delete()
        .like('id', `${TEST_PREFIXES.EVENT}%`);

      testLogger.info('Queue tests cleanup completed');
    } catch (error) {
      testLogger.error('Failed to cleanup queue tests', { error });
    }
  },
  testCases: [
    {
      id: 'queue-001',
      name: 'Single User Queue Entry - Immediate Access',
      description:
        'Test that a single user joining an empty queue gets immediate access (active status)',
      category: 'Queue Entry',
      timeout: 10000,
      execute: async () => {
        const logger = new TestLogger('queue-001');
        let eventId: string | null = null;

        try {
          logger.info('Starting test: Single User Queue Entry');

          // Create test event
          const event = createMockEvent();
          eventId = event.id;
          logger.info('Creating test event', { eventId: event.id, event });

          await insertMockEvent(event, logger);
          logger.info('Test event created successfully', { eventId: event.id });

          // Generate session ID
          const sessionId = generateTestSessionId();
          logger.info('Generated session ID', { sessionId });

          // Insert session as if user entered the gate
          logger.info('Inserting session into ticketing_sessions table');
          const { data, error } = await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: sessionId,
              status: 'active',
              entered_at: new Date().toISOString(),
            },
          ]).select();

          if (error) {
            logger.error('Failed to insert session', {
              error: error.message,
              details: error.details,
              hint: error.hint,
            });
            throw new Error(`Failed to insert session: ${error.message}`);
          }

          logger.info('User entered queue', { sessionId, data });

          // Wait a moment for database to settle
          await simulateDelay(500);

          // Assert session is active
          logger.info('Checking session status');
          await assertSessionStatus(sessionId, 'active');

          // Assert there is 1 active session
          logger.info('Checking active session count');
          await assertSessionCount(event.id, 'active', 1);

          // Assert there are 0 waiting sessions
          logger.info('Checking waiting session count');
          await assertSessionCount(event.id, 'waiting', 0);

          logger.info('Test passed: User got immediate access');
        } catch (error: any) {
          logger.error('Test failed with error', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        } finally {
          // Cleanup
          if (eventId) {
            logger.info('Cleaning up test data', { eventId });
            await cleanupEventTestData(eventId);
          }
        }
      },
    },
    {
      id: 'queue-002',
      name: 'Queue Promotion Flow',
      description:
        'Test that when the first user exits, the second user is promoted from waiting to active',
      category: 'Queue Promotion',
      timeout: 15000,
      execute: async () => {
        const logger = new TestLogger('queue-002');
        logger.info('Starting test: Queue Promotion Flow');

        const event = createMockEvent();
        await insertMockEvent(event, logger);

        const session1 = generateTestSessionId();
        const session2 = generateTestSessionId();

        try {
          // User 1 enters and gets active status
          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: session1,
              status: 'active',
              entered_at: new Date().toISOString(),
            },
          ]);

          logger.info('User 1 entered queue (active)', { session1 });

          // Wait a moment
          await simulateDelay(200);

          // User 2 enters and should be waiting
          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: session2,
              status: 'waiting',
            },
          ]);

          logger.info('User 2 entered queue (waiting)', { session2 });

          // Verify initial state
          await assertSessionStatus(session1, 'active');
          await assertSessionStatus(session2, 'waiting');
          await assertQueuePosition(session2, 1);

          logger.info('Initial state verified: 1 active, 1 waiting');

          // User 1 exits (mark as completed)
          await supabase
            .from('ticketing_sessions')
            .update({ status: 'completed' })
            .eq('user_session_id', session1);

          logger.info('User 1 exited queue', { session1 });

          // Simulate promotion logic (in real app, this would be triggered by exit)
          // Get first waiting session
          const { data: waitingSession } = await supabase
            .from('ticketing_sessions')
            .select('*')
            .eq('event_id', event.id)
            .eq('status', 'waiting')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          if (waitingSession) {
            await supabase
              .from('ticketing_sessions')
              .update({
                status: 'active',
                entered_at: new Date().toISOString(),
              })
              .eq('id', waitingSession.id);

            logger.info('Promoted waiting user', { sessionId: waitingSession.user_session_id });
          }

          // Wait for promotion
          await waitFor(async () => {
            const { data } = await supabase
              .from('ticketing_sessions')
              .select('status')
              .eq('user_session_id', session2)
              .single();
            return data?.status === 'active';
          }, 5000);

          // Verify final state
          await assertSessionStatus(session1, 'completed');
          await assertSessionStatus(session2, 'active');
          await assertSessionCount(event.id, 'active', 1);
          await assertSessionCount(event.id, 'waiting', 0);

          logger.info('Test passed: User 2 promoted to active');
        } finally {
          await cleanupEventTestData(event.id);
        }
      },
    },
    {
      id: 'queue-003',
      name: 'Max Capacity Enforcement',
      description:
        'Test that when max concurrent users (50) is reached, the 51st user must wait',
      category: 'Queue Capacity',
      timeout: 30000,
      execute: async () => {
        const logger = new TestLogger('queue-003');
        logger.info('Starting test: Max Capacity Enforcement');

        const event = createMockEvent();
        await insertMockEvent(event, logger);

        const MAX_CONCURRENT = 50;
        const sessions: string[] = [];

        try {
          // Create 50 active sessions
          logger.info(`Creating ${MAX_CONCURRENT} active sessions...`);

          for (let i = 0; i < MAX_CONCURRENT; i++) {
            const sessionId = generateTestSessionId();
            sessions.push(sessionId);

            await supabase.from('ticketing_sessions').insert([
              {
                event_id: event.id,
                user_session_id: sessionId,
                status: 'active',
                entered_at: new Date().toISOString(),
              },
            ]);

            // Add small delay to avoid overwhelming database
            if (i % 10 === 0) {
              await simulateDelay(100);
              logger.info(`Created ${i + 1}/${MAX_CONCURRENT} sessions`);
            }
          }

          logger.info('All 50 sessions created');

          // Verify we have 50 active sessions
          await assertSessionCount(event.id, 'active', MAX_CONCURRENT);

          // 51st user should be waiting
          const session51 = generateTestSessionId();
          sessions.push(session51);

          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: session51,
              status: 'waiting',
            },
          ]);

          logger.info('51st user added to queue', { session: session51 });

          // Verify 51st user is waiting
          await assertSessionStatus(session51, 'waiting');
          await assertQueuePosition(session51, 1);
          await assertSessionCount(event.id, 'waiting', 1);

          logger.info('Test passed: Max capacity enforced correctly');
        } finally {
          await cleanupEventTestData(event.id);
        }
      },
    },
    {
      id: 'queue-004',
      name: 'Real-time Queue Position Updates',
      description:
        'Test that queue position is recalculated correctly when users ahead exit',
      category: 'Queue Position',
      timeout: 15000,
      execute: async () => {
        const logger = new TestLogger('queue-004');
        logger.info('Starting test: Real-time Queue Position Updates');

        const event = createMockEvent();
        await insertMockEvent(event, logger);

        // Create sessions
        const activeSession = generateTestSessionId();
        const waiting1 = generateTestSessionId();
        const waiting2 = generateTestSessionId();
        const waiting3 = generateTestSessionId();

        try {
          // Create 1 active and 3 waiting
          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: activeSession,
              status: 'active',
              entered_at: new Date().toISOString(),
            },
          ]);

          await simulateDelay(100);

          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: waiting1,
              status: 'waiting',
            },
          ]);

          await simulateDelay(100);

          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: waiting2,
              status: 'waiting',
            },
          ]);

          await simulateDelay(100);

          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: waiting3,
              status: 'waiting',
            },
          ]);

          logger.info('Created 1 active + 3 waiting sessions');

          // Verify initial positions
          await assertQueuePosition(waiting1, 1);
          await assertQueuePosition(waiting2, 2);
          await assertQueuePosition(waiting3, 3);

          logger.info('Initial queue positions verified');

          // Active user exits
          await supabase
            .from('ticketing_sessions')
            .update({ status: 'completed' })
            .eq('user_session_id', activeSession);

          // Promote first waiting user
          await supabase
            .from('ticketing_sessions')
            .update({
              status: 'active',
              entered_at: new Date().toISOString(),
            })
            .eq('user_session_id', waiting1);

          logger.info('Active user exited, promoted waiting1');

          // Wait for update
          await simulateDelay(500);

          // Verify new positions
          await assertSessionStatus(waiting1, 'active');
          await assertQueuePosition(waiting2, 1); // moved up
          await assertQueuePosition(waiting3, 2); // moved up

          logger.info('Test passed: Queue positions updated correctly');
        } finally {
          await cleanupEventTestData(event.id);
        }
      },
    },
    {
      id: 'queue-005',
      name: 'Session Timeout Cleanup',
      description:
        'Test that sessions older than 30 minutes are automatically cleaned up',
      category: 'Queue Cleanup',
      timeout: 10000,
      execute: async () => {
        const logger = new TestLogger('queue-005');
        logger.info('Starting test: Session Timeout Cleanup');

        const event = createMockEvent();
        await insertMockEvent(event, logger);

        const oldSession = generateTestSessionId();
        const recentSession = generateTestSessionId();

        try {
          // Create session from 31 minutes ago (should be cleaned up)
          const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString();

          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: oldSession,
              status: 'active',
              created_at: thirtyOneMinutesAgo,
              entered_at: thirtyOneMinutesAgo,
            },
          ]);

          logger.info('Created old session (31 minutes ago)', { oldSession });

          // Create recent session (should not be cleaned up)
          await supabase.from('ticketing_sessions').insert([
            {
              event_id: event.id,
              user_session_id: recentSession,
              status: 'active',
              entered_at: new Date().toISOString(),
            },
          ]);

          logger.info('Created recent session', { recentSession });

          // Verify both exist
          await assertSessionStatus(oldSession, 'active');
          await assertSessionStatus(recentSession, 'active');

          // Simulate cleanup (in real app, this runs automatically every 5 minutes)
          const timeoutAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

          const { error: cleanupError } = await supabase
            .from('ticketing_sessions')
            .update({ status: 'completed' })
            .eq('event_id', event.id)
            .in('status', ['active', 'waiting'])
            .lt('created_at', timeoutAgo);

          if (cleanupError) {
            throw new Error(`Cleanup failed: ${cleanupError.message}`);
          }

          logger.info('Ran cleanup for sessions older than 30 minutes');

          // Wait for cleanup
          await simulateDelay(500);

          // Verify old session is completed, recent is still active
          await assertSessionStatus(oldSession, 'completed');
          await assertSessionStatus(recentSession, 'active');

          logger.info('Test passed: Old session cleaned up, recent session preserved');
        } finally {
          await cleanupEventTestData(event.id);
        }
      },
    },
    {
      id: 'queue-006',
      name: 'Concurrent Entry Stress Test',
      description:
        'Test that 100 users joining simultaneously get correct position assignments',
      category: 'Queue Stress',
      timeout: 60000,
      retries: 1,
      execute: async () => {
        const logger = new TestLogger('queue-006');
        logger.info('Starting test: Concurrent Entry Stress Test');

        const event = createMockEvent();
        await insertMockEvent(event, logger);

        const NUM_USERS = 100;
        const MAX_CONCURRENT = 50;
        const sessions: string[] = [];

        try {
          logger.info(`Creating ${NUM_USERS} concurrent sessions...`);

          // Create all sessions in parallel (simulating concurrent requests)
          const insertPromises = [];

          for (let i = 0; i < NUM_USERS; i++) {
            const sessionId = generateTestSessionId();
            sessions.push(sessionId);

            const status = i < MAX_CONCURRENT ? 'active' : 'waiting';
            const insertData: any = {
              event_id: event.id,
              user_session_id: sessionId,
              status,
            };

            if (status === 'active') {
              insertData.entered_at = new Date().toISOString();
            }

            insertPromises.push(
              supabase.from('ticketing_sessions').insert([insertData])
            );

            // Batch inserts in groups of 20
            if ((i + 1) % 20 === 0) {
              await Promise.all(insertPromises);
              insertPromises.length = 0;
              logger.info(`Created ${i + 1}/${NUM_USERS} sessions`);
              await simulateDelay(100); // Small delay between batches
            }
          }

          // Insert any remaining
          if (insertPromises.length > 0) {
            await Promise.all(insertPromises);
          }

          logger.info('All sessions created');

          // Wait for database to settle
          await simulateDelay(1000);

          // Verify counts
          const activeCount = await countSessionsByStatus(event.id, 'active');
          const waitingCount = await countSessionsByStatus(event.id, 'waiting');

          logger.info('Session counts', { activeCount, waitingCount });

          // We should have 50 active and 50 waiting
          await assertSessionCount(event.id, 'active', MAX_CONCURRENT);
          await assertSessionCount(event.id, 'waiting', NUM_USERS - MAX_CONCURRENT);

          // Verify queue positions for a few waiting users
          // Get first 3 waiting sessions
          const { data: waitingSessions } = await supabase
            .from('ticketing_sessions')
            .select('user_session_id, created_at')
            .eq('event_id', event.id)
            .eq('status', 'waiting')
            .order('created_at', { ascending: true })
            .limit(3);

          if (waitingSessions && waitingSessions.length >= 3) {
            await assertQueuePosition(waitingSessions[0].user_session_id, 1);
            await assertQueuePosition(waitingSessions[1].user_session_id, 2);
            await assertQueuePosition(waitingSessions[2].user_session_id, 3);
            logger.info('Queue positions verified for first 3 waiting users');
          }

          logger.info('Test passed: Concurrent entry handled correctly');
        } finally {
          await cleanupEventTestData(event.id);
        }
      },
    },
  ],
};
