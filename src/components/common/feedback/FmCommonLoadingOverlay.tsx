import { FmLoadingIndicator } from '@/components/common/feedback/FmLoadingIndicator';

interface FmCommonLoadingOverlayProps {
  message?: string;
}

/**
 * A reusable loading overlay component that displays a spinner and optional message
 * Covers the entire viewport with a backdrop blur effect
 */
export function FmCommonLoadingOverlay({
  message,
}: FmCommonLoadingOverlayProps) {
  return (
    <div className='fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300'>
      <FmLoadingIndicator
        size='lg'
        message={message}
        messageClassName='text-white/70'
      />
    </div>
  );
}
