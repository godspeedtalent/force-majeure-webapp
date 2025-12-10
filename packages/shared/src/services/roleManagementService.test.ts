import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleManagementService } from './roleManagementService';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    createNamespace: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock error handler
vi.mock('@/shared/services/errorHandler', () => ({
  handleError: vi.fn(),
}));

import { supabase } from '../api/supabase/client';
import { handleError } from '@/services/errorHandler';

describe('RoleManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addRole', () => {
    it('should add role to user', async () => {
      // First query: get role by name
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      // Second query: insert user_role
      const insertBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return insertBuilder as any;
      });

      await RoleManagementService.addRole('user-123', 'admin');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(roleQueryBuilder.eq).toHaveBeenCalledWith('name', 'admin');
      expect(supabase.from).toHaveBeenCalledWith('user_roles');
      expect(insertBuilder.insert).toHaveBeenCalledWith([
        { user_id: 'user-123', role_id: 'role-123' },
      ]);
    });

    it('should throw when role not found', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(roleQueryBuilder as any);

      await expect(
        RoleManagementService.addRole('user-123', 'nonexistent')
      ).rejects.toThrow('Role "nonexistent" not found');
    });

    it('should throw on database error when fetching role', async () => {
      const mockError = { message: 'Database error', code: 'PGRST500' };
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(roleQueryBuilder as any);

      await expect(
        RoleManagementService.addRole('user-123', 'admin')
      ).rejects.toEqual(mockError);
      expect(handleError).toHaveBeenCalled();
    });

    it('should throw on database error when inserting user_role', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      const mockInsertError = { message: 'Insert failed' };
      const insertBuilder = {
        insert: vi.fn().mockResolvedValue({ error: mockInsertError }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return insertBuilder as any;
      });

      await expect(
        RoleManagementService.addRole('user-123', 'admin')
      ).rejects.toEqual(mockInsertError);
    });
  });

  describe('removeRole', () => {
    it('should remove role from user', async () => {
      // First query: get role by name
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      // Second query: delete user_role
      const deleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'role_id') {
            return Promise.resolve({ error: null });
          }
          return deleteBuilder;
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return deleteBuilder as any;
      });

      await RoleManagementService.removeRole('user-123', 'admin');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(supabase.from).toHaveBeenCalledWith('user_roles');
      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(deleteBuilder.eq).toHaveBeenCalledWith('role_id', 'role-123');
    });

    it('should throw when role not found', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(roleQueryBuilder as any);

      await expect(
        RoleManagementService.removeRole('user-123', 'nonexistent')
      ).rejects.toThrow('Role "nonexistent" not found');
    });

    it('should throw on database error when deleting', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      const mockDeleteError = { message: 'Delete failed' };
      const deleteBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'role_id') {
            return Promise.resolve({ error: mockDeleteError });
          }
          return deleteBuilder;
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return deleteBuilder as any;
      });

      await expect(
        RoleManagementService.removeRole('user-123', 'admin')
      ).rejects.toEqual(mockDeleteError);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      // First query: get role by name
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      // Second query: check user_role exists
      const checkBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'role_id') {
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'user-role-1' },
                error: null,
              }),
            };
          }
          return checkBuilder;
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return checkBuilder as any;
      });

      const result = await RoleManagementService.hasRole('user-123', 'admin');

      expect(result).toBe(true);
    });

    it('should return false when user lacks role', async () => {
      // First query: get role by name
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      // Second query: check user_role exists (not found)
      const checkBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'role_id') {
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }
          return checkBuilder;
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return checkBuilder as any;
      });

      const result = await RoleManagementService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });

    it('should return false when role does not exist', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(roleQueryBuilder as any);

      const result = await RoleManagementService.hasRole('user-123', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      const roleQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'role-123' },
          error: null,
        }),
      };

      const checkBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'role_id') {
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            };
          }
          return checkBuilder;
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'roles') {
          return roleQueryBuilder as any;
        }
        return checkBuilder as any;
      });

      const result = await RoleManagementService.hasRole('user-123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('getUserRoles', () => {
    it('should return all roles for user', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { roles: { name: 'admin' } },
            { roles: { name: 'developer' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getUserRoles('user-123');

      expect(supabase.from).toHaveBeenCalledWith('user_roles');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(['admin', 'developer']);
    });

    it('should return empty array when no roles', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getUserRoles('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getUserRoles('user-123');

      expect(result).toEqual([]);
    });

    it('should filter out null role names', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { roles: { name: 'admin' } },
            { roles: { name: null } },
            { roles: null },
            { roles: { name: 'developer' } },
          ],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getUserRoles('user-123');

      expect(result).toEqual(['admin', 'developer']);
    });
  });

  describe('getAllRoles', () => {
    it('should return all available roles', async () => {
      const mockRoles = [
        { id: '1', name: 'admin' },
        { id: '2', name: 'developer' },
        { id: '3', name: 'user' },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockRoles,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getAllRoles();

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockBuilder.select).toHaveBeenCalledWith('id, name');
      expect(mockBuilder.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockRoles);
    });

    it('should return empty array on error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getAllRoles();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await RoleManagementService.getAllRoles();

      expect(result).toEqual([]);
    });
  });
});
