import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getArtistGenres,
  getArtistWithGenres,
  addGenreToArtist,
  removeGenreFromArtist,
  setPrimaryGenre,
  updateArtistGenres,
  getArtistsByGenre,
  searchArtists,
} from './artistService';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock apiLogger
vi.mock('@/shared/utils/apiLogger', () => ({
  logApiError: vi.fn(),
  logApi: vi.fn(),
}));

import { supabase } from '@force-majeure/shared/api/supabase/client';
import { logger } from '@force-majeure/shared/services/logger';

describe('artistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getArtistGenres', () => {
    it('should fetch artist genres via RPC', async () => {
      const mockRpcData = [
        {
          genre_id: 'genre-1',
          genre_name: 'House',
          is_primary: true,
          parent_genre_id: 'parent-1',
          parent_genre_name: 'Electronic',
        },
        {
          genre_id: 'genre-2',
          genre_name: 'Techno',
          is_primary: false,
          parent_genre_id: null,
          parent_genre_name: null,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockRpcData, error: null } as any);

      const result = await getArtistGenres('artist-1');

      expect(supabase.rpc).toHaveBeenCalledWith('get_artist_genres', {
        artist_id_param: 'artist-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].genreId).toBe('genre-1');
      expect(result[0].isPrimary).toBe(true);
      expect(result[0].genre.name).toBe('House');
      expect(result[0].genre.parent?.name).toBe('Electronic');
      expect(result[1].genre.parent).toBeNull();
    });

    it('should throw on RPC error', async () => {
      const mockError = { message: 'RPC failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError } as any);

      await expect(getArtistGenres('artist-1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getArtistWithGenres', () => {
    it('should fetch artist with genres', async () => {
      const mockArtist = {
        id: 'artist-1',
        name: 'Test Artist',
        bio: 'Test bio',
        image_url: 'http://example.com/image.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        genre: 'House',
        website: 'http://example.com',
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockArtist, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      // Mock the RPC call for genres
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            genre_id: 'genre-1',
            genre_name: 'House',
            is_primary: true,
            parent_genre_id: null,
            parent_genre_name: null,
          },
        ],
        error: null,
      } as any);

      const result = await getArtistWithGenres('artist-1');

      expect(supabase.from).toHaveBeenCalledWith('artists');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Artist');
      expect(result?.genres).toHaveLength(1);
      expect(result?.primaryGenre?.name).toBe('House');
    });

    it('should return null when artist not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await getArtistWithGenres('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      const mockError = { code: 'OTHER', message: 'Database error' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(getArtistWithGenres('artist-1')).rejects.toEqual(mockError);
    });
  });

  describe('addGenreToArtist', () => {
    it('should add a genre to an artist', async () => {
      const mockResult = {
        id: 'junction-1',
        artist_id: 'artist-1',
        genre_id: 'genre-1',
        is_primary: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResult, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await addGenreToArtist('artist-1', 'genre-1');

      expect(supabase.from).toHaveBeenCalledWith('artist_genres');
      expect(mockBuilder.insert).toHaveBeenCalledWith({
        artist_id: 'artist-1',
        genre_id: 'genre-1',
        is_primary: false,
      });
      expect(result.artistId).toBe('artist-1');
      expect(result.genreId).toBe('genre-1');
    });

    it('should unset existing primary before adding as primary', async () => {
      const mockResult = {
        id: 'junction-1',
        artist_id: 'artist-1',
        genre_id: 'genre-1',
        is_primary: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      const updateMockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          // Chain: update().eq('artist_id').eq('is_primary')
          if (field === 'is_primary') {
            return Promise.resolve({ error: null });
          }
          return updateMockBuilder;
        }),
      };

      const insertMockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResult, error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        // First call is for update (unset primary), subsequent is insert
        return callCount === 1 ? (updateMockBuilder as any) : (insertMockBuilder as any);
      });

      const result = await addGenreToArtist('artist-1', 'genre-1', true);

      expect(updateMockBuilder.update).toHaveBeenCalledWith({ is_primary: false });
      expect(result.isPrimary).toBe(true);
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Insert failed' };
      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(addGenreToArtist('artist-1', 'genre-1')).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('removeGenreFromArtist', () => {
    it('should remove a genre from an artist', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          // Return promise after second eq() call
          if (field === 'genre_id') {
            return Promise.resolve({ error: null });
          }
          return mockBuilder;
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await removeGenreFromArtist('artist-1', 'genre-1');

      expect(supabase.from).toHaveBeenCalledWith('artist_genres');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('artist_id', 'artist-1');
      expect(mockBuilder.eq).toHaveBeenCalledWith('genre_id', 'genre-1');
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Delete failed' };
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string) => {
          if (field === 'genre_id') {
            return Promise.resolve({ error: mockError });
          }
          return mockBuilder;
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(removeGenreFromArtist('artist-1', 'genre-1')).rejects.toEqual(mockError);
    });
  });

  describe('setPrimaryGenre', () => {
    it('should unset all and set new primary', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        const mockBuilder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((field: string) => {
            // First call: update().eq('artist_id').eq('is_primary') - unset all
            // Second call: update().eq('artist_id').eq('genre_id') - set new primary
            if (callCount === 1 && field === 'is_primary') {
              return Promise.resolve({ error: null });
            }
            if (callCount === 2 && field === 'genre_id') {
              return Promise.resolve({ error: null });
            }
            return mockBuilder;
          }),
        };
        return mockBuilder as any;
      });

      await setPrimaryGenre('artist-1', 'genre-1');

      // Should be called twice: once to unset all, once to set new primary
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Update failed' };

      // First call succeeds (unset all), second fails
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        const mockBuilder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((field: string) => {
            if (callCount === 1 && field === 'is_primary') {
              return Promise.resolve({ error: null });
            }
            if (callCount === 2 && field === 'genre_id') {
              return Promise.resolve({ error: mockError });
            }
            return mockBuilder;
          }),
        };
        return mockBuilder as any;
      });

      await expect(setPrimaryGenre('artist-1', 'genre-1')).rejects.toEqual(mockError);
    });
  });

  describe('updateArtistGenres', () => {
    it('should delete existing and insert new genres', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Delete call
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        // Insert call
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      });

      await updateArtistGenres('artist-1', [
        { genreId: 'genre-1', isPrimary: true },
        { genreId: 'genre-2', isPrimary: false },
      ]);

      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('should only delete when no genres provided', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await updateArtistGenres('artist-1', []);

      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(mockBuilder.delete).toHaveBeenCalled();
    });

    it('should throw on insert error', async () => {
      const mockError = { message: 'Insert failed' };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: mockError }),
        } as any;
      });

      await expect(
        updateArtistGenres('artist-1', [{ genreId: 'genre-1', isPrimary: true }])
      ).rejects.toEqual(mockError);
    });
  });

  describe('getArtistsByGenre', () => {
    it('should fetch artists by genre via RPC', async () => {
      const mockRpcData = [{ artist_id: 'artist-1' }, { artist_id: 'artist-2' }];

      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockRpcData, error: null } as any);

      // Mock getArtistWithGenres calls
      const mockArtist = {
        id: 'artist-1',
        name: 'Test Artist',
        bio: 'Test bio',
        image_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        genre: 'House',
        website: null,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockArtist, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      // Mock genre fetch
      vi.mocked(supabase.rpc).mockImplementation((functionName: string) => {
        if (functionName === 'get_artists_by_genre') {
          return Promise.resolve({ data: mockRpcData, error: null }) as any;
        }
        if (functionName === 'get_artist_genres') {
          return Promise.resolve({
            data: [
              {
                genre_id: 'genre-1',
                genre_name: 'House',
                is_primary: true,
                parent_genre_id: null,
                parent_genre_name: null,
              },
            ],
            error: null,
          }) as any;
        }
        return Promise.resolve({ data: [], error: null }) as any;
      });

      const result = await getArtistsByGenre('genre-1');

      expect(supabase.rpc).toHaveBeenCalledWith('get_artists_by_genre', {
        genre_id_param: 'genre-1',
        include_subgenres: true,
      });
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw on RPC error', async () => {
      const mockError = { message: 'RPC failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError } as any);

      await expect(getArtistsByGenre('genre-1')).rejects.toEqual(mockError);
    });
  });

  describe('searchArtists', () => {
    it('should search artists by name', async () => {
      const mockArtists = [
        {
          id: 'artist-1',
          name: 'Test Artist',
          bio: 'Test bio',
          image_url: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          genre: 'House',
          website: null,
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockArtists, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await searchArtists('Test');

      expect(supabase.from).toHaveBeenCalledWith('artists');
      expect(mockBuilder.ilike).toHaveBeenCalledWith('name', '%Test%');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Artist');
    });

    it('should apply genre filter', async () => {
      const mockArtists = [
        {
          id: 'artist-1',
          name: 'House Artist',
          bio: null,
          image_url: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          genre: 'House',
          website: null,
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockArtists, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      // Mock RPC for genre fetch
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            genre_id: 'genre-1',
            genre_name: 'House',
            is_primary: true,
            parent_genre_id: null,
            parent_genre_name: null,
          },
        ],
        error: null,
      } as any);

      const result = await searchArtists('Artist', 'House');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      const result = await searchArtists('Nonexistent');

      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      const mockError = { message: 'Search failed' };
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await expect(searchArtists('Test')).rejects.toEqual(mockError);
    });

    it('should respect limit parameter', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

      await searchArtists('Test', undefined, 10);

      expect(mockBuilder.limit).toHaveBeenCalledWith(10);
    });
  });
});
