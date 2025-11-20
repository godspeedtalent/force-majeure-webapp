import type { Genre } from '@/features/artists/types';

export interface ArtistRegistrationFormData {
  // Basic Details
  stageName: string;
  bio: string;
  genres: Genre[];

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
  spotifyTrackUrl: string;
  soundcloudSetUrl: string;

  // Terms
  agreeToTerms: boolean;
  linkPersonalProfile: boolean;
  followOnInstagram: boolean;
  notificationsOptIn: boolean;
}

export const DEFAULT_FORM_DATA: ArtistRegistrationFormData = {
  // Basic Details
  stageName: '',
  bio: '',
  genres: [],

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
  spotifyTrackUrl: '',
  soundcloudSetUrl: '',

  // Terms
  agreeToTerms: false,
  linkPersonalProfile: false,
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
