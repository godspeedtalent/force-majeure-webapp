import { Instagram, ShoppingCart } from 'lucide-react';

import { SocialButton } from '@/components/SocialButton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingInstagramButtonProps {
  className?: string;
}

export const FloatingInstagramButton = ({
  className = '',
}: FloatingInstagramButtonProps) => {
  return (
    <TooltipProvider>
      <div className={`fixed bottom-24 right-6 z-50 flex flex-col gap-4 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SocialButton
                href='/merch'
                icon={ShoppingCart}
                label='Shop Merch'
                variant='floating'
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side='left'>
            <p>Shop Merch</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SocialButton
                href='https://www.instagram.com/force.majeure.events'
                icon={Instagram}
                label='Follow us on Instagram'
                variant='floating'
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side='left'>
            <p>@force.majeure.events</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
