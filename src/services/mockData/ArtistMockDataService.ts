/**
 * ArtistMockDataService - Generate mock data for artist registration forms
 *
 * Supports three population modes:
 * - Manual: Returns empty defaults (user fills everything)
 * - Spotify: Pre-fills with Spotify artist data, generates rest
 * - SoundCloud: Pre-fills with SoundCloud artist data, generates rest
 */

import { MockDataFactory } from './MockDataFactory';
import type {
  ArtistRegistrationFormData,
  RegistrationTrack,
} from '@/pages/artists/types/registration';
import { DEFAULT_FORM_DATA } from '@/pages/artists/types/registration';
import type { Genre } from '@/features/artists/types';
import { supabase } from '@/shared';

// ========================================
// Types
// ========================================

export type PopulationMode = 'manual' | 'spotify' | 'soundcloud';

export interface ArtistMockDataConfig {
  /** Population mode */
  mode: PopulationMode;
  /** Pre-fill terms as agreed (for faster testing) */
  autoAgreeTerms?: boolean;
  /** Number of tracks to generate (default: 2) */
  trackCount?: number;
  /** Include DJ set in tracks (required for validation) */
  includeDJSet?: boolean;
}

// ========================================
// Sample Spotify Artists (real artist IDs for testing)
// ========================================

const SAMPLE_SPOTIFY_ARTISTS = [
  {
    id: '5he5w2lnU9x7JFhnwcekXX',
    name: 'Skrillex',
    spotifyUrl: 'https://open.spotify.com/artist/5he5w2lnU9x7JFhnwcekXX',
    // Using placeholder images since Spotify URLs change frequently
    imageUrl: 'https://placehold.co/300x300/1a1a1a/dfba7d?text=Skrillex',
    genres: ['dubstep', 'edm', 'electro house'],
  },
  {
    id: '1Cs0zKBU1kc0i8ypK3B9ai',
    name: 'David Guetta',
    spotifyUrl: 'https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai',
    imageUrl: 'https://placehold.co/300x300/1a1a1a/dfba7d?text=David+Guetta',
    genres: ['dance pop', 'edm', 'pop dance'],
  },
  {
    id: '60d24wfXkVzDSfLS6hyCjZ',
    name: 'Martin Garrix',
    spotifyUrl: 'https://open.spotify.com/artist/60d24wfXkVzDSfLS6hyCjZ',
    imageUrl: 'https://placehold.co/300x300/1a1a1a/dfba7d?text=Martin+Garrix',
    genres: ['big room', 'edm', 'progressive house'],
  },
  {
    id: '3q7HBObVc0L8jNeTe5Gofh',
    name: 'Fisher',
    spotifyUrl: 'https://open.spotify.com/artist/3q7HBObVc0L8jNeTe5Gofh',
    imageUrl: 'https://placehold.co/300x300/1a1a1a/dfba7d?text=Fisher',
    genres: ['tech house', 'house'],
  },
  {
    id: '738wLrAtLtCtFOLvQBXOXp',
    name: 'Disclosure',
    spotifyUrl: 'https://open.spotify.com/artist/738wLrAtLtCtFOLvQBXOXp',
    imageUrl: 'https://placehold.co/300x300/1a1a1a/dfba7d?text=Disclosure',
    genres: ['uk garage', 'deep house', 'house'],
  },
];

// ========================================
// Sample SoundCloud Artists
// ========================================

const SAMPLE_SOUNDCLOUD_ARTISTS = [
  {
    username: 'clozeone',
    name: 'CLOZE',
    soundcloudUrl: 'https://soundcloud.com/clozeone',
    genres: ['techno', 'dark techno'],
  },
  {
    username: 'raboraofficial',
    name: 'Rabora',
    soundcloudUrl: 'https://soundcloud.com/raboraofficial',
    genres: ['melodic techno', 'progressive house'],
  },
  {
    username: 'kettama',
    name: 'Kettama',
    soundcloudUrl: 'https://soundcloud.com/kettama',
    genres: ['house', 'tech house'],
  },
  {
    username: 'mali-music-official',
    name: 'Mali',
    soundcloudUrl: 'https://soundcloud.com/mali-music-official',
    genres: ['house', 'deep house'],
  },
  {
    username: 'partiboi69',
    name: 'Partiboi69',
    soundcloudUrl: 'https://soundcloud.com/partiboi69',
    genres: ['electro', 'ghetto house'],
  },
];

// ========================================
// Sample Tracks (for demo purposes)
// ========================================

const SAMPLE_SPOTIFY_TRACKS = [
  'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', // Rick Astley - Never Gonna Give You Up (for testing)
  'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights
  'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3', // Shape of You
];

