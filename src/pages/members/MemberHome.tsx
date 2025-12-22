import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { formatHeader } from '@/shared';

export default function MemberHome() {
  const { t } = useTranslation('common');

  return (
    <Layout>
      <div className='container mx-auto pt-8 pb-8 px-4'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-[40px]'>
            <div className='flex items-center gap-[10px] mb-2'>
              <User className='h-6 w-6 text-fm-gold' />
              <h1 className='text-3xl font-canela'>
                {formatHeader(t('memberHome.title'))}
              </h1>
            </div>
            <p className='text-muted-foreground'>
              {t('memberHome.subtitle')}
            </p>
          </div>

          <DecorativeDivider
            marginTop='mt-0'
            marginBottom='mb-8'
            lineWidth='w-32'
            opacity={0.5}
          />

          {/* Content Placeholder */}
          <div className='bg-black/40 backdrop-blur-md border border-white/20 rounded-none p-[40px]'>
            <div className='text-center space-y-4'>
              <User className='h-16 w-16 mx-auto text-fm-gold/50' />
              <h2 className='text-2xl font-canela'>
                {formatHeader(t('memberHome.comingSoonTitle'))}
              </h2>
              <p className='text-white/60'>
                {t('memberHome.comingSoonDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
