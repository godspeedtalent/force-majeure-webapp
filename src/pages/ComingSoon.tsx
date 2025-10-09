import { Instagram } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DecorativeDivider } from '@/components/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';

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
    <div className='min-h-screen bg-background flex items-center justify-center relative overflow-hidden'>
      {/* Background patterns */}
      <div className='absolute inset-0 bg-topographic opacity-10 bg-cover bg-center' />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-5' />

      {/* Content */}
      <div
        className={`relative z-10 text-center px-6 max-w-2xl mx-auto transition-opacity duration-500 ${fontsLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Logo */}
        <div className={`mb-12 ${fontsLoaded ? 'animate-fade-in' : ''}`}>
          <ForceMajeureLogo className='w-full max-w-md mx-auto' />
        </div>

        {/* Main message */}
        <h1
          className={`font-display text-4xl md:text-6xl mb-6 ${fontsLoaded ? 'animate-slide-down-in' : ''}`}
        >
          The Force Majeure Hub
          <br />
          <span className='text-fm-gold'>Coming Soon</span>
        </h1>

        <p
          className={`text-lg md:text-l text-muted-foreground mb-12 ${fontsLoaded ? 'animate-fade-in' : ''}`}
          style={{ animationDelay: fontsLoaded ? '0.2s' : '0s' }}
        >
          Just hang tight.
          <br />
        </p>

        {/* Decorative elements */}
        <DecorativeDivider />

        {/* Social links */}
        <div
          className={`flex items-center justify-center gap-6 ${fontsLoaded ? 'animate-fade-in' : 'opacity-0'}`}
          style={{ animationDelay: fontsLoaded ? '0.4s' : '0s' }}
        >
          <a
            href='https://instagram.com/force.majeure.events'
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
  );
}
