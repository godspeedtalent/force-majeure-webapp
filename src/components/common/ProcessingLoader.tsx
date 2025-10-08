import { Loader2 } from 'lucide-react';

interface ProcessingLoaderProps {
  message?: string;
}

export function ProcessingLoader({
  message = 'Processing...',
}: ProcessingLoaderProps) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='flex flex-col items-center space-y-4'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
        <p className='text-muted-foreground text-sm'>{message}</p>
      </div>
    </div>
  );
}
