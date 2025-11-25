import { Building2, Scan } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

interface OrganizationTabContentProps {
  onNavigate: (path: string) => void;
}

export function OrgDashboardTabContent({ onNavigate }: OrganizationTabContentProps) {
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
          Go to Org Dashboard
        </FmCommonButton>
      </div>
    </div>
  );
}

export function ScanTicketsTabContent({ onNavigate }: OrganizationTabContentProps) {
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
          Go to Ticket Scanner
        </FmCommonButton>
      </div>
    </div>
  );
}
