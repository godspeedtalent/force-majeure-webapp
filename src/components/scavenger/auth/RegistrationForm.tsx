import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface RegistrationFormProps {
  onSuccess?: (email: string) => void;
  title?: string;
  description?: string;
}

interface FormData {
  fullName: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  instagramHandle: string;
  showOnLeaderboard: boolean;
  agreeToContact: boolean;
}

export function RegistrationForm({
  onSuccess,
  title = "Join the Rave Fam",
  description = "Register to claim your free tickets when you find them."
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    displayName: '',
    phoneNumber: '',
    instagramHandle: '',
    showOnLeaderboard: true,
    agreeToContact: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if all required fields are filled
  const isFormValid = formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.displayName.trim() !== '' &&
    formData.phoneNumber.trim() !== '' &&
    formData.agreeToContact;

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build redirect URL to preserve locationId if it exists
      const currentUrl = window.location.origin + window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get('locationId');
      const redirectUrl = locationId ? `${currentUrl}?locationId=${locationId}` : currentUrl;

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12),
        options: {
          data: {
            display_name: formData.displayName,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            instagram_handle: formData.instagramHandle,
            show_on_leaderboard: formData.showOnLeaderboard,
          },
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) throw error;

      toast.success('Verification email sent');
      onSuccess?.(formData.email);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-6 lg:p-8 w-full shadow-2xl animate-slide-up-fade">
      <div className="mb-4 text-center">
        <h1 className="font-display text-2xl md:text-3xl mb-2">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-sm">Full Name <span className="text-fm-gold">*</span></Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email <span className="text-fm-gold">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="displayName" className="text-sm">Display Name <span className="text-fm-gold">*</span></Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your display name"
              value={formData.displayName}
              onChange={(e) => updateFormData('displayName', e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phoneNumber" className="text-sm">Phone Number <span className="text-fm-gold">*</span></Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData('phoneNumber', e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="instagramHandle" className="text-sm">Instagram Handle</Label>
            <Input
              id="instagramHandle"
              type="text"
              placeholder="@yourhandle"
              value={formData.instagramHandle}
              onChange={(e) => updateFormData('instagramHandle', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showOnLeaderboard"
              checked={formData.showOnLeaderboard}
              onCheckedChange={(checked) => updateFormData('showOnLeaderboard', checked as boolean)}
            />
            <label htmlFor="showOnLeaderboard" className="text-xs">
              Show my name on the leaderboard
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToContact"
              checked={formData.agreeToContact}
              onCheckedChange={(checked) => updateFormData('agreeToContact', checked as boolean)}
            />
            <label htmlFor="agreeToContact" className="text-xs">
              I agree to receive event updates via email and SMS <span className="text-fm-gold">*</span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}