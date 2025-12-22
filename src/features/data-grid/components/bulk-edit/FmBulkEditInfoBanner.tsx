import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

export function FmBulkEditInfoBanner() {
  const { t } = useTranslation('common');

  return (
    <div className='flex items-start gap-3 p-3 rounded-none bg-blue-500/10 border border-blue-500/20'>
      <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
      <div className='text-sm space-y-1'>
        <p className='font-medium'>{t('bulkEdit.howItWorks')}</p>
        <ul className='list-disc list-inside text-muted-foreground space-y-0.5'>
          <li>{t('bulkEdit.instructions.toggleFields')}</li>
          <li>{t('bulkEdit.instructions.setNewValue')}</li>
          <li>{t('bulkEdit.instructions.allRowsUpdated')}</li>
          <li>{t('bulkEdit.instructions.disabledFieldsUnchanged')}</li>
        </ul>
      </div>
    </div>
  );
}
