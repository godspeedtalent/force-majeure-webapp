import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow, type FmArtistRowProps } from '@/components/artist/FmArtistRow';

interface CallTimeArtist {
  id?: string;
  name: string;
  genre?: string;
  image?: string | null;
  callTime: string;
  roleLabel?: string;
}

interface EventCallTimesProps {
  callTimeLineup: CallTimeArtist[];
  onArtistSelect: (artist: FmArtistRowProps['artist']) => void;
  className?: string;
}

/**
 * EventCallTimes - Displays the call times / lineup schedule
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 * Headliner is displayed first (at top) with emphasized styling.
 */
export const EventCallTimes = ({
  callTimeLineup,
  onArtistSelect,
  className = 'lg:col-span-2',
}: EventCallTimesProps) => {
  if (callTimeLineup.length === 0) {
    return null;
  }

  return (
    <FmCommonCollapsibleSection
      title='Call times'
      defaultExpanded={true}
      className={className}
    >
      <FmCommonStackLayout spacing='md'>
        {callTimeLineup.map((artist, index) => {
          const isHeadliner = artist.roleLabel === 'Headliner';
          return (
            <FmArtistRow
              key={`${artist.name}-${index}`}
              artist={artist}
              onSelect={onArtistSelect}
              variant={isHeadliner ? 'featured' : 'default'}
            />
          );
        })}
      </FmCommonStackLayout>
    </FmCommonCollapsibleSection>
  );
};
