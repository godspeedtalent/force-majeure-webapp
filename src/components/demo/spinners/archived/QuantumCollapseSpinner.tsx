import { cn } from '@/shared';

interface QuantumCollapseSpinnerProps {
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
 * QuantumCollapseSpinner - Concentric squares rotating at different speeds
 *
 * 4 nested squares that rotate in alternating directions with breathing opacity.
 * Creates a hypnotic, collapsing/expanding visual effect.
 */
export function QuantumCollapseSpinner({
  size = 'md',
  className,
}: QuantumCollapseSpinnerProps) {
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
        {/* Outer square - slow rotation, scale pulse */}
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="origin-center motion-reduce:animate-none"
          style={{
            transformOrigin: '50px 50px',
            animation: 'quantum-outer 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        {/* Second square - counter-rotation */}
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="origin-center motion-reduce:animate-none"
          style={{
            transformOrigin: '50px 50px',
            animation:
              'quantum-mid-1 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.15s',
          }}
        />

        {/* Third square - faster rotation */}
        <rect
          x="30"
          y="30"
          width="40"
          height="40"
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="origin-center motion-reduce:animate-none"
          style={{
            transformOrigin: '50px 50px',
            animation:
              'quantum-mid-2 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s',
          }}
        />

        {/* Center square - pulse glow only */}
        <rect
          x="40"
          y="40"
          width="20"
          height="20"
          fill="currentColor"
          className="origin-center motion-reduce:animate-none"
          style={{
            transformOrigin: '50px 50px',
            animation:
              'quantum-center 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            filter: 'drop-shadow(0 0 4px rgba(223, 186, 125, 0.5))',
          }}
        />
      </svg>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes quantum-outer {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: rotate(45deg) scale(1.05);
            opacity: 1;
          }
        }

        @keyframes quantum-mid-1 {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: rotate(-90deg) scale(0.95);
            opacity: 1;
          }
        }

        @keyframes quantum-mid-2 {
          0%, 100% {
            transform: rotate(0deg) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: rotate(135deg) scale(1.02);
            opacity: 1;
          }
        }

        @keyframes quantum-center {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 4px rgba(223, 186, 125, 0.3));
          }
          50% {
            opacity: 0.9;
            filter: drop-shadow(0 0 12px rgba(223, 186, 125, 0.8));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes quantum-outer { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes quantum-mid-1 { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes quantum-mid-2 { 0%, 100% { transform: none; opacity: 0.7; } }
          @keyframes quantum-center { 0%, 100% { opacity: 0.7; filter: none; } }
        }
      `}</style>
    </div>
  );
}
