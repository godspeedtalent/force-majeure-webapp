import { useTranslation } from 'react-i18next';
import { Building2, Scan } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

interface OrganizationTabContentProps {
  onNavigate: (path: string) => void;
}

export function ManageOrganizationTabContent({ onNavigate }: OrganizationTabContentProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <div className='flex flex-col gap-2'>
        <FmCommonButton
          variant='default'
          icon={Building2}
          iconPosition='left'
          onClick={() => onNavigate('/organization/tools')}
          className='w-full justify-start'
        >
          {t('organizationTab.goToOrgDashboard')}
        </FmCommonButton>
      </div>
    </div>
  );
}

/** @deprecated Use ManageOrganizationTabContent instead */
export const OrgDashboardTabContent = ManageOrganizationTabContent;

export function ScanTicketsTabContent({ onNavigate }: OrganizationTabContentProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <div className='flex flex-col gap-2'>
        <FmCommonButton
          variant='default'
          icon={Scan}
          iconPosition='left'
          onClick={() => onNavigate('/organization/scanning')}
          className='w-full justify-start'
        >
          {t('organizationTab.goToTicketScanner')}
        </FmCommonButton>
      </div>
    </div>
  );
}
