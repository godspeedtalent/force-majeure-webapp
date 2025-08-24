import { Instagram } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Footer = () => {
  return (
    <footer className="w-full bg-background/50 backdrop-blur-md border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          {/* Left - Theme Toggle */}
          <ThemeToggle />
          
          {/* Right - Instagram Link */}
          <a
            href="https://www.instagram.com/force.majeure.events/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-fm-gold transition-colors duration-200"
            aria-label="Follow Force Majeure Events on Instagram"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};