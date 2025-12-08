import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ArrowRight } from 'lucide-react';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow, type FmArtistRowProps } from '@/components/artist/FmArtistRow';
import { Button } from '@/components/common/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';

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
  lookingForUndercard?: boolean;
  eventId?: string;
  className?: string;
}

/**
 * EventCallTimes - Displays the call times / lineup schedule
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 * Headliner is displayed first (at top) with emphasized styling.
 * Optionally displays a "Looking for Artists" prompt when enabled.
 */
export const EventCallTimes = ({
  callTimeLineup,
  onArtistSelect,
  lookingForUndercard = false,
  eventId,
  className = 'lg:col-span-2',
}: EventCallTimesProps) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (callTimeLineup.length === 0 && !lookingForUndercard) {
    return null;
  }

  const handleSignUp = () => {
    setIsModalOpen(false);
    // Pass event_id so the registration can create an undercard request
    const url = eventId
      ? `/artists/register?event_id=${eventId}`
      : '/artists/register';
    navigate(url);
  };

  return (
    <>
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

          {/* Looking for Artists Button */}
          {lookingForUndercard && (
            <div className='flex justify-center mt-4'>
              <Button
                variant='outline'
                onClick={() => setIsModalOpen(true)}
                className='w-full py-1.5 px-4 border border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-xs transition-all duration-300'
              >
                Accepting Artist Undercard Applications
              </Button>
            </div>
          )}
        </FmCommonStackLayout>
      </FmCommonCollapsibleSection>

      {/* Looking for Artists Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 p-0 overflow-hidden'>
          <DialogHeader className='px-6 pt-6 pb-4'>
            <DialogTitle className='font-canela text-xl flex items-center gap-2'>
              <Music className='h-5 w-5 text-fm-gold' />
              We're looking for local talent.
            </DialogTitle>
          </DialogHeader>

          <div className='px-6 pb-6 space-y-4'>
            <p className='text-muted-foreground leading-relaxed'>
              We're looking for local artists to open up for this event. If you're a DJ, producer, or performer, we'd love to hear from you.
            </p>

            <div className='p-4 bg-fm-gold/10 border border-fm-gold/20 rounded-none'>
              <h4 className='font-semibold text-fm-gold mb-2'>How to apply</h4>
              <ol className='text-sm text-muted-foreground space-y-2 list-decimal list-inside'>
                <li>Create an artist profile on Force Majeure</li>
                <li>Submit a mix or demo showcasing your style</li>
                <li>We'll review submissions and reach out if it's a fit</li>
              </ol>
            </div>

            <Button
              variant='outline'
              onClick={handleSignUp}
              className='w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10'
            >
              Sign up as an artist
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>

            <p className='text-xs text-center text-muted-foreground/70'>
              Already have a profile? We'll match your account automatically.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
