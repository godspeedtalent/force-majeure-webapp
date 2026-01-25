import { cn } from '@/shared';

interface FractalCascadeSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-4 h-4', stroke: 1 },
  md: { container: 'w-6 h-6', stroke: 1.5 },
  lg: { container: 'w-10 h-10', stroke: 2 },
  xl: { container: 'w-16 h-16', stroke: 2.5 },
};

/**
 * FractalCascadeSpinner - Recursive squares appearing at corners
 *
 * Main square fades in, then smaller squares (50% size) appear at each corner
 * with staggered timing. Pattern continues 3 levels deep with a chasing glow effect.
 */
export function FractalCascadeSpinner({
  size = 'md',
  className,
}: FractalCascadeSpinnerProps) {
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
        style={{
          animation: 'fractal-rotate 8s linear infinite',
        }}
      >
        {/* Main outer square */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          style={{
            animation: 'fractal-main 3s ease-in-out infinite',
          }}
        />

        {/* Level 1 - Corner squares (4 corners) */}
        {/* Top-left */}
        <rect
          x="5"
          y="5"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.8}
          style={{
            animation: 'fractal-corner 3s ease-in-out infinite 0s',
            transformOrigin: '15px 15px',
          }}
        />
        {/* Top-right */}
        <rect
          x="75"
          y="5"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.8}
          style={{
            animation: 'fractal-corner 3s ease-in-out infinite 0.2s',
            transformOrigin: '85px 15px',
          }}
        />
        {/* Bottom-right */}
        <rect
          x="75"
          y="75"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.8}
          style={{
            animation: 'fractal-corner 3s ease-in-out infinite 0.4s',
            transformOrigin: '85px 85px',
          }}
        />
        {/* Bottom-left */}
        <rect
          x="5"
          y="75"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke * 0.8}
          style={{
            animation: 'fractal-corner 3s ease-in-out infinite 0.6s',
            transformOrigin: '15px 85px',
          }}
        />

        {/* Level 2 - Smaller corner squares */}
        {/* Top-left inner corners */}
        <rect
          x="2"
          y="2"
          width="8"
          height="8"
          fill="currentColor"
          opacity={0.4}
          style={{
            animation: 'fractal-dot 3s ease-in-out infinite 0.1s',
          }}
        />
        <rect
          x="90"
          y="2"
          width="8"
          height="8"
          fill="currentColor"
          opacity={0.4}
          style={{
            animation: 'fractal-dot 3s ease-in-out infinite 0.3s',
          }}
        />
        <rect
          x="90"
          y="90"
          width="8"
          height="8"
          fill="currentColor"
          opacity={0.4}
          style={{
            animation: 'fractal-dot 3s ease-in-out infinite 0.5s',
          }}
        />
        <rect
          x="2"
          y="90"
          width="8"
          height="8"
          fill="currentColor"
          opacity={0.4}
          style={{
            animation: 'fractal-dot 3s ease-in-out infinite 0.7s',
          }}
        />

        {/* Center square with glow */}
        <rect
          x="35"
          y="35"
          width="30"
          height="30"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          style={{
            animation: 'fractal-center 3s ease-in-out infinite',
            filter: 'drop-shadow(0 0 6px rgba(223, 186, 125, 0.5))',
          }}
        />
      </svg>

      <style>{`
        @keyframes fractal-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fractal-main {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        @keyframes fractal-corner {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
            filter: drop-shadow(0 0 0 transparent);
          }
          50% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(223, 186, 125, 0.8));
          }
        }

        @keyframes fractal-dot {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        @keyframes fractal-center {
          0%, 100% {
            opacity: 0.8;
            filter: drop-shadow(0 0 4px rgba(223, 186, 125, 0.3));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(223, 186, 125, 0.8));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fractal-rotate { 0%, 100% { transform: none; } }
          @keyframes fractal-main { 0%, 100% { opacity: 0.7; transform: none; } }
          @keyframes fractal-corner { 0%, 100% { opacity: 0.5; transform: none; filter: none; } }
          @keyframes fractal-dot { 0%, 100% { opacity: 0.5; transform: none; } }
          @keyframes fractal-center { 0%, 100% { opacity: 0.7; filter: none; } }
        }
      `}</style>
    </div>
  );
}
