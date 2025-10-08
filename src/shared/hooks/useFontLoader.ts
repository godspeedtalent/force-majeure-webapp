import { useState, useEffect } from 'react';

export const useFontLoader = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Check if FontFace API is supported
        if ('fonts' in document) {
          // Wait for all fonts to be loaded
          await document.fonts.ready;

          // Double-check that our specific fonts are loaded
          const fkScreamerLoaded = document.fonts.check('1em "FK Screamer"');
          const canelaLoaded = document.fonts.check('1em "Canela Deck"');

          if (fkScreamerLoaded && canelaLoaded) {
            setFontsLoaded(true);
          } else {
            // Fallback: wait a bit more and try again
            setTimeout(() => {
              setFontsLoaded(true);
            }, 1000);
          }
        } else {
          // Fallback for browsers without FontFace API
          setTimeout(() => {
            setFontsLoaded(true);
          }, 1500);
        }
      } catch (error) {
        console.warn('Font loading check failed:', error);
        // Fallback: assume fonts are loaded after a delay
        setTimeout(() => {
          setFontsLoaded(true);
        }, 2000);
      }
    };

    loadFonts();
  }, []);

  return fontsLoaded;
};
