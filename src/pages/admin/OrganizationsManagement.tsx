import { useTranslation } from 'react-i18next';
import { FmOrganizationDataGrid } from '@/features/data-grid';

export const OrganizationsManagement = () => {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          {t('organizationsManagement.title')}
        </h1>
        <p className='text-muted-foreground'>
          {t('organizationsManagement.description')}
        </p>
      </div>

      <FmOrganizationDataGrid />
    </div>
  );
};
