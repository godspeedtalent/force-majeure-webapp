import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { supabase } from '@force-majeure/shared';
import { sessionPersistence } from '@force-majeure/shared';

interface LoginFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  title?: string;
  description?: string;
}

export function LoginForm({
  onSuccess,
  onBack,
  title = 'Welcome Back',
  description = 'Sign in to continue',
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Check if device should be remembered on component mount
  useEffect(() => {
    setRememberDevice(sessionPersistence.shouldRememberDevice());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Set session persistence preference
      sessionPersistence.setRememberDevice(rememberDevice);

      toast.success('Successfully logged in!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className='w-full'>
      {onBack && (
        <button
          onClick={onBack}
          className='mb-4 text-muted-foreground hover:text-foreground bg-transparent hover:bg-white/5 px-3 py-2 rounded transition-colors'
        >
          ← Back
        </button>
      )}

      <div className='bg-background/60 backdrop-blur-md border-2 border-border/40 p-6 lg:p-8 w-full shadow-2xl'>
        <div className='mb-4 text-center'>
          <h1 className='font-display text-2xl md:text-3xl mb-2'>{title}</h1>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <FmCommonTextField
            label='Email *'
            id='loginEmail'
            type='email'
            placeholder='your@email.com'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className='h-9'
          />

          <FmCommonTextField
            label='Password *'
            id='loginPassword'
            password
            placeholder='Enter your password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className='h-9'
          />

          <div className='pt-2'>
            <FmCommonToggle
              id='rememberDevice'
              label='Remember this device for 30 days'
              checked={rememberDevice}
              onCheckedChange={checked => setRememberDevice(checked as boolean)}
              className='text-xs'
            />
          </div>

          <button
            type='submit'
            className='w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 mt-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isLogging}
          >
            {isLogging ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
