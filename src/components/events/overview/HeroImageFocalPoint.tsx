import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared/utils/utils';
import { Crosshair } from 'lucide-react';

interface HeroImageFocalPointProps {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
}

export const HeroImageFocalPoint = ({
  imageUrl,
  focalX,
  focalY,
  onChange,
}: HeroImageFocalPointProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    updateFocalPoint(e.clientX, e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateFocalPoint(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateFocalPoint = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);
    
    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    onChange(clampedX, clampedY);
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
        <Label>Mobile Image Focal Point</Label>
        <div className='flex items-center justify-center h-32 border border-dashed border-border rounded-lg bg-muted/20'>
          <p className='text-sm text-muted-foreground'>
            Upload a hero image to set focal point
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label>Mobile Image Focal Point</Label>
        <span className='text-xs text-muted-foreground'>
          {focalX}%, {focalY}%
        </span>
      </div>
      <div
        ref={containerRef}
        className={cn(
          'relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-crosshair',
          isDragging && 'ring-2 ring-fm-gold'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt='Hero image'
          className='w-full h-full object-cover'
          draggable={false}
        />
        
        {/* Focal point indicator */}
        <div
          className='absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none transition-all duration-150'
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
          }}
        >
          <Crosshair className='w-8 h-8 text-fm-gold drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='w-1.5 h-1.5 bg-fm-gold rounded-full shadow-lg' />
          </div>
        </div>

        {/* Grid overlay (optional) */}
        <div className='absolute inset-0 pointer-events-none opacity-20'>
          <div className='absolute top-1/3 left-0 right-0 h-px bg-white' />
          <div className='absolute top-2/3 left-0 right-0 h-px bg-white' />
          <div className='absolute left-1/3 top-0 bottom-0 w-px bg-white' />
          <div className='absolute left-2/3 top-0 bottom-0 w-px bg-white' />
        </div>
      </div>
      <p className='text-xs text-muted-foreground'>
        Click or drag on the image to set where it should be centered on mobile devices
      </p>
    </div>
  );
};
