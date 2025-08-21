import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogIn, UserPlus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <nav className="w-full bg-background/50 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="transition-transform duration-200 hover:scale-110">
              <ForceMajeureLogo className="h-8 w-8" />
            </Link>
            <Breadcrumbs />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay" asChild>
              <Link to="/merch">
                <ShoppingCart className="h-4 w-4" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer hover:bg-hover-overlay">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-hover-overlay">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay" asChild>
              <Link to="/merch">
                <ShoppingCart className="h-4 w-4" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer hover:bg-hover-overlay">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Sign In</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-hover-overlay">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="text-foreground hover:text-fm-gold hover:bg-hover-overlay">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-b border-border">
            <Link 
              to="/merch" 
              className="block px-3 py-2 text-base font-canela font-medium text-foreground hover:text-fm-gold hover:bg-hover-overlay rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Merchandise
            </Link>
          </div>
        </div>}
    </nav>;
};