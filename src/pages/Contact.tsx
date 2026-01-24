import { useState } from 'react';
import { Mail, Instagram, Send, MessageSquare, AtSign, CheckCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Layout } from '@/components/layout/Layout';
import { FmI18nPages } from '@/components/common/i18n';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonEmailField, isValidEmail } from '@/components/common/forms/FmCommonEmailField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { supabase, logger } from '@/shared';

export default function Contact() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t('contact.form.requiredFields'));
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error(tCommon('validation.invalidEmail'));
      return;
    }

    setIsSubmitting(true);

    try {
      logger.info('Submitting contact form', {
        source: 'Contact.handleSubmit',
        hasName: !!formData.name,
        hasEmail: !!formData.email,
        hasSubject: !!formData.subject,
        hasMessage: !!formData.message,
      });

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
      });

      logger.info('Contact form response received', {
        source: 'Contact.handleSubmit',
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorType: error ? error.constructor.name : null,
      });

      if (error) {
        // Log full error details for debugging
        logger.error('Contact form edge function error', {
          errorMessage: error.message,
          errorName: error.name,
          errorContext: error.context,
          errorStatus: (error as any).status,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          source: 'Contact.handleSubmit',
        });
        throw error;
      }

      // Check for success flag in response data
      if (data && data.success === false) {
        logger.error('Contact form submission failed', {
          error: data.error || 'Unknown error',
          fullData: JSON.stringify(data),
          source: 'Contact.handleSubmit',
        });
        throw new Error(data.error || 'Submission failed');
      }

      logger.info('Contact form submitted successfully', {
        source: 'Contact.handleSubmit',
        emailId: data?.emailId,
      });

      setIsSubmitted(true);
    } catch (error) {
      logger.error('Failed to send contact form', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        source: 'Contact.handleSubmit',
      });
      toast.error(t('contact.form.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className='container mx-auto py-[60px] px-[20px] max-w-3xl'>
        {/* Page Header */}
        <div className='text-center mb-[60px]'>
          <FmI18nPages
            i18nKey='contact.title'
            as='h1'
            className='font-canela text-4xl md:text-5xl mb-[20px] bg-gradient-to-r from-fm-gold to-fm-gold/60 bg-clip-text text-transparent'
          />
          <FmI18nPages
            i18nKey='contact.subtitle'
            as='p'
            className='text-muted-foreground text-lg max-w-xl mx-auto'
          />
        </div>

        {/* Contact Form Section */}
        {isSubmitted ? (
          /* Success Confirmation */
          <FmCommonCard
            variant='default'
            size='lg'
            className='mb-[40px] text-center'
          >
            <div className='flex flex-col items-center gap-[20px] py-[20px]'>
              <div className='p-[20px] bg-fm-gold/10 rounded-full'>
                <CheckCircle className='h-12 w-12 text-fm-gold' />
              </div>
              <div className='space-y-[10px]'>
                <h2 className='font-canela text-2xl bg-gradient-to-r from-fm-gold to-fm-gold/60 bg-clip-text text-transparent'>
                  {t('contact.form.successMessage')}
                </h2>
                <p className='text-muted-foreground max-w-md'>
                  {t('contact.form.successDescription', 'We\'ve received your message and will get back to you as soon as possible.')}
                </p>
              </div>
              <FmCommonButton
                variant='default'
                icon={RotateCcw}
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className='mt-[10px]'
              >
                {t('contact.form.sendAnother', 'Send another message')}
              </FmCommonButton>
            </div>
          </FmCommonCard>
        ) : (
          /* Contact Form */
          <FmFormSection
            title={t('contact.form.title')}
            icon={MessageSquare}
            description={t('contact.form.requiredFields')}
            layout='stack'
            className='mb-[40px]'
          >
            <form onSubmit={handleSubmit} className='space-y-[20px]'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
                <FmCommonTextField
                  label={tCommon('labels.name')}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('contact.form.namePlaceholder')}
                />
                <FmCommonEmailField
                  label={tCommon('labels.email')}
                  required
                  value={formData.email}
                  onChange={(email) => setFormData({ ...formData, email })}
                  placeholder={t('contact.form.emailPlaceholder')}
                  validateOnBlur
                />
              </div>

              <FmCommonTextField
                label={t('contact.form.subjectLabel')}
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={t('contact.form.subjectPlaceholder')}
              />

              <FmCommonTextField
                label={t('contact.form.messageLabel')}
                required
                multiline
                autoSize
                minRows={5}
                maxRows={15}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('contact.form.messagePlaceholder')}
              />

              <div className='pt-[10px]'>
                <FmCommonButton
                  type='submit'
                  variant='gold'
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  icon={Send}
                  className='w-full md:w-auto min-w-[200px]'
                >
                  {isSubmitting ? tCommon('buttons.sending') : tCommon('buttons.send')}
                </FmCommonButton>
              </div>
            </form>
          </FmFormSection>
        )}

        {/* Direct Contact Section */}
        <div className='space-y-[20px]'>
          <FmSectionHeader
            title={t('contact.directContact')}
            icon={AtSign}
            description={t('contact.bookingNote')}
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
            {/* Email Card */}
            <FmCommonCard
              variant='default'
              hoverable
              size='md'
              onClick={() => window.location.href = 'mailto:management@forcemajeure.vip'}
              className='group cursor-pointer'
            >
              <div className='flex items-center gap-[20px]'>
                <div className='p-[10px] bg-fm-gold/10 group-hover:bg-fm-gold/20 transition-colors'>
                  <Mail className='h-6 w-6 text-fm-gold' />
                </div>
                <div className='flex-1 min-w-0'>
                  <FmI18nPages
                    i18nKey='contact.email'
                    as='p'
                    className='font-canela font-medium text-white group-hover:text-fm-gold transition-colors'
                  />
                  <p className='text-sm text-muted-foreground truncate'>
                    management@forcemajeure.vip
                  </p>
                </div>
              </div>
            </FmCommonCard>

            {/* Instagram Card */}
            <FmCommonCard
              variant='default'
              hoverable
              size='md'
              onClick={() => window.open('https://www.instagram.com/force.majeure.events', '_blank')}
              className='group cursor-pointer'
            >
              <div className='flex items-center gap-[20px]'>
                <div className='p-[10px] bg-fm-gold/10 group-hover:bg-fm-gold/20 transition-colors'>
                  <Instagram className='h-6 w-6 text-fm-gold' />
                </div>
                <div className='flex-1 min-w-0'>
                  <FmI18nPages
                    i18nKey='contact.instagram'
                    as='p'
                    className='font-canela font-medium text-white group-hover:text-fm-gold transition-colors'
                  />
                  <p className='text-sm text-muted-foreground truncate'>
                    @force.majeure.events
                  </p>
                </div>
              </div>
            </FmCommonCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
