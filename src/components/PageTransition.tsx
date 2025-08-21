import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const location = useLocation();

  useEffect(() => {
    if (displayChildren !== children) {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out completes, update content and fade in
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 200); // Match the fade out duration

      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  // Reset transition state when location changes
  useEffect(() => {
    setIsTransitioning(false);
  }, [location.pathname]);

  return (
    <div 
      className={`transition-opacity duration-200 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
};