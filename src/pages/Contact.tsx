import { useState } from 'react';
import { Mail, Instagram, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmI18nPages } from '@/components/common/i18n';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared';

export default function Contact() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
      });

      if (error) {
        throw error;
      }

      toast.success(t('contact.form.successMessage'));
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      logger.error('Failed to send contact form', { error });
      toast.error(t('contact.form.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className='container mx-auto py-[40px] px-[20px] max-w-2xl'>
        {/* Header */}
        <div className='text-center mb-[40px]'>
          <FmI18nPages i18nKey='contact.title' as='h1' className='font-canela text-3xl md:text-4xl mb-[10px]' />
          <FmI18nPages i18nKey='contact.subtitle' as='p' className='text-muted-foreground' />
        </div>

        <DecorativeDivider marginTop='mt-0' marginBottom='mb-[40px]' />

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className='space-y-[20px] mb-[40px]'>
          <FmI18nPages i18nKey='contact.form.title' as='h2' className='font-canela text-xl mb-[10px]' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-[20px]'>
            <FmCommonTextField
              label={tCommon('labels.name')}
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('contact.form.namePlaceholder')}
            />
            <FmCommonTextField
              label={tCommon('labels.email')}
              required
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('contact.form.emailPlaceholder')}
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
            minRows={3}
            maxRows={12}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t('contact.form.messagePlaceholder')}
          />

          <FmCommonButton
            type='submit'
            variant='default'
            disabled={isSubmitting}
            className='w-full'
          >
            <Send className='h-4 w-4 mr-[10px]' />
            {isSubmitting ? tCommon('buttons.sending') : tCommon('buttons.send')}
          </FmCommonButton>
        </form>

        <DecorativeDivider marginTop='mt-0' marginBottom='mb-[40px]' />

        {/* Direct contact options */}
        <FmI18nPages i18nKey='contact.directContact' as='h2' className='font-canela text-xl mb-[20px]' />

        <div className='space-y-[20px]'>
          {/* Email */}
          <a
            href='mailto:management@forcemajeure.vip'
            className='flex items-center gap-[20px] p-[20px] bg-white/5 border border-white/10 hover:border-fm-gold/50 hover:bg-fm-gold/5 transition-all duration-300 group'
          >
            <div className='p-[10px] bg-fm-gold/10 group-hover:bg-fm-gold/20 transition-colors'>
              <Mail className='h-6 w-6 text-fm-gold' />
            </div>
            <div>
              <FmI18nPages
                i18nKey='contact.email'
                as='p'
                className='font-canela font-medium text-white group-hover:text-fm-gold transition-colors'
              />
              <p className='text-sm text-muted-foreground'>management@forcemajeure.vip</p>
            </div>
          </a>

          {/* Instagram */}
          <a
            href='https://www.instagram.com/force.majeure.events'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-[20px] p-[20px] bg-white/5 border border-white/10 hover:border-fm-gold/50 hover:bg-fm-gold/5 transition-all duration-300 group'
          >
            <div className='p-[10px] bg-fm-gold/10 group-hover:bg-fm-gold/20 transition-colors'>
              <Instagram className='h-6 w-6 text-fm-gold' />
            </div>
            <div>
              <FmI18nPages
                i18nKey='contact.instagram'
                as='p'
                className='font-canela font-medium text-white group-hover:text-fm-gold transition-colors'
              />
              <p className='text-sm text-muted-foreground'>@force.majeure.events</p>
            </div>
          </a>
        </div>

        <DecorativeDivider marginTop='mt-[40px]' marginBottom='mb-[40px]' />

        {/* Footer note */}
        <FmI18nPages i18nKey='contact.bookingNote' as='p' className='text-center text-sm text-muted-foreground' />
      </div>
    </Layout>
  );
}
