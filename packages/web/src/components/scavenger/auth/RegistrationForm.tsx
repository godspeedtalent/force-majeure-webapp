import { Check, X, User, AtSign, Lock, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { supabase } from '@force-majeure/shared';
import { handleError } from '@/shared/services/errorHandler';

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
  title,
  description,
}: RegistrationFormProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');

  const displayTitle = title ?? t('scavenger.registration.title');
  const displayDescription = description ?? t('scavenger.registration.description');

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

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            instagram_handle: formData.instagramHandle,
            show_on_leaderboard: formData.showOnLeaderboard,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      // If user email is not confirmed, sign them out to prevent auto-login
      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        await supabase.auth.signOut();
      }

      toast.success(tToast('auth.emailVerificationSent'));
      onSuccess?.(formData.email);
    } catch (error: any) {
      // Use centralized error handler for network/connection errors
      await handleError(error, {
        title: t('scavenger.registration.registrationFailed'),
        description: t('scavenger.registration.unableToCreate'),
        context: 'Scavenger hunt registration',
        endpoint: '/auth/signup',
        method: 'POST',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mh-72 bg-background/60 backdrop-blur-md border-2 border-border/40 w-full shadow-2xl animate-slide-up-fade'>
      <div className='px-8 lg:px-12 pt-6 lg:pt-8 pb-4 text-center'>
        <h1 className='font-display text-2xl md:text-3xl mb-2'>{displayTitle}</h1>
        <p className='text-muted-foreground text-sm'>{displayDescription}</p>
      </div>
      <ScrollArea>
        <form
          id='registration-form'
          onSubmit={handleSubmit}
          className='px-8 lg:px-12 pb-6 space-y-[20px]'
        >
          {/* Contact Information */}
          <FmFormFieldGroup
            title={t('formGroups.contactInformation')}
            icon={User}
            layout='stack'
          >
            <FmCommonTextField
              label={t('labels.fullName')}
              id='fullName'
              type='text'
              placeholder={t('placeholders.fullName')}
              value={formData.fullName}
              onChange={e => updateFormData('fullName', e.target.value)}
              required
            />

            <FmCommonTextField
              label={t('labels.email')}
              id='email'
              type='email'
              placeholder={t('placeholders.yourEmail')}
              value={formData.email}
              onChange={e => updateFormData('email', e.target.value)}
              required
            />

            <FmCommonTextField
              label={t('labels.phoneNumber')}
              id='phoneNumber'
              type='tel'
              placeholder={t('placeholders.phoneNumber')}
              value={formData.phoneNumber}
              onChange={e =>
                updateFormData('phoneNumber', formatPhoneNumber(e.target.value))
              }
              required
            />
          </FmFormFieldGroup>

          {/* Social Profile */}
          <FmFormFieldGroup
            title={t('formGroups.socialProfile')}
            icon={AtSign}
            description={t('scavenger.registration.howYouAppear')}
            layout='stack'
          >
            <div className='space-y-3'>
              <FmCommonTextField
                label={t('labels.username')}
                id='displayName'
                type='text'
                placeholder={t('placeholders.yourUsername')}
                value={formData.displayName}
                onChange={e => updateFormData('displayName', e.target.value)}
                required
                disabled={formData.sameAsFullName}
                description={t('scavenger.registration.publicProfileDescription')}
                containerClassName='space-y-2'
              />
              <FmCommonToggle
                id='sameAsFullName'
                label={t('scavenger.registration.sameAsFullName')}
                checked={formData.sameAsFullName}
                onCheckedChange={checked =>
                  updateFormData('sameAsFullName', checked as boolean)
                }
                className='text-xs'
              />
            </div>

            <FmCommonTextField
              label={t('labels.instagramHandle')}
              id='instagramHandle'
              type='text'
              placeholder={t('placeholders.yourHandle')}
              value={formData.instagramHandle}
              onChange={e => updateFormData('instagramHandle', e.target.value)}
              prepend='@'
            />
          </FmFormFieldGroup>

          {/* Password Section */}
          <FmFormFieldGroup
            title={t('formGroups.accountSecurity')}
            icon={Lock}
            layout='stack'
          >
            <FmCommonTextField
              label={t('labels.password')}
              id='password'
              password
              placeholder={t('placeholders.enterPassword')}
              value={formData.password}
              onChange={e => updateFormData('password', e.target.value)}
              required
              className='h-9'
            />

            <div className='space-y-2'>
              <FmCommonTextField
                label={t('labels.confirmPassword')}
                id='confirmPassword'
                password
                placeholder={t('placeholders.confirmPassword')}
                value={formData.confirmPassword}
                onChange={e =>
                  updateFormData('confirmPassword', e.target.value)
                }
                required
                className='h-9'
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className='text-xs text-red-500 mt-1'>
                  {t('scavenger.registration.passwordsDoNotMatch')}
                </p>
              )}
            </div>

            {/* Password Strength Guide */}
            {formData.password && (
              <div className='space-y-2 text-xs mt-3'>
                <p className='font-medium text-foreground/70'>
                  {t('scavenger.registration.passwordRequirements')}
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
                      {t('scavenger.registration.atLeast8Chars')}
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
                      {t('scavenger.registration.oneUppercase')}
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
                      {t('scavenger.registration.oneLowercase')}
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
                      {t('scavenger.registration.oneNumber')}
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
                      {t('scavenger.registration.oneSpecialChar')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </FmFormFieldGroup>

          {/* Agreements */}
          <FmFormFieldGroup
            title={t('formGroups.preferences')}
            icon={MessageSquare}
            layout='stack'
          >
            <FmCommonToggle
              id='agreeToContact'
              label={t('scavenger.registration.agreeToContact')}
              checked={formData.agreeToContact}
              onCheckedChange={checked =>
                updateFormData('agreeToContact', checked as boolean)
              }
              className='text-xs'
            />
          </FmFormFieldGroup>
        </form>

        <div className='px-8 lg:px-12 py-6 border-t border-border/40'>
          <button
            type='submit'
            form='registration-form'
            className='w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] h-9 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
