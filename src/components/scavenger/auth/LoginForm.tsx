import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { supabase } from '@/integrations/supabase/client';
import { sessionPersistence } from '@/lib/sessionPersistence';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  title?: string;
  description?: string;
}

export function LoginForm({ 
  onSuccess, 
  onBack, 
  title = "Welcome Back",
  description = "Sign in to continue"
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
    <div className="w-full">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Button>
      )}
      
      <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-6 lg:p-8 w-full shadow-2xl">
        <div className="mb-4 text-center">
          <h1 className="font-display text-2xl md:text-3xl mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="loginEmail" className="text-sm">Email <span className="text-fm-gold">*</span></Label>
            <Input
              id="loginEmail"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="loginPassword" className="text-sm">Password <span className="text-fm-gold">*</span></Label>
            <PasswordInput
              id="loginPassword"
              value={password}
              onChange={setPassword}
              required
              className="h-9"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="rememberDevice"
              checked={rememberDevice}
              onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
            />
            <label htmlFor="rememberDevice" className="text-xs text-muted-foreground">
              Remember this device for 30 days
            </label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 mt-6"
            disabled={isLogging}
          >
            {isLogging ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}