import { Instagram, Music, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/shadcn/button';

export default function ComingSoon() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if fonts are already loaded
    const checkFonts = async () => {
      try {
        // Wait for document fonts to be ready
        await document.fonts.ready;

        // Small delay to ensure smooth transition
        setTimeout(() => {
          setFontsLoaded(true);
        }, 100);
      } catch (_error) {
        // Fallback after timeout in case of font loading issues
        setTimeout(() => setFontsLoaded(true), 1000);
      }
    };

    checkFonts();
  }, []);

  return (
    <Layout hideFooter>
      {/* Fixed viewport container - no scrolling */}
      <div className='h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden'>
        {/* Content - vertically centered with minimal spacing */}
        <div
          className={`text-center px-4 md:px-6 max-w-xl mx-auto w-full transition-opacity duration-500 ${fontsLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Logo - 50% smaller */}
          <div className={`mb-3 md:mb-4 flex justify-center ${fontsLoaded ? 'animate-fade-in' : ''}`}>
            <div className='w-full max-w-[100px] md:max-w-[150px]'>
              <ForceMajeureLogo size='responsive' />
            </div>
          </div>

          {/* Main message - 20% smaller */}
          <h1
            className={`font-display text-xl md:text-3xl mb-1.5 md:mb-2 ${fontsLoaded ? 'animate-slide-down-in' : ''}`}
          >
            Coming Soon
          </h1>

          <p
            className={`text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 ${fontsLoaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: fontsLoaded ? '0.2s' : '0s' }}
          >
            Just hang tight.
          </p>

          {/* Looking for Artists Box */}
          <div
            className={`p-4 md:p-6 bg-black/60 backdrop-blur-sm border border-fm-gold/20 mb-3 md:mb-4 max-w-xs mx-auto ${fontsLoaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: fontsLoaded ? '0.3s' : '0s' }}
          >
            <div className='flex items-start gap-3 md:gap-4 mb-3 md:mb-4'>
              <Music className='h-4 w-4 text-fm-gold mt-0.5 flex-shrink-0' />
              <div className='text-left space-y-2 md:space-y-3'>
                <h2 className='font-canela text-sm md:text-base text-fm-gold leading-relaxed'>
                  Looking for 2026 Undercard Artists
                </h2>
                <p className='text-[11px] md:text-sm text-muted-foreground leading-loose'>
                  We're looking for local artists to open up for our 2026 events. If you're a DJ, producer, or performer, we'd love to hear from you.
                </p>
              </div>
            </div>

            <Button
              variant='outline'
              onClick={() => navigate('/artists/register')}
              className='w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-[10px] md:text-xs py-1.5'
            >
              Sign up as an artist
              <ArrowRight className='ml-1.5 h-2.5 w-2.5' />
            </Button>
          </div>

          {/* Decorative elements - minimal spacing */}
          <DecorativeDivider marginTop='mt-2 md:mt-3' marginBottom='mb-2 md:mb-3' />

          {/* Social links - compact */}
          <div
            className={`flex items-center justify-center ${fontsLoaded ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: fontsLoaded ? '0.4s' : '0s' }}
          >
            <a
              href='https://www.instagram.com/force.majeure.events'
              target='_blank'
              rel='noopener noreferrer'
              className='p-2 md:p-2.5 rounded-full bg-muted/30 hover:bg-fm-gold hover:text-primary-foreground transition-all duration-300 hover:scale-110'
            >
              <Instagram className='w-4 h-4 md:w-5 md:h-5' />
            </a>
          </div>
        </div>

        {/* Loading fallback */}
        {!fontsLoaded && (
          <div className='absolute inset-0 flex items-center justify-center bg-background z-20'>
            <div className='animate-pulse text-muted-foreground'>Loading...</div>
          </div>
        )}
      </div>
    </Layout>
  );
}
