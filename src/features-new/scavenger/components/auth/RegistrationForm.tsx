import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FormSection } from '@/components/common/forms/FormSection';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
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
    <div className='mh-72 bg-background/60 backdrop-blur-md border-2 border-border/40 w-full shadow-2xl animate-slide-up-fade'>
      <div className='px-8 lg:px-12 pt-6 lg:pt-8 pb-4 text-center'>
        <h1 className='font-display text-2xl md:text-3xl mb-2'>{title}</h1>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      <ScrollArea>
        <form
          id='registration-form'
          onSubmit={handleSubmit}
          className='px-8 lg:px-12 pb-6'
        >
          <FormSection title='Contact Info' showTopDivider={false}>
            <FmCommonTextField
              label='Full Name'
              id='fullName'
              type='text'
              placeholder='John Doe'
              value={formData.fullName}
              onChange={e => updateFormData('fullName', e.target.value)}
              required
            />

            <FmCommonTextField
              label='Email'
              id='email'
              type='email'
              placeholder='your@email.com'
              value={formData.email}
              onChange={e => updateFormData('email', e.target.value)}
              required
            />

            <FmCommonTextField
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
              <FmCommonTextField
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
              <FmCommonToggle
                id='sameAsFullName'
                label='Same as full name'
                checked={formData.sameAsFullName}
                onCheckedChange={checked =>
                  updateFormData('sameAsFullName', checked as boolean)
                }
                className='text-xs'
              />
            </div>

            <FmCommonTextField
              label='Instagram Handle'
              id='instagramHandle'
              type='text'
              placeholder='yourhandle'
              value={formData.instagramHandle}
              onChange={e => updateFormData('instagramHandle', e.target.value)}
              prepend='@'
            />

            <FmCommonToggle
              id='isPublic'
              label='Make my profile public'
              checked={formData.isPublic}
              onCheckedChange={checked =>
                updateFormData('isPublic', checked as boolean)
              }
              className='text-xs'
            />
          </FormSection>

          <FormSection title='Password'>
            <FmCommonTextField
              label='Password *'
              id='password'
              password
              placeholder='Enter your password'
              value={formData.password}
              onChange={e => updateFormData('password', e.target.value)}
              required
              className='h-9'
            />

            <div className='space-y-2'>
              <FmCommonTextField
                label='Confirm Password *'
                id='confirmPassword'
                password
                placeholder='Confirm your password'
                value={formData.confirmPassword}
                onChange={e =>
                  updateFormData('confirmPassword', e.target.value)
                }
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
            <FmCommonToggle
              id='agreeToContact'
              label='I agree to receive event updates via email and SMS *'
              checked={formData.agreeToContact}
              onCheckedChange={checked =>
                updateFormData('agreeToContact', checked as boolean)
              }
              className='text-xs'
            />
          </div>
        </form>

        <div className='px-8 lg:px-12 py-6 border-t border-border/40'>
          <button
            type='submit'
            form='registration-form'
            className='w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
