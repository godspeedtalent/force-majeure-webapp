import { useTheme } from '@/components/theme-provider';

interface ForceMajeureLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ForceMajeureLogo = ({ className = '', size = 'md' }: ForceMajeureLogoProps) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const logoSrc = theme === 'dark' ? '/lovable-uploads/394024a3-6b83-4a11-afad-7d3fd0928b66.png' : '/lovable-uploads/e9d7ca2b-572e-4d47-b7a8-5aed2ab50c85.png';

  return (
    <img
      src={logoSrc}
      alt="Force Majeure"
      className={`${sizeClasses[size]} object-contain transition-opacity duration-200 ${className}`}
    />
  );
};