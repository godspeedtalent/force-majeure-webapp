import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FmCommonSwitch } from '@/components/common/forms/FmCommonSwitch';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';

interface PrivacySettingsSectionProps {
  disabled?: boolean;
}

/**
 * Privacy settings section for profile edit page
 * Allows users to manage their guest list visibility
 */
export function PrivacySettingsSection({ disabled = false }: PrivacySettingsSectionProps) {
  const { t } = useTranslation('pages');
  const { profile, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [guestListVisible, setGuestListVisible] = useState(true);

  // Initialize state from profile
  useEffect(() => {
    if (profile) {
      // Default to true if undefined (public by default)
      setGuestListVisible(profile.guest_list_visible !== false);
    }
  }, [profile?.guest_list_visible]);

  const handleToggleVisibility = async (checked: boolean) => {
    setGuestListVisible(checked);
    setIsSaving(true);

    try {
      const { error } = await updateProfile({
        guest_list_visible: checked,
      });

      if (error) {
        // Revert on error
        setGuestListVisible(!checked);
        // Note: updateProfile already shows an error toast, so only log here
        logger.error('Failed to update privacy settings', {
          error: error.message,
          source: 'PrivacySettingsSection',
        });
      }
      // Note: updateProfile already shows a success toast
    } catch (error) {
      // Revert on error
      setGuestListVisible(!checked);
      // Note: updateProfile handles error toasts internally
      logger.error('Failed to update privacy settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'PrivacySettingsSection',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FmFormSection
      title={t('profile.privacy')}
      description={t('profile.privacyDescription')}
      icon={Eye}
    >
      <FmCommonSwitch
        label={t('profile.guestListVisibility')}
        description={t('profile.guestListVisibilityDescription')}
        checked={guestListVisible}
        onCheckedChange={handleToggleVisibility}
        disabled={disabled || isSaving}
      />
    </FmFormSection>
  );
}
