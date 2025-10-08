/**
 * Demo component to test all ImageAnchor positions
 * This is for testing purposes and can be used in development
 */
import lfSystemImage from '@/assets/lf-system-scavenger.jpg';
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton';
import { ImageAnchor } from '@/shared/types/imageAnchor';

export const ImageAnchorDemo = () => {
  const anchors = [
    { anchor: ImageAnchor.TOP, label: 'Top' },
    { anchor: ImageAnchor.TOP_RIGHT, label: 'Top Right' },
    { anchor: ImageAnchor.RIGHT, label: 'Right' },
    { anchor: ImageAnchor.BOTTOM_RIGHT, label: 'Bottom Right' },
    { anchor: ImageAnchor.BOTTOM, label: 'Bottom' },
    { anchor: ImageAnchor.BOTTOM_LEFT, label: 'Bottom Left' },
    { anchor: ImageAnchor.LEFT, label: 'Left' },
    { anchor: ImageAnchor.TOP_LEFT, label: 'Top Left' },
    { anchor: ImageAnchor.CENTER, label: 'Center (Default)' },
  ];

  return (
    <div className='p-8 space-y-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Image Anchor Positions Demo
      </h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {anchors.map(({ anchor, label }) => (
          <div key={anchor} className='space-y-2'>
            <h3 className='text-lg font-medium text-center'>{label}</h3>
            <div className='h-48 w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden'>
              <ImageWithSkeleton
                src={lfSystemImage}
                alt={`Image with ${label} anchor`}
                anchor={anchor}
                className='w-full h-full object-cover'
              />
            </div>
            <p className='text-sm text-gray-600 text-center'>anchor={anchor}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
