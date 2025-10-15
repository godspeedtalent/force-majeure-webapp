import { Instagram } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface FloatingInstagramButtonProps {
  className?: string;
}

export const FloatingInstagramButton = ({
  className = '',
}: FloatingInstagramButtonProps) => {
  return (
    <Button
      asChild
      size='icon'
      className={`fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-elegant hover:shadow-glow transition-all duration-300 bg-gradient-gold hover:scale-110 z-50 ${className}`}
    >
      <a
        href='https://instagram.com/forcemajeure.atx'
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Follow us on Instagram'
      >
        <Instagram className='h-6 w-6 text-background' />
      </a>
    </Button>
  );
};
