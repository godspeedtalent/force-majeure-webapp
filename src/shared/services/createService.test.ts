import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createService, createFilteredQuery } from './createService';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { supabase } from '@/shared';
import { logger } from '@/shared';

// Test types
interface TestEntity {
  id: string;
  name: string;
  value: number;
}

interface CreateTestEntityData {
  name: string;
  value: number;
}

describe('createService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createService<TestEntity, CreateTestEntityData>({
    tableName: 'test_table' as any,
    serviceName: 'testService',
    defaultSelect: 'id, name, value',
    defaultOrder: { column: 'name', ascending: true },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all records with default ordering', async () => {
      const mockData = [
        { id: '1', name: 'Item A', value: 100 },
        { id: '2', name: 'Item B', value: 200 },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getAll();

      expect(supabase.from).toHaveBeenCalledWith('test_table');
      expect(mockBuilder.select).toHaveBeenCalledWith('id, name, value');
      expect(mockBuilder.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should return empty array when no data', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Database error' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getAll()).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error fetching test_table', {
        error: 'Database error',
        source: 'testService',
      });
    });
  });

  describe('getById', () => {
    it('should fetch a single record', async () => {
      const mockData = { id: '1', name: 'Test Item', value: 100 };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getById('1');

      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData);
    });

    it('should return null when record not found (PGRST116)', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw and log on other errors', async () => {
      const mockError = { code: 'OTHER', message: 'Database error' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getById('1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error fetching test_table by ID', {
        error: 'Database error',
        source: 'testService',
        id: '1',
      });
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const newData = { name: 'New Item', value: 300 };
      const mockResult = { id: '3', ...newData };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResult, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.create(newData);

      expect(mockBuilder.insert).toHaveBeenCalledWith([newData]);
      expect(result).toEqual(mockResult);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Insert failed' };
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.create({ name: 'Test', value: 1 })).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error creating test_table', {
        error: 'Insert failed',
        source: 'testService',
      });
    });
  });

  describe('update', () => {
    it('should update an existing record', async () => {
      const mockResult = { id: '1', name: 'Updated', value: 999 };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResult, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.update('1', { name: 'Updated' });

      expect(mockBuilder.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockResult);
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Update failed' };
      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.update('1', { name: 'Test' })).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error updating test_table', {
        error: 'Update failed',
        source: 'testService',
        id: '1',
      });
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await service.delete('1');

      expect(supabase.from).toHaveBeenCalledWith('test_table');
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw and log on error', async () => {
      const mockError = { message: 'Delete failed' };
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.delete('1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith('Error deleting test_table', {
        error: 'Delete failed',
        source: 'testService',
        id: '1',
      });
    });
  });

  describe('count', () => {
    it('should count all records', async () => {
      const mockBuilder = {
        select: vi.fn().mockResolvedValue({ count: 42, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.count();

      expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(42);
    });

    it('should count with filter', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.count('status', 'active');

      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toBe(10);
    });

    it('should return 0 on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.count();

      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return 0 when count is null', async () => {
      const mockBuilder = {
        select: vi.fn().mockResolvedValue({ count: null, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.exists('1');

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.exists('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.exists('1');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

describe('createService without defaultOrder', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createService<TestEntity, CreateTestEntityData>({
    tableName: 'test_table' as any,
    serviceName: 'testService',
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch without ordering when no default order specified', async () => {
    const mockData = [{ id: '1', name: 'Item', value: 100 }];

    const mockBuilder = {
      select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const result = await service.getAll();

    expect(mockBuilder.select).toHaveBeenCalledWith('*');
    expect(result).toEqual(mockData);
  });
});

describe('createFilteredQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create query with eq filter', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery(
      'test_table' as any,
      '*',
      { status: 'active' },
      { status: { column: 'status', operator: 'eq' } }
    );

    expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('should create query with gte filter', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery(
      'test_table' as any,
      '*',
      { minValue: 100 },
      { minValue: { column: 'value', operator: 'gte' } }
    );

    expect(mockBuilder.gte).toHaveBeenCalledWith('value', 100);
  });

  it('should create query with lte filter', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery(
      'test_table' as any,
      '*',
      { maxValue: 500 },
      { maxValue: { column: 'value', operator: 'lte' } }
    );

    expect(mockBuilder.lte).toHaveBeenCalledWith('value', 500);
  });

  it('should create query with ilike filter', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery(
      'test_table' as any,
      '*',
      { searchName: '%test%' },
      { searchName: { column: 'name', operator: 'ilike' } }
    );

    expect(mockBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
  });

  it('should skip undefined and null filter values', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery(
      'test_table' as any,
      '*',
      { status: 'active', category: undefined, type: null },
      {
        status: { column: 'status', operator: 'eq' },
        category: { column: 'category', operator: 'eq' },
        type: { column: 'type', operator: 'eq' },
      }
    );

    expect(mockBuilder.eq).toHaveBeenCalledTimes(1);
    expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('should skip filters without mappings', () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    createFilteredQuery('test_table' as any, '*', { unmapped: 'value' }, {});

    expect(mockBuilder.eq).not.toHaveBeenCalled();
  });
});
