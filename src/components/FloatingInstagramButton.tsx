import { Instagram } from 'lucide-react';

import { SocialButton } from '@/components/SocialButton';

interface FloatingInstagramButtonProps {
  className?: string;
}

export const FloatingInstagramButton = ({
  className = '',
}: FloatingInstagramButtonProps) => {
  return (
    <div className={`fixed bottom-24 right-6 z-50 ${className}`}>
      <SocialButton
        href='https://www.instagram.com/force.majeure.events'
        icon={Instagram}
        label='Follow us on Instagram'
        variant='floating'
      />
    </div>
  );
};
