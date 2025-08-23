import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface ForceMajeureRootLayoutProps {
  children: ReactNode;
  className?: string;
}

export const ForceMajeureRootLayout = ({ 
  children, 
  className = '' 
}: ForceMajeureRootLayoutProps) => {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      <Navigation />
      
      {/* Main content area with topography background */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-topographic opacity-25 bg-repeat bg-center" />
        <div className="absolute inset-0 bg-gradient-monochrome opacity-10" />
        
        {/* Content */}
        <div className="relative pb-10">
          {children}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ForceMajeureRootLayout;