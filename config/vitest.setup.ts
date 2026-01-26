/**
 * Vitest Test Setup
 *
 * This file is loaded before all tests run.
 * Use it to mock globals and modules that don't work in jsdom.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock heic2any - it uses Web Workers which aren't available in jsdom
vi.mock('heic2any', () => ({
  default: vi.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/jpeg' })),
}));

// Mock Worker global if not defined
if (typeof Worker === 'undefined') {
  // @ts-expect-error - Mocking global Worker
  global.Worker = class Worker {
    constructor() {
      // no-op
    }
    postMessage() {
      // no-op
    }
    terminate() {
      // no-op
    }
    addEventListener() {
      // no-op
    }
    removeEventListener() {
      // no-op
    }
  };
}

// Mock ResizeObserver global if not defined
if (typeof ResizeObserver === 'undefined') {
  // @ts-expect-error - Mocking global ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {
      // no-op
    }
    unobserve() {
      // no-op
    }
    disconnect() {
      // no-op
    }
  };
}

// Mock scrollIntoView for jsdom (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// Mock Supabase client to prevent real database connections in tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));
