import { Database } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';

export function DatabaseTabContent() {
  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <div className='px-4 py-2 space-y-4'>
        <DatabaseNavigatorSearch />
      </div>
    </div>
  );
}

export function DatabaseTabFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className='pb-4'>
      <FmCommonButton
        variant='default'
        icon={Database}
        iconPosition='left'
        onClick={() => onNavigate('/developer/database')}
        className='w-full justify-start'
      >
        Go to Database Manager
      </FmCommonButton>
    </div>
  );
}
