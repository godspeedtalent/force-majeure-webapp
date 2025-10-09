import { DecorativeDivider } from '@/components/DecorativeDivider';
import { MessagePanel } from '@/components/MessagePanel';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const TICKET_URL =
  'https://www.etix.com/ticket/p/45040939/lf-system-austin-kingdom-nightclub?partner_id=100&_gl=1*fq6012*_gcl_au*MzU4MzE0NzgxLjE3NTk5Njg1MjM.*_ga*MTkwMzY4MjE5LjE3NTk5Njg1MjM.*_ga_FE6TSQF71T*czE3NTk5Njg1MjMkbzEkZzAkdDE3NTk5Njg1MjMkajYwJGwwJGgxNTA3MTgzNjUw';

export function InvalidTokenView() {
  return (
    <>
      <MessagePanel
        title='Invalid Code'
        description="This QR code doesn't seem to be valid. Please try scanning it again."
        className='mb-4'
        action={
          <>
          <DecorativeDivider/>
            <p className='text-muted-foreground font-canela'>
              If you keep having issues, take a photo of the poster with your hand
              holding up 3 fingers next to it.
            </p>
            <p className='text-foreground font-canela'>
              Send that photo in a DM to{' '}
              <a
                href='https://www.instagram.com/force.majeure.events/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-fm-gold hover:underline'
              >
                @force.majeure.events
              </a>{' '}
              on Instagram.
            </p>
            <DecorativeDivider/>
            <p className='text-white font-canela'>
              Wanna jump straight to buying tickets?
            </p>
              <Button
                size='lg'
                className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                onClick={() => window.open(TICKET_URL, '_blank')}
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Buy Tickets
              </Button>
            </>
        }
      />
    </>
  );
}
