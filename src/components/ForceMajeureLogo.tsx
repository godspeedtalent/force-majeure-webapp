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

  const logoSrc = theme === 'dark' ? '/images/fm-logo-light.png' : '/images/fm-logo-black.png';

  return (
    <img
      src={logoSrc}
      alt="Force Majeure"
      className={`${sizeClasses[size]} object-contain transition-opacity duration-200 ${className}`}
    />
  );
};