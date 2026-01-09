import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmFileDropzone } from '@/components/common/forms/FmFileDropzone';

interface SelectedEvent {
  id: string;
  title: string;
}

interface UploadStepProps {
  selectedEvent: SelectedEvent | null;
  onBack: () => void;
  onFileSelect: (file: File) => void;
  uploadPromptText: string;
  fileRequirementsText: string;
}

export function UploadStep({
  selectedEvent,
  onBack,
  onFileSelect,
  uploadPromptText,
  fileRequirementsText,
}: UploadStepProps) {
  return (
    <div className='space-y-6'>
      <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
        <FmCommonCardContent className='p-4'>
          <div className='text-sm'>
            <span className='text-fm-gold font-medium'>Importing to:</span>{' '}
            <span className='text-white'>{selectedEvent?.title}</span>
            <button
              onClick={onBack}
              className='ml-4 text-fm-gold underline hover:no-underline'
            >
              Change
            </button>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      <FmFileDropzone
        accept='.csv'
        onFileSelect={onFileSelect}
        label={uploadPromptText}
        helperText={fileRequirementsText}
      />
    </div>
  );
}
