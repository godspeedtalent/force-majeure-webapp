import { cn } from '@/shared';

interface ShatteredMonolithSpinnerProps {
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
 * ShatteredMonolithSpinner - Single square that fractures into pieces and reassembles
 *
 * A solid gold-outlined square that fractures into 4 triangular pieces,
 * which float outward with rotation, then magnetically snap back together.
 */
export function ShatteredMonolithSpinner({
  size = 'md',
  className,
}: ShatteredMonolithSpinnerProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'relative motion-reduce:animate-none',
        config.container,
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-fm-gold"
        style={{ overflow: 'visible' }}
      >
        {/* Fragment 1 - Top-left triangle */}
        <polygon
          points="15,15 50,15 50,50 15,50"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinejoin="miter"
          style={{
            transformOrigin: '32.5px 32.5px',
            animation: 'shatter-tl 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 3px rgba(223, 186, 125, 0.4))',
          }}
        />

        {/* Fragment 2 - Top-right triangle */}
        <polygon
          points="50,15 85,15 85,50 50,50"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinejoin="miter"
          style={{
            transformOrigin: '67.5px 32.5px',
            animation: 'shatter-tr 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 3px rgba(223, 186, 125, 0.4))',
          }}
        />

        {/* Fragment 3 - Bottom-right triangle */}
        <polygon
          points="50,50 85,50 85,85 50,85"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinejoin="miter"
          style={{
            transformOrigin: '67.5px 67.5px',
            animation: 'shatter-br 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 3px rgba(223, 186, 125, 0.4))',
          }}
        />

        {/* Fragment 4 - Bottom-left triangle */}
        <polygon
          points="15,50 50,50 50,85 15,85"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          strokeLinejoin="miter"
          style={{
            transformOrigin: '32.5px 67.5px',
            animation: 'shatter-bl 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 3px rgba(223, 186, 125, 0.4))',
          }}
        />

        {/* Center glow point */}
        <rect
          x="45"
          y="45"
          width="10"
          height="10"
          fill="currentColor"
          style={{
            transformOrigin: '50px 50px',
            animation: 'shatter-center 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 6px rgba(223, 186, 125, 0.8))',
          }}
        />

        {/* Crack lines that appear during shatter */}
        <line
          x1="50"
          y1="15"
          x2="50"
          y2="85"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.5}
          style={{
            animation: 'shatter-crack 3s ease-in-out infinite',
          }}
        />
        <line
          x1="15"
          y1="50"
          x2="85"
          y2="50"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.5}
          style={{
            animation: 'shatter-crack 3s ease-in-out infinite 0.1s',
          }}
        />
      </svg>

      <style>{`
        @keyframes shatter-tl {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translate(-12px, -12px) rotate(-15deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(-8px, -8px) rotate(-10deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(-2px, -2px) rotate(-3deg);
            opacity: 0.9;
          }
        }

        @keyframes shatter-tr {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translate(12px, -12px) rotate(15deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(8px, -8px) rotate(10deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(2px, -2px) rotate(3deg);
            opacity: 0.9;
          }
        }

        @keyframes shatter-br {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translate(12px, 12px) rotate(15deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(8px, 8px) rotate(10deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(2px, 2px) rotate(3deg);
            opacity: 0.9;
          }
        }

        @keyframes shatter-bl {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translate(-12px, 12px) rotate(-15deg);
            opacity: 0.7;
          }
          50% {
            transform: translate(-8px, 8px) rotate(-10deg);
            opacity: 0.8;
          }
          75% {
            transform: translate(-2px, 2px) rotate(-3deg);
            opacity: 0.9;
          }
        }

        @keyframes shatter-center {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(223, 186, 125, 0.8));
          }
          25% {
            transform: scale(1.5);
            opacity: 0.6;
            filter: drop-shadow(0 0 15px rgba(223, 186, 125, 1));
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
            filter: drop-shadow(0 0 10px rgba(223, 186, 125, 0.9));
          }
        }

        @keyframes shatter-crack {
          0%, 100% {
            opacity: 0;
          }
          20%, 40% {
            opacity: 0.8;
          }
          60% {
            opacity: 0.3;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes shatter-tl { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes shatter-tr { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes shatter-br { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes shatter-bl { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes shatter-center { 0%, 100% { transform: none; opacity: 0.7; filter: none; } }
          @keyframes shatter-crack { 0%, 100% { opacity: 0; } }
        }
      `}</style>
    </div>
  );
}
