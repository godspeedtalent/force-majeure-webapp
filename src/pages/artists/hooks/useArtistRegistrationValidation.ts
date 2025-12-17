import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ArtistRegistrationFormData } from '../types/registration';

export function useArtistRegistrationValidation() {
  const { t } = useTranslation('toasts');

  const validateStep = (step: number, formData: ArtistRegistrationFormData): boolean => {
    switch (step) {
      case 0: // Basic Details
        if (!formData.stageName.trim()) {
          toast.error(t('validation.stageNameRequired'));
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error(t('validation.bioRequired'));
          return false;
        }
        if (formData.genres.length === 0) {
          toast.error(t('validation.genreRequired'));
          return false;
        }
        return true;

      case 1: // Social
        if (!formData.profileImageUrl.trim()) {
          toast.error(t('validation.profileImageRequired'));
          return false;
        }
        if (!formData.instagramHandle.trim()) {
          toast.error(t('validation.instagramRequired'));
          return false;
        }
        if (!formData.soundcloudUrl.trim() && !formData.spotifyUrl.trim()) {
          toast.error(t('validation.musicPlatformRequired'));
          return false;
        }
        return true;

      case 2: // Music
        // Check if at least one track has been added
        const soundcloudTrack = formData.tracks.find(t => t.platform === 'soundcloud');
        if (!soundcloudTrack || !soundcloudTrack.url.trim()) {
          toast.error(t('validation.djSetRequired'));
          return false;
        }
        // Validate URL format
        try {
          new URL(soundcloudTrack.url);
        } catch {
          toast.error(t('validation.invalidSoundcloudUrl'));
          return false;
        }
        return true;

      case 3: // Terms
        if (!formData.agreeToTerms) {
          toast.error(t('validation.termsRequired'));
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
