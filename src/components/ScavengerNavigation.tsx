import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ForceMajeureLogo } from '@/components/ForceMajeureLogo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { User, ShoppingCart, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ScavengerNavigationProps {
  showShoppingCart?: boolean;
}

export const ScavengerNavigation = ({ showShoppingCart = true }: ScavengerNavigationProps) => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border">
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
          <div className="flex items-center space-x-4">
            {showShoppingCart && (
              <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay" asChild>
                <Link to="/merch">
                  <ShoppingCart className="h-4 w-4" />
                </Link>
              </Button>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-foreground hover:text-fm-gold hover:bg-hover-overlay">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border border-border shadow-lg z-50">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {profile?.display_name || 'User'}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-hover-overlay text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
