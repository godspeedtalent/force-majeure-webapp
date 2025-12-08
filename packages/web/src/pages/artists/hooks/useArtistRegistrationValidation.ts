import { toast } from 'sonner';
import type { ArtistRegistrationFormData } from '../types/registration';

export function useArtistRegistrationValidation() {
  const validateStep = (step: number, formData: ArtistRegistrationFormData): boolean => {
    switch (step) {
      case 0: // Basic Details
        if (!formData.stageName.trim()) {
          toast.error('Please enter your stage name');
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error('Please tell us about yourself');
          return false;
        }
        if (formData.genres.length === 0) {
          toast.error('Please select at least one genre');
          return false;
        }
        return true;

      case 1: // Social
        if (!formData.profileImageUrl.trim()) {
          toast.error('Please provide your profile image URL');
          return false;
        }
        if (!formData.instagramHandle.trim()) {
          toast.error('Instagram handle is required');
          return false;
        }
        if (!formData.soundcloudUrl.trim() && !formData.spotifyUrl.trim()) {
          toast.error('Please provide either a SoundCloud or Spotify URL');
          return false;
        }
        return true;

      case 2: // Music
        if (!formData.soundcloudSetUrl.trim()) {
          toast.error('A SoundCloud sample set is required');
          return false;
        }
        // Validate URL format
        try {
          new URL(formData.soundcloudSetUrl);
        } catch {
          toast.error('Please provide a valid SoundCloud URL');
          return false;
        }
        return true;

      case 3: // Terms
        if (!formData.agreeToTerms) {
          toast.error('You must agree to the terms and conditions');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const validateAllSteps = (formData: ArtistRegistrationFormData): number | null => {
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i, formData)) {
        return i; // Return the first invalid step
      }
    }
    return null; // All steps valid
  };

  return {
    validateStep,
    validateAllSteps,
  };
}
