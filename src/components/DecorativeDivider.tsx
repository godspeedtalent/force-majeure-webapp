interface DecorativeDividerProps {
  className?: string;
  marginTop?: string;
  marginBottom?: string;
  opacity?: number;
  lineWidth?: string;
  dotSize?: string;
  animate?: boolean;
}

export function DecorativeDivider({ 
  className = "",
  marginTop = "mt-16",
  marginBottom = "mb-16", 
  opacity = 0.3,
  lineWidth = "w-12",
  dotSize = "w-2 h-2",
  animate = true
}: DecorativeDividerProps) {
  return (
    <div 
      className={`${marginTop} ${marginBottom} flex items-center justify-center gap-2 ${className}`}
      style={{ opacity }}
    >
      <div className={`${lineWidth} h-px bg-gradient-to-r from-transparent to-fm-gold`} />
      <div className={`${dotSize} rounded-full bg-fm-gold ${animate ? 'animate-pulse-gold' : ''}`} />
      <div className={`${lineWidth} h-px bg-gradient-to-l from-transparent to-fm-gold`} />
    </div>
  );
}