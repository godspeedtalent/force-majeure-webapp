/**
 * ArtistSocialTab
 *
 * Social media tab for artist management - music platforms and social links.
 */

import { useTranslation } from 'react-i18next';
import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaSoundcloud,
  FaSpotify,
} from 'react-icons/fa6';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmI18nCommon } from '@/components/common/i18n';
import { cn } from '@/shared';

// Social media URL builders
const socialUrlBuilders = {
  instagram: (username: string) => `https://instagram.com/${username}`,
  twitter: (username: string) => `https://x.com/${username}`,
  facebook: (username: string) => `https://facebook.com/${username}`,
  tiktok: (username: string) => `https://tiktok.com/@${username}`,
  youtube: (username: string) => `https://youtube.com/@${username}`,
};

// Social media input with icon - username only, shows constructed URL
function SocialInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  iconColor,
  urlBuilder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  iconColor: string;
  urlBuilder: (username: string) => string;
}) {
  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          // Strip @ prefix if user includes it
          const cleaned = e.target.value.replace(/^@/, '');
          onChange(cleaned);
        }}
        placeholder={placeholder}
        prepend='@'
      />
      {value && (
        <a
          href={urlBuilder(value)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
        >
          {urlBuilder(value)}
        </a>
      )}
    </div>
  );
}

interface ArtistSocialTabProps {
  // Music platforms
  spotify: string;
  onSpotifyChange: (value: string) => void;
  soundcloud: string;
  onSoundcloudChange: (value: string) => void;
  // Social media
  instagram: string;
  onInstagramChange: (value: string) => void;
  tiktok: string;
  onTiktokChange: (value: string) => void;
  twitter: string;
  onTwitterChange: (value: string) => void;
  facebook: string;
  onFacebookChange: (value: string) => void;
  youtube: string;
  onYoutubeChange: (value: string) => void;
  // Auto-save
  onTriggerAutoSave: () => void;
}

export function ArtistSocialTab({
  spotify,
  onSpotifyChange,
  soundcloud,
  onSoundcloudChange,
  instagram,
  onInstagramChange,
  tiktok,
  onTiktokChange,
  twitter,
  onTwitterChange,
  facebook,
  onFacebookChange,
  youtube,
  onYoutubeChange,
  onTriggerAutoSave,
}: ArtistSocialTabProps) {
  const { t } = useTranslation('common');

  // Wrapper to trigger auto-save after each change
  const withAutoSave = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    onTriggerAutoSave();
  };

  return (
    <div className='space-y-6'>
      {/* Music Platforms */}
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.musicPlatforms' as='h2' className='text-xl font-semibold mb-6' />
        <FmI18nCommon i18nKey='sections.musicPlatformsDescription' as='p' className='text-muted-foreground mb-6' />

        <div className='space-y-4'>
          <SocialInput
            icon={FaSpotify}
            label={t('labels.spotify')}
            value={spotify}
            onChange={withAutoSave(onSpotifyChange)}
            placeholder={t('placeholders.spotifyArtistId')}
            iconColor='text-[#1DB954]'
            urlBuilder={(id) => id ? `https://open.spotify.com/artist/${id}` : ''}
          />

          <SocialInput
            icon={FaSoundcloud}
            label={t('labels.soundcloud')}
            value={soundcloud}
            onChange={withAutoSave(onSoundcloudChange)}
            placeholder={t('placeholders.soundcloudUrl')}
            iconColor='text-[#FF5500]'
            urlBuilder={(url) => url || ''}
          />
        </div>
      </FmCommonCard>

      {/* Social Media */}
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.socialMedia' as='h2' className='text-xl font-semibold mb-6' />
        <FmI18nCommon i18nKey='sections.socialMediaDescription' as='p' className='text-muted-foreground mb-6' />

        <div className='space-y-4'>
          <SocialInput
            icon={FaInstagram}
            label={t('labels.instagram')}
            value={instagram}
            onChange={withAutoSave(onInstagramChange)}
            placeholder={t('placeholders.username')}
            iconColor='text-[#E4405F]'
            urlBuilder={socialUrlBuilders.instagram}
          />

          <SocialInput
            icon={FaTiktok}
            label={t('labels.tiktok')}
            value={tiktok}
            onChange={withAutoSave(onTiktokChange)}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.tiktok}
          />

          <SocialInput
            icon={FaXTwitter}
            label={t('labels.twitterX')}
            value={twitter}
            onChange={withAutoSave(onTwitterChange)}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.twitter}
          />

          <SocialInput
            icon={FaFacebook}
            label={t('labels.facebook')}
            value={facebook}
            onChange={withAutoSave(onFacebookChange)}
            placeholder={t('placeholders.usernameOrPage')}
            iconColor='text-[#1877F2]'
            urlBuilder={socialUrlBuilders.facebook}
          />

          <SocialInput
            icon={FaYoutube}
            label={t('labels.youtube')}
            value={youtube}
            onChange={withAutoSave(onYoutubeChange)}
            placeholder={t('placeholders.channelHandle')}
            iconColor='text-[#FF0000]'
            urlBuilder={socialUrlBuilders.youtube}
          />
        </div>
      </FmCommonCard>
    </div>
  );
}
