import { useTranslation } from 'react-i18next';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import {
  FmArtistRow,
  type FmArtistRowProps,
} from '@/components/artist/FmArtistRow';

interface CallTimesSectionProps {
  callTimeLineup: Array<FmArtistRowProps['artist'] & { callTime?: string; roleLabel?: string }>;
  hasDescription: boolean;
  onArtistSelect: (artist: FmArtistRowProps['artist']) => void;
}

export function CallTimesSection({
  callTimeLineup,
  hasDescription,
  onArtistSelect,
}: CallTimesSectionProps) {
  const { t } = useTranslation('common');

  if (callTimeLineup.length === 0) {
    return null;
  }

  return (
    <FmCommonCollapsibleSection
      title={t('undercardApplication.callTimes')}
      defaultExpanded={true}
      className={!hasDescription ? 'lg:col-span-2' : ''}
    >
      <FmCommonStackLayout spacing='md'>
        {callTimeLineup.map((artist, index) => (
          <FmArtistRow
            key={`${artist.name}-${index}`}
            artist={artist}
            onSelect={onArtistSelect}
          />
        ))}
      </FmCommonStackLayout>
    </FmCommonCollapsibleSection>
  );
}
