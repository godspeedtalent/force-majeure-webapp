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
      {/* Single viewport container */}
      <div className='h-[calc(100vh-64px)] flex items-center justify-center relative'>
        {/* Content */}
        <div
          className={`text-center px-6 max-w-2xl mx-auto transition-opacity duration-500 ${fontsLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Logo */}
          <div className={`mb-8 md:mb-12 flex justify-center ${fontsLoaded ? 'animate-fade-in' : ''}`}>
            <div className='w-full max-w-xs md:max-w-md'>
              <ForceMajeureLogo size='responsive' />
            </div>
          </div>

          {/* Main message */}
          <h1
            className={`font-display text-3xl md:text-6xl mb-4 md:mb-6 ${fontsLoaded ? 'animate-slide-down-in' : ''}`}
          >
            Coming Soon
          </h1>

          <p
            className={`text-base md:text-lg text-muted-foreground mb-8 md:mb-12 ${fontsLoaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: fontsLoaded ? '0.2s' : '0s' }}
          >
            Just hang tight.
          </p>

          {/* Looking for Artists Box */}
          <div
            className={`p-6 bg-black/60 backdrop-blur-sm border border-fm-gold/20 mb-8 md:mb-12 ${fontsLoaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: fontsLoaded ? '0.3s' : '0s' }}
          >
            <div className='flex items-start gap-3 mb-4'>
              <Music className='h-5 w-5 text-fm-gold mt-1 flex-shrink-0' />
              <div>
                <h2 className='font-canela text-lg md:text-xl text-fm-gold mb-2'>
                  Looking for 2026 Undercard Artists
                </h2>
                <p className='text-sm md:text-base text-muted-foreground leading-relaxed'>
                  We're looking for local artists to open up for our 2026 events. If you're a DJ, producer, or performer, we'd love to hear from you.
                </p>
              </div>
            </div>

            <Button
              variant='outline'
              onClick={() => navigate('/artists/register')}
              className='w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10'
            >
              Sign up as an artist
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </div>

          {/* Decorative elements */}
          <DecorativeDivider marginTop='mt-6' marginBottom='mb-6' />

          {/* Social links */}
          <div
            className={`flex items-center justify-center gap-6 ${fontsLoaded ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: fontsLoaded ? '0.4s' : '0s' }}
          >
            <a
              href='https://www.instagram.com/force.majeure.events'
              target='_blank'
              rel='noopener noreferrer'
              className='p-4 rounded-full bg-muted/30 hover:bg-fm-gold hover:text-primary-foreground transition-all duration-300 hover:scale-110'
            >
              <Instagram className='w-6 h-6' />
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