const SAMPLE_SOUNDCLOUD_SETS = [
  'https://soundcloud.com/boaboraofficial/boiler-room-los-angeles-live-set',
  'https://soundcloud.com/cercle/worakls-live-at-chateau-de-chambord-in-france-for-cercle',
  'https://soundcloud.com/mixmag-1/premiere-fisher-losing-it',
];

// ========================================
// Supported Cities (must match BasicDetailsStep.tsx SUPPORTED_CITIES)
// ========================================

const SUPPORTED_CITY_NAMES = ['Austin', 'Houston', 'San Marcos'] as const;

// ========================================
// ArtistMockDataService Class
// ========================================

export class ArtistMockDataService {
  private config: Required<ArtistMockDataConfig>;
  private genreCache: Genre[] | null = null;
  private cityCache: { id: string; name: string }[] | null = null;

  constructor(config: ArtistMockDataConfig) {
    this.config = {
      mode: config.mode,
      autoAgreeTerms: config.autoAgreeTerms ?? true,
      trackCount: config.trackCount ?? 2,
      includeDJSet: config.includeDJSet ?? true,
    };
  }

  /**
   * Fetch genres from database (cached)
   */
  private async fetchGenres(): Promise<Genre[]> {
    if (this.genreCache) return this.genreCache;

    const { data, error } = await supabase
      .from('genres')
      .select('id, name, parent_id, created_at, updated_at')
      .order('name');

    if (error) {
      console.error('Failed to fetch genres:', error);
      return [];
    }

    this.genreCache = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return this.genreCache;
  }

  /**
   * Fetch cities from database (cached)
   * Only fetches cities that are supported in the registration form
   */
  private async fetchCities(): Promise<{ id: string; name: string }[]> {
    if (this.cityCache) return this.cityCache;

    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .in('name', SUPPORTED_CITY_NAMES as unknown as string[])
      .order('name');

    if (error) {
      console.error('Failed to fetch cities:', error);
      return [];
    }

    this.cityCache = data || [];
    return this.cityCache;
  }

  /**
   * Get random genres from database
   */
  private async getRandomGenres(count: number = 3): Promise<Genre[]> {
    const genres = await this.fetchGenres();
    if (genres.length === 0) return [];
    return MockDataFactory.randomElements(genres, count);
  }

  /**
   * Get random city ID from database
   */
  private async getRandomCityId(): Promise<string | null> {
    const cities = await this.fetchCities();
    if (cities.length === 0) return null;
    return MockDataFactory.randomElement(cities).id;
  }

  /**
   * Generate mock tracks
   */
  private generateMockTracks(stageName: string): RegistrationTrack[] {
    const tracks: RegistrationTrack[] = [];
    const totalTracks = this.config.trackCount;

    // Always include at least one DJ set if required
    if (this.config.includeDJSet && totalTracks > 0) {
      const platform = this.config.mode === 'spotify' ? 'spotify' : 'soundcloud';
      tracks.push({
        id: MockDataFactory.generateId(),
        name: MockDataFactory.generateDJSetName(stageName),
        url: platform === 'spotify'
          ? MockDataFactory.randomElement(SAMPLE_SPOTIFY_TRACKS)
          : MockDataFactory.randomElement(SAMPLE_SOUNDCLOUD_SETS),
        platform,
        recordingType: 'dj_set',
        // First DJ set is automatically the primary one
        isPrimaryDjSet: true,
      });
    }

    // Add remaining tracks
    for (let i = tracks.length; i < totalTracks; i++) {
      const platform = this.config.mode === 'spotify'
        ? 'spotify'
        : this.config.mode === 'soundcloud'
          ? 'soundcloud'
          : MockDataFactory.randomBoolean() ? 'spotify' : 'soundcloud';

      tracks.push({
        id: MockDataFactory.generateId(),
        name: MockDataFactory.generateTrackName(),
        url: platform === 'spotify'
          ? MockDataFactory.randomElement(SAMPLE_SPOTIFY_TRACKS)
          : MockDataFactory.randomElement(SAMPLE_SOUNDCLOUD_SETS),
        platform,
        recordingType: 'track',
      });
    }

    return tracks;
  }

  /**
   * Generate complete mock form data based on mode
   */
  async generateFormData(): Promise<ArtistRegistrationFormData> {
    switch (this.config.mode) {
      case 'manual':
        return this.generateManualModeData();
      case 'spotify':
        return this.generateSpotifyModeData();
      case 'soundcloud':
        return this.generateSoundCloudModeData();
      default:
        return DEFAULT_FORM_DATA;
    }
  }

  /**
   * Generate data for manual mode (minimal pre-fill)
   */
  private generateManualModeData(): ArtistRegistrationFormData {
    return {
      ...DEFAULT_FORM_DATA,
      // Only pre-fill terms if auto-agree is enabled
      agreeToTerms: this.config.autoAgreeTerms,
      followOnInstagram: this.config.autoAgreeTerms,
      notificationsOptIn: this.config.autoAgreeTerms,
    };
  }

