import type { Genre } from '@/features/artists/types';

/**
 * Artist Form Types
 *
 * Consolidated type definitions for artist management form state.
 * Replaces 19 individual useState calls with grouped, structured state.
 */

// Recording types
export type RecordingType = 'track' | 'dj_set';

export interface ArtistTrack {
  id: string;
  name: string;
  url: string;
  coverArt?: string;
  platform: 'spotify' | 'soundcloud';
  recordingType: RecordingType;
  addedAt?: string;
  clickCount?: number;
}

export interface SocialLinks {
  instagram: string;
  twitter: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}

export interface ArtistBasicInfo {
  name: string;
  bio: string;
  website: string;
  imageUrl: string;
}

export interface ArtistMusicState {
  tracks: ArtistTrack[];
  isAddTrackModalOpen: boolean;
  editingTrack: ArtistTrack | null;
}

export interface ArtistFormState {
  basic: ArtistBasicInfo;
  social: SocialLinks;
  music: ArtistMusicState;
  genres: Genre[];
}

// Metadata structure stored in spotify_data JSON field
export interface ArtistMetadata {
  socialLinks?: Partial<SocialLinks>;
  tracks?: ArtistTrack[];
}

// Initial state factory
export const createInitialArtistFormState = (): ArtistFormState => ({
  basic: {
    name: '',
    bio: '',
    website: '',
    imageUrl: '',
  },
  social: {
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
  music: {
    tracks: [],
    isAddTrackModalOpen: false,
    editingTrack: null,
  },
  genres: [],
});

// Type for the save data structure
export interface ArtistSaveData {
  name: string;
  bio: string;
  website: string;
  image_url: string;
  spotify_data: ArtistMetadata;
}
