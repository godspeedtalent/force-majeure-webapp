import { ChevronLeft, Instagram as InstagramIcon, ExternalLink } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import type { ArtistRegistrationFormData } from '../../types/registration';

interface TermsStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

export function TermsStep({
  formData,
  onInputChange,
  onSubmit,
  onPrevious,
  isSubmitting,
}: TermsStepProps) {
  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center'>
          <div className='w-[60%] space-y-[20px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>Almost there!</h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Review the terms and customize your profile settings.
              </p>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            {/* Terms and Conditions */}
            <div className='bg-black/40 backdrop-blur-sm border border-white/20 rounded-none p-[20px]'>
              <h3 className='font-canela text-base mb-[10px]'>Terms and Conditions</h3>
              <div className='max-h-[150px] overflow-y-auto mb-[15px] p-[15px] bg-black/20 border border-white/10 rounded-none'>
                <p className='font-canela text-xs text-muted-foreground leading-relaxed'>
                  By submitting this registration, you agree to the Force Majeure artist
                  terms and conditions. You confirm that all information provided is
                  accurate and that you have the rights to the music and images submitted.
                  Force Majeure reserves the right to approve or decline artist
                  applications at our discretion. Selected artists will be contacted
                  within 2-3 weeks of submission.
                </p>
              </div>
              <label className='flex items-start gap-[10px] cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={formData.agreeToTerms}
                  onChange={e => onInputChange('agreeToTerms', e.target.checked)}
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                />
                <span className='font-canela text-sm group-hover:text-fm-gold transition-colors'>
                  I agree to the terms and conditions{' '}
                  <span className='text-fm-danger'>*</span>
                </span>
              </label>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

            {/* Profile Settings */}
            <div className='space-y-[15px]'>
              <h3 className='font-canela text-base'>Profile Settings</h3>

              <label className='flex items-start gap-[10px] cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={formData.makeProfilePublic}
                  onChange={e => onInputChange('makeProfilePublic', e.target.checked)}
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                />
                <div className='flex-1'>
                  <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                    Make my artist profile public
                  </span>
                  <span className='font-canela text-xs text-muted-foreground'>
                    Your profile will be visible to event attendees and music fans
                  </span>
                </div>
              </label>

              <label className='flex items-start gap-[10px] cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={formData.linkPersonalProfile}
                  onChange={e =>
                    onInputChange('linkPersonalProfile', e.target.checked)
                  }
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                />
                <div className='flex-1'>
                  <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                    Link my personal account
                  </span>
                  <span className='font-canela text-xs text-muted-foreground'>
                    Connect your social user account with your artist profile
                  </span>
                </div>
              </label>

              <label className='flex items-start gap-[10px] cursor-pointer group'>
                <input
                  type='checkbox'
                  checked={formData.notificationsOptIn}
                  onChange={e =>
                    onInputChange('notificationsOptIn', e.target.checked)
                  }
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                />
                <div className='flex-1'>
                  <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                    Send me booking notifications
                  </span>
                  <span className='font-canela text-xs text-muted-foreground'>
                    Get notified about booking opportunities and event updates
                  </span>
                </div>
              </label>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

            {/* Support Force Majeure */}
            <div className='bg-fm-gold/10 border border-fm-gold/30 rounded-none p-[20px]'>
              <h3 className='font-canela text-base mb-[10px] text-fm-gold'>
                Support Force Majeure
              </h3>
              <p className='font-canela text-sm text-muted-foreground mb-[15px]'>
                Your support helps us create better events and support more artists.
                Follow us on Instagram to stay connected with the community.
              </p>
              <a
                href='https://instagram.com/forcemajeureevents'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-[10px] px-[20px] py-[12px] bg-fm-gold/20 hover:bg-fm-gold/30 border border-fm-gold/50 rounded-none transition-all duration-300 font-canela text-sm'
              >
                <InstagramIcon className='h-4 w-4' />
                Follow us on Instagram
                <ExternalLink className='h-3 w-3' />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
        <FmCommonButton onClick={onPrevious} variant='secondary'>
          <ChevronLeft className='h-4 w-4 mr-[10px]' />
          Previous
        </FmCommonButton>
        <FmCommonButton onClick={onSubmit} variant='gold' loading={isSubmitting}>
          Submit Registration
        </FmCommonButton>
      </div>
    </div>
  );
}
