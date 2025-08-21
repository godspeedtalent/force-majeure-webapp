import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';
import { Menu, X, ShoppingBag, Calendar, Mail, Users } from 'lucide-react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Events', icon: Calendar, href: '#events' },
    { label: 'Shop', icon: ShoppingBag, href: '#shop' },
    { label: 'Members', icon: Users, href: '#members' },
    { label: 'Contact', icon: Mail, href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <ForceMajeureLogo size="md" />
            <h1 className="text-2xl font-screamer font-black tracking-tight bg-gradient-monochrome bg-clip-text text-transparent">
              FORCE MAJEURE
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group relative px-3 py-2 text-sm font-canela font-medium text-foreground hover:text-fm-gold transition-colors duration-200"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fm-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </a>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-fm-gold hover:bg-hover-overlay"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-b border-border">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-base font-canela font-medium text-foreground hover:text-fm-gold hover:bg-hover-overlay rounded-md transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};