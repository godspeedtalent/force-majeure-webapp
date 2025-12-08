import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import { ExternalLink } from 'lucide-react';

import { LF_SYSTEM_TICKET_URL } from '@/shared/constants/ticketLinks';

export function InvalidTokenView() {
  return (
    <>
      <MessagePanel
        title='Invalid Code'
        description="This QR code doesn't seem to be valid. Please try scanning it again."
        className='mb-4'
        action={
          <>
            <DecorativeDivider />
            <p className='text-muted-foreground font-canela'>
              If you keep having issues, take a photo of the poster with your
              hand holding up 3 fingers next to it.
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
            <DecorativeDivider />
            <p className='text-white font-canela'>
              Wanna jump straight to buying tickets?
            </p>
            <Button
              size='lg'
              className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
              onClick={() => window.open(LF_SYSTEM_TICKET_URL, '_blank')}
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
