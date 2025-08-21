import { ReactNode } from 'react';
import { CommonCard } from '@/components/CommonCard';
import { getImageUrl } from '@/lib/imageUtils';

interface MerchCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: string;
  image_url: string;
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
  in_stock,
  children,
  onClick
}: MerchCardProps) => {
  return (
    <CommonCard
      image={getImageUrl(image_url)}
      imageAlt={name}
      title={name}
      subtitle={description ? undefined : `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`}
      badge={type}
      badgeVariant="secondary"
      onClick={onClick}
      showHoverEffect={!onClick} // Only show hover effect if not clickable for expansion
    >
      {children}
    </CommonCard>
  );
};