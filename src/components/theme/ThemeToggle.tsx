import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme/ThemeProvider';
import { Button } from '@/components/ui/shadcn/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className='text-foreground hover:text-fm-gold hover:bg-hover-overlay transition-colors duration-200'
    >
      <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
