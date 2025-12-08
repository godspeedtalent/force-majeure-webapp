import type { Genre } from '@/features/artists/types';

export type RecordingType = 'track' | 'dj_set';

export interface RegistrationTrack {
  id: string;
  name: string;
  url: string;
  coverArt?: string;
  platform: 'spotify' | 'soundcloud';
  recordingType: RecordingType;
}

export interface ArtistRegistrationFormData {
  // Basic Details
  stageName: string;
  bio: string;
  genres: Genre[];
  city: string;

  // Social
  profileImageUrl: string;
  pressImage1Url: string;
  pressImage2Url: string;
  pressImage3Url: string;
  instagramHandle: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  tiktokHandle: string;

  // Music
  tracks: RegistrationTrack[];

  // Terms
  agreeToTerms: boolean;
  followOnInstagram: boolean;
  notificationsOptIn: boolean;
}

export const DEFAULT_FORM_DATA: ArtistRegistrationFormData = {
  // Basic Details
  stageName: '',
  bio: '',
  genres: [],
  city: '',

  // Social
  profileImageUrl: '',
  pressImage1Url: '',
  pressImage2Url: '',
  pressImage3Url: '',
  instagramHandle: '',
  soundcloudUrl: '',
  spotifyUrl: '',
  tiktokHandle: '',

  // Music
  tracks: [],

  // Terms
  agreeToTerms: false,
  followOnInstagram: false,
  notificationsOptIn: false,
};

export const STEP_TITLES = [
  'Basic Details',
  'Social & Images',
  'Music',
  'Terms & Conditions',
];

export const DEFAULT_BIO =
  'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.';