  /**
   * Generate data for Spotify mode
   */
  private async generateSpotifyModeData(): Promise<ArtistRegistrationFormData> {
    const spotifyArtist = MockDataFactory.randomElement(SAMPLE_SPOTIFY_ARTISTS);
    const genres = await this.getRandomGenres(3);
    const cityId = await this.getRandomCityId();

    const stageName = spotifyArtist.name + '_demo_' + MockDataFactory.randomInt(100, 999);

    return {
      // Basic Details
      stageName,
      bio: MockDataFactory.generateArtistBio(stageName, spotifyArtist.genres),
      genres,
      cityId,

      // Social
      profileImageUrl: spotifyArtist.imageUrl || MockDataFactory.generateProfileImageUrl(),
      pressImage1Url: MockDataFactory.generatePressImageUrl(),
      pressImage2Url: MockDataFactory.generatePressImageUrl(),
      pressImage3Url: MockDataFactory.generatePressImageUrl(),
      instagramHandle: MockDataFactory.generateInstagramHandle(stageName),
      soundcloudUrl: '',
      spotifyUrl: spotifyArtist.spotifyUrl,
      tiktokHandle: MockDataFactory.generateTikTokHandle(stageName),

      // Platform IDs
      spotifyArtistId: spotifyArtist.id,
      soundcloudUsername: null,

      // Music
      tracks: this.generateMockTracks(stageName),

      // Performance History
      paidShowCountGroup: MockDataFactory.getRandomPaidShowCountGroup(),
      talentDifferentiator: MockDataFactory.generateTalentDifferentiator(),
      crowdSources: MockDataFactory.generateCrowdSources(),

      // Terms
      agreeToTerms: this.config.autoAgreeTerms,
      followOnInstagram: this.config.autoAgreeTerms,
      notificationsOptIn: this.config.autoAgreeTerms,

      // Validation
      stageNameError: null,
    };
  }

  /**
   * Generate data for SoundCloud mode
   */
  private async generateSoundCloudModeData(): Promise<ArtistRegistrationFormData> {
    const soundcloudArtist = MockDataFactory.randomElement(SAMPLE_SOUNDCLOUD_ARTISTS);
    const genres = await this.getRandomGenres(3);
    const cityId = await this.getRandomCityId();

    const stageName = soundcloudArtist.name + '_demo_' + MockDataFactory.randomInt(100, 999);

    return {
      // Basic Details
      stageName,
      bio: MockDataFactory.generateArtistBio(stageName, soundcloudArtist.genres),
      genres,
      cityId,

      // Social
      profileImageUrl: MockDataFactory.generateProfileImageUrl(),
      pressImage1Url: MockDataFactory.generatePressImageUrl(),
      pressImage2Url: MockDataFactory.generatePressImageUrl(),
      pressImage3Url: MockDataFactory.generatePressImageUrl(),
      instagramHandle: MockDataFactory.generateInstagramHandle(stageName),
      soundcloudUrl: soundcloudArtist.soundcloudUrl,
      spotifyUrl: '',
      tiktokHandle: MockDataFactory.generateTikTokHandle(stageName),

      // Platform IDs
      spotifyArtistId: null,
      soundcloudUsername: soundcloudArtist.username,

      // Music
      tracks: this.generateMockTracks(stageName),

      // Performance History
      paidShowCountGroup: MockDataFactory.getRandomPaidShowCountGroup(),
      talentDifferentiator: MockDataFactory.generateTalentDifferentiator(),
      crowdSources: MockDataFactory.generateCrowdSources(),

      // Terms
      agreeToTerms: this.config.autoAgreeTerms,
      followOnInstagram: this.config.autoAgreeTerms,
      notificationsOptIn: this.config.autoAgreeTerms,

      // Validation
      stageNameError: null,
    };
  }

  /**
   * Get a random Spotify artist for selection
   */
  static getRandomSpotifyArtist() {
    return MockDataFactory.randomElement(SAMPLE_SPOTIFY_ARTISTS);
  }

  /**
   * Get a random SoundCloud artist for selection
   */
  static getRandomSoundCloudArtist() {
    return MockDataFactory.randomElement(SAMPLE_SOUNDCLOUD_ARTISTS);
  }

  /**
   * Get all sample Spotify artists (for dropdown selection)
   */
  static getAllSpotifyArtists() {
    return SAMPLE_SPOTIFY_ARTISTS;
  }

  /**
   * Get all sample SoundCloud artists (for dropdown selection)
   */
  static getAllSoundCloudArtists() {
    return SAMPLE_SOUNDCLOUD_ARTISTS;
  }
}

export default ArtistMockDataService;
