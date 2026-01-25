import { cn } from '@/shared';

interface TesseractSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-4 h-4', stroke: 1 },
  md: { container: 'w-6 h-6', stroke: 2 },
  lg: { container: 'w-10 h-10', stroke: 2 },
  xl: { container: 'w-16 h-16', stroke: 3 },
};

/**
 * TesseractSpinner - 3D hypercube projection that appears to fold/unfold
 *
 * Two interlocking squares orbit each other using CSS 3D transforms,
 * creating the illusion of a 4D tesseract projecting into 3D space.
 */
export function TesseractSpinner({
  size = 'md',
  className,
}: TesseractSpinnerProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'relative motion-reduce:animate-none',
        config.container,
        className
      )}
      style={{ perspective: '200px' }}
    >
      {/* Outer rotating container */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'tesseract-orbit 4s linear infinite',
        }}
      >
        {/* Front square */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full text-fm-gold"
          style={{
            transform: 'translateZ(10px)',
          }}
        >
          <rect
            x="15"
            y="15"
            width="70"
            height="70"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(223, 186, 125, 0.4))',
            }}
          />
        </svg>

        {/* Back square */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full text-fm-gold"
          style={{
            transform: 'translateZ(-10px) scale(0.7)',
            opacity: 0.6,
          }}
        >
          <rect
            x="15"
            y="15"
            width="70"
            height="70"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
          />
        </svg>

        {/* Connecting edges */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full text-fm-gold"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Corner connections */}
          <line
            x1="15"
            y1="15"
            x2="26"
            y2="26"
            stroke="currentColor"
            strokeWidth={config.stroke * 0.7}
            opacity={0.4}
            style={{ animation: 'tesseract-edge-pulse 2s ease-in-out infinite' }}
          />
          <line
            x1="85"
            y1="15"
            x2="74"
            y2="26"
            stroke="currentColor"
            strokeWidth={config.stroke * 0.7}
            opacity={0.4}
            style={{ animation: 'tesseract-edge-pulse 2s ease-in-out infinite 0.5s' }}
          />
          <line
            x1="15"
            y1="85"
            x2="26"
            y2="74"
            stroke="currentColor"
            strokeWidth={config.stroke * 0.7}
            opacity={0.4}
            style={{ animation: 'tesseract-edge-pulse 2s ease-in-out infinite 1s' }}
          />
          <line
            x1="85"
            y1="85"
            x2="74"
            y2="74"
            stroke="currentColor"
            strokeWidth={config.stroke * 0.7}
            opacity={0.4}
            style={{ animation: 'tesseract-edge-pulse 2s ease-in-out infinite 1.5s' }}
          />
        </svg>
      </div>

      {/* Inner counter-rotating element */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'tesseract-inner 4s linear infinite reverse',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full text-fm-gold"
        >
          <rect
            x="30"
            y="30"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            opacity={0.8}
            style={{
              animation: 'tesseract-inner-square 2s ease-in-out infinite',
            }}
          />
        </svg>
      </div>

      <style>{`
        @keyframes tesseract-orbit {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }

        @keyframes tesseract-inner {
          0% {
            transform: rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateY(360deg) rotateZ(180deg);
          }
        }

        @keyframes tesseract-inner-square {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        @keyframes tesseract-edge-pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes tesseract-orbit { 0%, 100% { transform: none; } }
          @keyframes tesseract-inner { 0%, 100% { transform: none; } }
          @keyframes tesseract-inner-square { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes tesseract-edge-pulse { 0%, 100% { opacity: 0.5; } }
        }
      `}</style>
    </div>
  );
}
