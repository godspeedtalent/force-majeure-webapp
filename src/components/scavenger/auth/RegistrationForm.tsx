import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextField } from '@/components/ui/TextField';
import { FormSection } from '@/components/ui/FormSection';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { supabase } from '@/shared/api/supabase/client';

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
  password: string;
  confirmPassword: string;
  showOnLeaderboard: boolean;
  agreeToContact: boolean;
  sameAsFullName: boolean;
  isPublic: boolean;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function RegistrationForm({
  onSuccess,
  title = 'Join the Rave Fam',
  description = 'Register to claim your free tickets when you find them.',
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    displayName: '',
    phoneNumber: '',
    instagramHandle: '',
    password: '',
    confirmPassword: '',
    showOnLeaderboard: true,
    agreeToContact: false,
    sameAsFullName: false,
    isPublic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate password strength
  const passwordStrength: PasswordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordStrong =
    passwordStrength.hasMinLength &&
    passwordStrength.hasUpperCase &&
    passwordStrength.hasLowerCase &&
    passwordStrength.hasNumber &&
    passwordStrength.hasSpecialChar;

  // Handle "Same as full name" checkbox
  useEffect(() => {
    if (formData.sameAsFullName) {
      setFormData(prev => ({ ...prev, displayName: prev.fullName }));
    }
  }, [formData.sameAsFullName, formData.fullName]);

  // Check if all required fields are filled
  const isFormValid =
    formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.displayName.trim() !== '' &&
    formData.phoneNumber.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    passwordsMatch &&
    isPasswordStrong &&
    formData.agreeToContact;

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');

    // Limit to 10 digits
    const limited = cleaned.substring(0, 10);

    // Format as (XXX) XXX-XXXX
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Clear display name if unchecking "Same as full name"
      if (field === 'sameAsFullName' && value === false) {
        newData.displayName = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build redirect URL to preserve locationId if it exists
      const currentUrl = window.location.origin + window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const locationId = urlParams.get('locationId');
      const redirectUrl = locationId
        ? `${currentUrl}?locationId=${locationId}`
        : currentUrl;

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            instagram_handle: formData.instagramHandle,
            show_on_leaderboard: formData.showOnLeaderboard,
            is_public: formData.isPublic,
          },
          emailRedirectTo: redirectUrl,
        },
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
    <ScrollArea className='w-full max-h-[75vh]'>
      <div className='bg-background/60 backdrop-blur-md border-2 border-border/40 w-full shadow-2xl animate-slide-up-fade'>
        <div className='px-8 lg:px-12 pt-6 lg:pt-8 pb-4 text-center'>
          <h1 className='font-display text-2xl md:text-3xl mb-2'>{title}</h1>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>

        <form
          id='registration-form'
          onSubmit={handleSubmit}
          className='px-8 lg:px-12 pb-6'
        >
          <FormSection title='Contact Info' showTopDivider={false}>
            <TextField
              label='Full Name'
              id='fullName'
              type='text'
              placeholder='John Doe'
              value={formData.fullName}
              onChange={e => updateFormData('fullName', e.target.value)}
              required
            />

            <TextField
              label='Email'
              id='email'
              type='email'
              placeholder='your@email.com'
              value={formData.email}
              onChange={e => updateFormData('email', e.target.value)}
              required
            />

            <TextField
              label='Phone Number'
              id='phoneNumber'
              type='tel'
              placeholder='(555) 123-4567'
              value={formData.phoneNumber}
              onChange={e =>
                updateFormData('phoneNumber', formatPhoneNumber(e.target.value))
              }
              required
            />
          </FormSection>

          <FormSection title='Social'>
            <div className='space-y-3'>
              <TextField
                label='Display Name'
                id='displayName'
                type='text'
                placeholder='Your display name'
                value={formData.displayName}
                onChange={e => updateFormData('displayName', e.target.value)}
                required
                disabled={formData.sameAsFullName}
                description='What others will see if your profile is made public.'
                containerClassName='space-y-2'
              />
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='sameAsFullName'
                  checked={formData.sameAsFullName}
                  onCheckedChange={checked =>
                    updateFormData('sameAsFullName', checked as boolean)
                  }
                />
                <label htmlFor='sameAsFullName' className='text-xs'>
                  Same as full name
                </label>
              </div>
            </div>

            <TextField
              label='Instagram Handle'
              id='instagramHandle'
              type='text'
              placeholder='yourhandle'
              value={formData.instagramHandle}
              onChange={e => updateFormData('instagramHandle', e.target.value)}
              prepend='@'
            />

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='isPublic'
                checked={formData.isPublic}
                onCheckedChange={checked =>
                  updateFormData('isPublic', checked as boolean)
                }
              />
              <label htmlFor='isPublic' className='text-xs'>
                Make my profile public
              </label>
            </div>
          </FormSection>

          <FormSection title='Password'>
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm'>
                Password <span className='text-fm-gold'>*</span>
              </Label>
              <PasswordInput
                id='password'
                placeholder='Enter your password'
                value={formData.password}
                onChange={value => updateFormData('password', value)}
                required
                className='h-9'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-sm'>
                Confirm Password <span className='text-fm-gold'>*</span>
              </Label>
              <PasswordInput
                id='confirmPassword'
                placeholder='Confirm your password'
                value={formData.confirmPassword}
                onChange={value => updateFormData('confirmPassword', value)}
                required
                className='h-9'
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className='text-xs text-red-500 mt-1'>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Password Strength Guide */}
            {formData.password && (
              <div className='space-y-2 text-xs mt-3'>
                <p className='font-medium text-foreground/70'>
                  Password Requirements:
                </p>
                <div className='space-y-1.5'>
                  <div className='flex items-center gap-1.5'>
                    {passwordStrength.hasMinLength ? (
                      <Check className='h-3 w-3 text-fm-gold' />
                    ) : (
                      <X className='h-3 w-3 text-fm-crimson' />
                    )}
                    <span
                      className={
                        passwordStrength.hasMinLength
                          ? 'text-fm-gold'
                          : 'text-muted-foreground'
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {passwordStrength.hasUpperCase ? (
                      <Check className='h-3 w-3 text-fm-gold' />
                    ) : (
                      <X className='h-3 w-3 text-fm-crimson' />
                    )}
                    <span
                      className={
                        passwordStrength.hasUpperCase
                          ? 'text-fm-gold'
                          : 'text-muted-foreground'
                      }
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {passwordStrength.hasLowerCase ? (
                      <Check className='h-3 w-3 text-fm-gold' />
                    ) : (
                      <X className='h-3 w-3 text-fm-crimson' />
                    )}
                    <span
                      className={
                        passwordStrength.hasLowerCase
                          ? 'text-fm-gold'
                          : 'text-muted-foreground'
                      }
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {passwordStrength.hasNumber ? (
                      <Check className='h-3 w-3 text-fm-gold' />
                    ) : (
                      <X className='h-3 w-3 text-fm-crimson' />
                    )}
                    <span
                      className={
                        passwordStrength.hasNumber
                          ? 'text-fm-gold'
                          : 'text-muted-foreground'
                      }
                    >
                      One number
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {passwordStrength.hasSpecialChar ? (
                      <Check className='h-3 w-3 text-fm-gold' />
                    ) : (
                      <X className='h-3 w-3 text-fm-crimson' />
                    )}
                    <span
                      className={
                        passwordStrength.hasSpecialChar
                          ? 'text-fm-gold'
                          : 'text-muted-foreground'
                      }
                    >
                      One special character (!@#$%^&*...)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </FormSection>

          {/* Agreements */}
          <div className='space-y-3 pb-6'>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='agreeToContact'
                checked={formData.agreeToContact}
                onCheckedChange={checked =>
                  updateFormData('agreeToContact', checked as boolean)
                }
              />
              <label htmlFor='agreeToContact' className='text-xs'>
                I agree to receive event updates via email and SMS{' '}
                <span className='text-fm-gold'>*</span>
              </label>
            </div>
          </div>
        </form>

        <div className='px-8 lg:px-12 py-6 border-t border-border/40'>
          <Button
            type='submit'
            form='registration-form'
            className='w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9'
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
