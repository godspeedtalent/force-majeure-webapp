import { Separator } from '@/components/common/shadcn/separator';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';

export function FeatureTogglesTabContent() {
  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <FeatureToggleSection />
    </div>
  );
}
