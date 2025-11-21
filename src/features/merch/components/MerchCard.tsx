import { ReactNode } from 'react';

import { FmImageCard } from '@/components/common/display/FmImageCard';
import { getImageUrl } from '@/shared/utils/imageUtils';

interface MerchCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  type: string;
  image_url: string | null;
  in_stock: boolean;
  children?: ReactNode;
  onClick?: () => void;
}

export const MerchCard = ({
  name,
  description,
  price,
  type,
  image_url,
  in_stock: _in_stock,
  children,
  onClick,
}: MerchCardProps) => {
  return (
    <FmImageCard
      image={getImageUrl(image_url)}
      imageAlt={name}
      title={name}
      subtitle={
        description
          ? undefined
          : `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`
      }
      badge={type}
      badgeVariant='secondary'
      onClick={onClick}
      showHoverEffect={!onClick} // Only show hover effect if not clickable for expansion
    >
      {children}
    </FmImageCard>
  );
};
