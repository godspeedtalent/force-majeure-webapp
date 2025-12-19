import { FmI18nCommon } from '@/components/common/i18n';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='w-full bg-background/50 backdrop-blur-md border-t border-border'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-center h-10'>
          <FmI18nCommon
            i18nKey='footer.copyright'
            values={{ year: currentYear }}
            as='p'
            className='text-xs text-muted-foreground'
          />
        </div>
      </div>
    </footer>
  );
};
