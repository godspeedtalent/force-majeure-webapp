import { Mail, Instagram, MapPin } from 'lucide-react';

import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { FmI18nPages } from '@/components/common/i18n';

export default function Contact() {
  return (
    <Layout>
      <div className='container mx-auto py-[40px] px-[20px] max-w-2xl'>
        {/* Header */}
        <div className='text-center mb-[40px]'>
          <FmI18nPages i18nKey='contact.title' as='h1' className='font-canela text-3xl md:text-4xl mb-[10px]' />
          <FmI18nPages i18nKey='contact.subtitle' as='p' className='text-muted-foreground' />
        </div>

        <DecorativeDivider marginTop='mt-0' marginBottom='mb-[40px]' />

        {/* Contact options */}
        <div className='space-y-[20px]'>
          {/* Email */}
          <a
            href='mailto:contact@forcemajeure.vip'
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
              <p className='text-sm text-muted-foreground'>contact@forcemajeure.vip</p>
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

          {/* Location */}
          <div className='flex items-center gap-[20px] p-[20px] bg-white/5 border border-white/10'>
            <div className='p-[10px] bg-fm-gold/10'>
              <MapPin className='h-6 w-6 text-fm-gold' />
            </div>
            <div>
              <FmI18nPages i18nKey='contact.location' as='p' className='font-canela font-medium text-white' />
              <FmI18nPages i18nKey='contact.locationValue' as='p' className='text-sm text-muted-foreground' />
            </div>
          </div>
        </div>

        <DecorativeDivider marginTop='mt-[40px]' marginBottom='mb-[40px]' />

        {/* Footer note */}
        <FmI18nPages i18nKey='contact.bookingNote' as='p' className='text-center text-sm text-muted-foreground' />
      </div>
    </Layout>
  );
}
