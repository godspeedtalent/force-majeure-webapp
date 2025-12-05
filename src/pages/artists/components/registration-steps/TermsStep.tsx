import { useState, useRef, useCallback } from 'react';
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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsContainerRef = useRef<HTMLDivElement>(null);

  const handleTermsScroll = useCallback(() => {
    const container = termsContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider "scrolled to bottom" when within 10px of the bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  }, [hasScrolledToBottom]);

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
              <h3 className='font-canela text-base mb-[10px]'>Artist Submission Terms & Conditions</h3>
              <p className='font-canela text-xs text-muted-foreground mb-[10px]'>
                For Mix Submission and Consideration for Opening Slots
              </p>
              <div
                ref={termsContainerRef}
                onScroll={handleTermsScroll}
                className='max-h-[250px] overflow-y-auto mb-[15px] p-[15px] bg-black/20 border border-white/10 rounded-none'
              >
                <div className='font-canela text-xs text-muted-foreground leading-relaxed space-y-[15px]'>
                  <p>
                    By submitting this form, you ("Artist") agree to the following Terms and
                    Conditions. If you do not agree, do not submit.
                  </p>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>1. Submission Materials & Accuracy</p>
                    <p className='mb-[10px]'>
                      Artist may be required to submit a DJ mix, name, email, social links, press
                      assets, performance history, technical information, and any other materials
                      requested. Artist represents and warrants that all submitted information is
                      accurate and complete.
                    </p>
                    <p className='mb-[10px]'>
                      Artist affirms that they legally reside within 50 miles of the venue location
                      associated with the event for which they are submitting.
                    </p>
                    <p>
                      Artist represents that they own or have all necessary rights to the music,
                      mixes, recordings, and media they submit. If requested, Artist must be able
                      to provide proof of ownership or rights.
                    </p>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>2. Rights Granted to Us</p>
                    <p className='mb-[10px]'>
                      By submitting, Artist grants us and our partners a non-exclusive, royalty-free
                      license to use submitted materials solely for purposes of evaluating Artist
                      for current or future event bookings.
                    </p>
                    <p className='mb-[10px]'>
                      If Artist is selected for an event, Artist further grants us the right to use
                      their submitted materials—including name, photos, biography, and mix
                      excerpts—for marketing and promotional content related to that specific event.
                    </p>
                    <p>
                      Submitted materials will not be used for unrelated commercial purposes without
                      additional permission.
                    </p>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>3. Review Process & Selection</p>
                    <p className='mb-[10px]'>Artist acknowledges and agrees that:</p>
                    <ul className='list-disc list-inside space-y-[5px] ml-[10px]'>
                      <li>Submissions may be evaluated using both human review and automated decision-making systems.</li>
                      <li>We may decline any submission without notice or explanation.</li>
                      <li>Submission does not guarantee selection, booking, or further communication.</li>
                      <li>We may share submissions with event partners, venue operators, and affiliated promoters at our discretion for booking-related purposes.</li>
                    </ul>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>4. Performance Expectations Upon Selection</p>
                    <p className='mb-[10px]'>If Artist is selected for an opening slot, Artist agrees that:</p>
                    <ul className='list-disc list-inside space-y-[5px] ml-[10px]'>
                      <li>Arrival time is at least one (1) hour prior to their scheduled set.</li>
                      <li>All audio played must be provided in lossless format (e.g., WAV, AIFF).</li>
                      <li>Any additional equipment not supplied by us must receive written approval prior to use.</li>
                      <li>Artist must adhere to all professional standards, venue rules, and direction from event staff.</li>
                      <li>Additional performance-related terms may be provided separately in a performance agreement, which Artist must sign before appearing.</li>
                    </ul>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>5. Data Storage, Retention, and Sharing</p>
                    <p className='mb-[10px]'>
                      Artist agrees that submitted information may be stored across Supabase, AWS,
                      Google Drive, Notion, and internal systems including physical documentation.
                    </p>
                    <p className='mb-[10px]'>Artist understands and consents to the following:</p>
                    <ul className='list-disc list-inside space-y-[5px] ml-[10px]'>
                      <li>Data may be retained as long as legally permitted and necessary for our legitimate operational interests.</li>
                      <li>Data may be shared with event partners, affiliated promoters, and venue operators for booking and evaluation purposes.</li>
                    </ul>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>6. Data Requests & Removal</p>
                    <p className='mb-[10px]'>
                      Artist may request deletion of their data. We will comply unless retention is
                      required by law or for legitimate business purposes (e.g., ongoing booking
                      evaluation or compliance documentation).
                    </p>
                    <p>
                      Deletion requests may impact Artist's ability to be considered for future events.
                    </p>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>7. Conduct & Representation</p>
                    <p className='mb-[10px]'>
                      Artist agrees not to publicly claim selection or performance at any of our
                      events unless formally and explicitly confirmed in writing.
                    </p>
                    <p>
                      Misrepresentation of affiliation is grounds for immediate removal from
                      consideration for all future events.
                    </p>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>8. Updates to These Terms</p>
                    <p>
                      We are not required to notify Artist of changes to these Terms. The version
                      in effect at the time of submission governs the submission.
                    </p>
                  </div>

                  <div>
                    <p className='font-semibold text-white/80 mb-[5px]'>9. Acceptance</p>
                    <p>
                      By submitting this form, Artist acknowledges they have read, understood, and
                      agreed to these Terms and Conditions in full.
                    </p>
                  </div>
                </div>
              </div>

              {!hasScrolledToBottom && (
                <p className='font-canela text-xs text-fm-gold mb-[10px] animate-pulse'>
                  Please scroll to the bottom of the terms to continue.
                </p>
              )}

              <label
                className={`flex items-start gap-[10px] group ${
                  hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <input
                  type='checkbox'
                  checked={formData.agreeToTerms}
                  onChange={e => {
                    if (hasScrolledToBottom) {
                      onInputChange('agreeToTerms', e.target.checked);
                    }
                  }}
                  disabled={!hasScrolledToBottom}
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0 disabled:opacity-50'
                />
                <span
                  className={`font-canela text-sm transition-colors ${
                    hasScrolledToBottom ? 'group-hover:text-fm-gold' : ''
                  }`}
                >
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
                  checked={formData.notificationsOptIn}
                  onChange={e =>
                    onInputChange('notificationsOptIn', e.target.checked)
                  }
                  className='mt-1 h-4 w-4 rounded-none border-white/20 bg-transparent checked:bg-fm-gold checked:border-fm-gold focus:ring-fm-gold focus:ring-offset-0'
                />
                <div className='flex-1'>
                  <span className='font-canela text-sm group-hover:text-fm-gold transition-colors block'>
                    Send me booking and FM updates notifications
                  </span>
                  <span className='font-canela text-xs text-muted-foreground'>
                    Get notified about booking opportunities, event updates, and Force Majeure news
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
