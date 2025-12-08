import { Instagram } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { Layout } from '@/components/layout/Layout';

export default function ComingSoon() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

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
            forcemajeure.vip
            <br />
            <span className='text-fm-gold text-xl md:text-2xl'>Coming Soon</span>
          </h1>

          <p
            className={`text-base md:text-lg text-muted-foreground mb-8 md:mb-12 ${fontsLoaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: fontsLoaded ? '0.2s' : '0s' }}
          >
            Just hang tight.
          </p>

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
