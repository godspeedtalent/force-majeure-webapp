interface ForceMajeureLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ForceMajeureLogo = ({ className = '', size = 'md' }: ForceMajeureLogoProps) => {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28'
  };

  // Always use dark theme logo since app is forced to dark mode
  const logoSrc = '/lovable-uploads/394024a3-6b83-4a11-afad-7d3fd0928b66.png';

  return (
    <img
      src={logoSrc}
      alt="Force Majeure"
      className={`${sizeClasses[size]} object-contain transition-opacity duration-200 ${className}`}
    />
  );
};