import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';

/**
 * Color palette for the Sonic Gauntlet waveform bars
 * Based on the design inspiration in _dev/sonic_summit_inspo
 */
const WAVEFORM_COLORS = {
  lime: '#c4e84d',
  peach: '#d4a574',
  pink: '#ec4899',
  magenta: '#d946ef',
  purple: '#a855f7',
  blue: '#3b82f6',
} as const;

/**
 * Animated waveform bar component
 */
const WaveformBar = ({
  color,
  height,
  delay,
}: {
  color: string;
  height: number;
  delay: number;
}) => (
  <div
    className="w-3 sm:w-4 md:w-5 rounded-full animate-pulse"
    style={{
      backgroundColor: color,
      height: `${height}px`,
      animationDelay: `${delay}ms`,
      animationDuration: '1.5s',
    }}
  />
);

/**
 * Waveform visualization component - the signature visual element
 */
const WaveformVisualization = () => {
  // Define the bar pattern based on the design inspiration
  // Each bar has: color, base height, animation delay
  const bars = [
    { color: WAVEFORM_COLORS.lime, height: 24, delay: 0 },
    { color: WAVEFORM_COLORS.lime, height: 40, delay: 100 },
    { color: WAVEFORM_COLORS.peach, height: 32, delay: 200 },
    { color: WAVEFORM_COLORS.peach, height: 56, delay: 300 },
    { color: WAVEFORM_COLORS.pink, height: 48, delay: 400 },
    { color: WAVEFORM_COLORS.pink, height: 72, delay: 500 },
    { color: WAVEFORM_COLORS.magenta, height: 64, delay: 600 },
    { color: WAVEFORM_COLORS.magenta, height: 96, delay: 700 },
    { color: WAVEFORM_COLORS.purple, height: 120, delay: 800 },
    { color: WAVEFORM_COLORS.purple, height: 88, delay: 900 },
    { color: WAVEFORM_COLORS.purple, height: 104, delay: 1000 },
    { color: WAVEFORM_COLORS.magenta, height: 72, delay: 1100 },
    { color: WAVEFORM_COLORS.magenta, height: 56, delay: 1200 },
    { color: WAVEFORM_COLORS.pink, height: 80, delay: 1300 },
    { color: WAVEFORM_COLORS.pink, height: 48, delay: 1400 },
    { color: WAVEFORM_COLORS.peach, height: 64, delay: 1500 },
    { color: WAVEFORM_COLORS.peach, height: 40, delay: 1600 },
    { color: WAVEFORM_COLORS.lime, height: 56, delay: 1700 },
    { color: WAVEFORM_COLORS.lime, height: 32, delay: 1800 },
    { color: WAVEFORM_COLORS.lime, height: 48, delay: 1900 },
  ];

  return (
    <div className="flex items-end justify-center gap-1 sm:gap-1.5 md:gap-2 h-32 sm:h-40 md:h-48">
      {bars.map((bar, index) => (
        <WaveformBar key={index} {...bar} />
      ))}
    </div>
  );
};

/**
 * Sonic Gauntlet Landing Page
 *
 * This page has a fundamentally different visual style from the rest of the FM site,
 * featuring rounded corners, colorful waveform visualization, and its own dark theme.
 */
export default function SonicGauntlet() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Navigation - minimal, just a back button */}
      <nav className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
        <Link to="/">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Force Majeure
          </Button>
        </Link>
      </nav>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Presented by */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-white/50 text-xs sm:text-sm tracking-[0.3em] uppercase">
            Force Majeure presents
          </p>
        </div>

        {/* Main title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
            Sonic Gauntlet
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/60 text-lg sm:text-xl md:text-2xl tracking-[0.15em] mb-8 sm:mb-12">
          atx electronic showcase
        </p>

        {/* Waveform visualization */}
        <div className="mb-12 sm:mb-16">
          <WaveformVisualization />
        </div>

        {/* Description section */}
        <div className="max-w-2xl text-center mb-12 sm:mb-16 px-4">
          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6">
            Austin's premier DJ competition returns. Local electronic artists battle
            for glory, prizes, and the chance to headline a Force Majeure event.
          </p>
          <p className="text-white/50 text-sm sm:text-base">
            Registration opens soon. Stay tuned for dates and details.
          </p>
        </div>

        {/* CTA section */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105"
            disabled
          >
            Registration Coming Soon
          </Button>
        </div>

        {/* Social/contact hint */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-white/40 text-sm">
            Follow{' '}
            <a
              href="https://instagram.com/forcemajeureatx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors underline underline-offset-4"
            >
              @forcemajeureatx
            </a>{' '}
            for updates
          </p>
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs for depth */}
        <div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${WAVEFORM_COLORS.purple}, transparent)` }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${WAVEFORM_COLORS.pink}, transparent)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${WAVEFORM_COLORS.blue}, transparent)` }}
        />
      </div>
    </div>
  );
}
