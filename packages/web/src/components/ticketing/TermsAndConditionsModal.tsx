import { useTranslation } from 'react-i18next';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsAndConditionsModal = ({
  isOpen,
  onClose,
}: TermsAndConditionsModalProps) => {
  const { t } = useTranslation('common');

  return (
    <FmCommonModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('termsAndConditions.title')}
    >
      <ScrollArea className='h-[60vh] pr-4'>
        <div className='space-y-6 text-sm text-foreground'>
          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section1.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section1.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section2.title')}
            </h3>
            <p className='text-muted-foreground mb-2'>
              {t('termsAndConditions.section2.content1')}
            </p>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section2.content2')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>{t('termsAndConditions.section3.title')}</h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section3.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section4.title')}
            </h3>
            <p className='text-muted-foreground mb-2'>
              {t('termsAndConditions.section4.content1')}
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>{t('termsAndConditions.section4.list1')}</li>
              <li>{t('termsAndConditions.section4.list2')}</li>
              <li>{t('termsAndConditions.section4.list3')}</li>
            </ul>
            <p className='text-muted-foreground mt-2'>
              {t('termsAndConditions.section4.content2')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>{t('termsAndConditions.section5.title')}</h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section5.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section6.title')}
            </h3>
            <p className='text-muted-foreground mb-2'>
              {t('termsAndConditions.section6.content1')}
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>{t('termsAndConditions.section6.list1')}</li>
              <li>{t('termsAndConditions.section6.list2')}</li>
              <li>{t('termsAndConditions.section6.list3')}</li>
              <li>{t('termsAndConditions.section6.list4')}</li>
            </ul>
            <p className='text-muted-foreground mt-2'>
              {t('termsAndConditions.section6.content2')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section7.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section7.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section8.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section8.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>{t('termsAndConditions.section9.title')}</h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section9.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section10.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section10.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section11.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section11.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section12.title')}
            </h3>
            <p className='text-muted-foreground mb-2'>
              {t('termsAndConditions.section12.content1')}
            </p>
            <ul className='list-disc pl-6 space-y-1 text-muted-foreground'>
              <li>{t('termsAndConditions.section12.list1')}</li>
              <li>{t('termsAndConditions.section12.list2')}</li>
              <li>{t('termsAndConditions.section12.list3')}</li>
              <li>{t('termsAndConditions.section12.list4')}</li>
              <li>{t('termsAndConditions.section12.list5')}</li>
            </ul>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section13.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section13.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>{t('termsAndConditions.section14.title')}</h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section14.content')}
            </p>
          </section>

          <section>
            <h3 className='font-canela text-base mb-2'>
              {t('termsAndConditions.section15.title')}
            </h3>
            <p className='text-muted-foreground'>
              {t('termsAndConditions.section15.content')}
            </p>
          </section>

          <p className='text-xs text-muted-foreground mt-8 pt-4 border-t border-border'>
            {t('termsAndConditions.lastUpdated')}
          </p>
        </div>
      </ScrollArea>
    </FmCommonModal>
  );
};
