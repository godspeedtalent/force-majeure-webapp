import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Instagram, Music } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer style={{ backgroundColor: '#121212' }} className="text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              <p className="font-canela text-white/70 text-sm">Promotions & A&R</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-white/70 hover:text-fm-gold transition-colors">
                <Instagram className="w-4 h-4" />
              </button>
              <button className="text-white/70 hover:text-fm-gold transition-colors">
                <Music className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};