import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { FmOrganizationDataGrid } from '@/features/data-grid';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';

export const OrganizationsManagement = () => {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      <FmSectionHeader
        title={t('organizationsManagement.title')}
        description={t('organizationsManagement.description')}
        icon={Building2}
      />

      <FmOrganizationDataGrid />
    </div>
  );
};
