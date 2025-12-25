import type { Genre } from '@/features/artists/types';

export type RecordingType = 'track' | 'dj_set';

export interface RegistrationTrack {
  id: string;
  name: string;
  url: string;
  coverArt?: string;
  platform: 'spotify' | 'soundcloud';
  recordingType: RecordingType;
  /** Whether this is the primary/featured DJ set for the artist */
  isPrimaryDjSet?: boolean;
}

export interface ArtistRegistrationFormData {
  // Basic Details
  stageName: string;
  bio: string;
  genres: Genre[];
  cityId: string | null;

  // Social
  profileImageUrl: string;
  pressImage1Url: string;
  pressImage2Url: string;
  pressImage3Url: string;
  instagramHandle: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  tiktokHandle: string;

  // Platform IDs (for duplicate detection)
  spotifyArtistId: string | null;
  soundcloudUsername: string | null;

  // Music
  tracks: RegistrationTrack[];

  // Performance History (internal FM staff fields)
  paidShowCountGroup: string;
  talentDifferentiator: string;
  crowdSources: string;

  // Terms
  agreeToTerms: boolean;
  followOnInstagram: boolean;
  notificationsOptIn: boolean;

  // Validation state (not persisted)
  stageNameError: string | null;
}

export const DEFAULT_FORM_DATA: ArtistRegistrationFormData = {
  // Basic Details
  stageName: '',
  bio: '',
  genres: [],
  cityId: null,

  // Social
  profileImageUrl: '',
  pressImage1Url: '',
  pressImage2Url: '',
  pressImage3Url: '',
  instagramHandle: '',
  soundcloudUrl: '',
  spotifyUrl: '',
  tiktokHandle: '',

  // Platform IDs
  spotifyArtistId: null,
  soundcloudUsername: null,

  // Music
  tracks: [],

  // Performance History
  paidShowCountGroup: '',
  talentDifferentiator: '',
  crowdSources: '',

  // Terms
  agreeToTerms: false,
  followOnInstagram: false,
  notificationsOptIn: false,

  // Validation state
  stageNameError: null,
};

export const STEP_TITLES = [
  'Basic Details',
  'Social & Images',
  'Music',
  'Your Performance History',
  'Terms & Conditions',
];

export const DEFAULT_BIO =
  'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.';
