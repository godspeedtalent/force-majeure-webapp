import { ReactNode } from 'react';
import { CommonCard } from '@/components/CommonCard';

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
      image={image_url || '/placeholder.svg'}
      imageAlt={name}
      title={name}
      subtitle={description ? `$${price.toFixed(2)}` : undefined}
      badge={type}
      badgeVariant="secondary"
      onClick={onClick}
      showHoverEffect={!onClick} // Only show hover effect if not clickable for expansion
    >
      {children}
    </CommonCard>
  );
};