import { Code, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from './ui/button';

import { supabase } from '@/shared/api/supabase/client';
import { useUserRole } from '@/shared/hooks/useUserRole';

export const ScavengerDevPanel = () => {
  // ✅ ALL HOOKS MUST BE CALLED UNCONDITIONALLY FIRST
  const { data: role } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearingClaims, setIsClearingClaims] = useState(false);
  const navigate = useNavigate();

  // ✅ Determine admin status AFTER all hooks are called
  const isAdmin = role === 'admin';

  const clearAllClaims = async () => {
    setIsClearingClaims(true);
    try {
      const { error } = await supabase
        .from('scavenger_claims')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast.success('All claims cleared successfully!');

      // Redirect to the same URL to refresh the page
      const currentUrl = window.location.pathname + window.location.search;
      navigate(currentUrl);

      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing claims:', error);
      toast.error('Failed to clear claims');
    } finally {
      setIsClearingClaims(false);
    }
  };

  // ✅ Early return AFTER all hooks are called
  if (!isAdmin) {
    return null;
  }

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size='icon'
          className='h-12 w-12 rounded-full shadow-lg bg-fm-gold hover:bg-fm-gold/80'
          title='Dev Panel'
        >
          <Code className='h-5 w-5' />
        </Button>
      ) : (
        <div className='bg-background border-2 border-fm-gold rounded-lg shadow-xl p-4 w-80'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-screamer text-lg text-fm-gold'>Dev Panel</h3>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsOpen(false)}
              className='h-6 w-6'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='space-y-4'>
            <Button
              variant='destructive'
              className='w-full'
              onClick={clearAllClaims}
              disabled={isClearingClaims}
            >
              {isClearingClaims ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Clearing Claims...
                </>
              ) : (
                'Clear All Claims'
              )}
            </Button>
            <p className='text-xs text-muted-foreground'>
              This will delete all claims from the scavenger_claims table and
              refresh the page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
