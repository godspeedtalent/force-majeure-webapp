import { Separator } from '@/components/common/shadcn/separator';
import { DevNotesSection } from '@/components/DevTools/DevNotesSection';

export function DevNotesTabContent() {
  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <DevNotesSection />
    </div>
  );
}
