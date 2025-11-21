
import { AlertCircle } from 'lucide-react';

export function FmBulkEditInfoBanner() {
  return (
    <div className='flex items-start gap-3 p-3 rounded-none bg-blue-500/10 border border-blue-500/20'>
      <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
      <div className='text-sm space-y-1'>
        <p className='font-medium'>How bulk edit works:</p>
        <ul className='list-disc list-inside text-muted-foreground space-y-0.5'>
          <li>Toggle on the fields you want to update</li>
          <li>Set the new value for each enabled field</li>
          <li>All selected rows will be updated with the same values</li>
          <li>Disabled fields will remain unchanged</li>
        </ul>
      </div>
    </div>
  );
}
