import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';
import { MoveVertical } from 'lucide-react';

interface HeroImageFocalPointProps {
  imageUrl: string;
  focalY: number;
  onChange: (y: number) => void;
}

export const HeroImageFocalPoint = ({
  imageUrl,
  focalY,
  onChange,
}: HeroImageFocalPointProps) => {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    updateFocalPoint(e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateFocalPoint(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateFocalPoint = (clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);
    
    // Clamp value between 0 and 100
    const clampedY = Math.max(0, Math.min(100, y));
    
    onChange(clampedY);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  if (!imageUrl) {
    return (
      <div className='space-y-2'>
        <Label>{t('focalPoint.label')}</Label>
        <div className='flex items-center justify-center h-32 border border-dashed border-border rounded-lg bg-muted/20'>
          <p className='text-sm text-muted-foreground'>
            {t('focalPoint.uploadToSet')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label>{t('focalPoint.label')}</Label>
        <span className='text-xs text-muted-foreground'>
          {focalY}%
        </span>
      </div>
      <div
        ref={containerRef}
        className={cn(
          'relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-ns-resize',
          isDragging && 'ring-2 ring-fm-gold'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt={t('focalPoint.heroImageAlt')}
          className='w-full h-full object-cover'
          draggable={false}
        />
        
        {/* Horizontal center line indicator */}
        <div
          className='absolute left-0 right-0 pointer-events-none transition-all duration-150'
          style={{
            top: `${focalY}%`,
          }}
        >
          {/* Line */}
          <div className='h-0.5 bg-fm-gold shadow-[0_0_12px_rgba(255,215,0,0.8)]' />
          
          {/* Drag handle */}
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center'>
            <div className='bg-fm-gold rounded-full p-2 shadow-lg'>
              <MoveVertical className='w-4 h-4 text-background' />
            </div>
          </div>
        </div>

        {/* Top and bottom thirds guides */}
        <div className='absolute inset-0 pointer-events-none opacity-10'>
          <div className='absolute top-1/3 left-0 right-0 h-px bg-white' />
          <div className='absolute top-2/3 left-0 right-0 h-px bg-white' />
        </div>
      </div>
      <p className='text-xs text-muted-foreground'>
        {t('focalPoint.instructions')}
      </p>
    </div>
  );
};
