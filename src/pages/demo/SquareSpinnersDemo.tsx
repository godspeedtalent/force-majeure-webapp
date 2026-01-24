import { Square, Archive } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
import {
  QuantumCollapseSpinner,
  TesseractSpinner,
  FractalCascadeSpinner,
  ShatteredMonolithSpinner,
} from '@/components/demo/spinners/archived';

interface ArchivedSpinnerConcept {
  name: string;
  description: string;
  component: React.ComponentType<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }>;
}

const archivedConcepts: ArchivedSpinnerConcept[] = [
  {
    name: 'Quantum Collapse',
    description: '4 concentric squares rotating at different speeds with breathing opacity.',
    component: QuantumCollapseSpinner,
  },
  {
    name: 'Tesseract Unfold',
    description: '3D hypercube projection using CSS perspective transforms.',
    component: TesseractSpinner,
  },
  {
    name: 'Fractal Cascade',
    description: 'Recursive squares appearing at corners with chasing glow.',
    component: FractalCascadeSpinner,
  },
  {
    name: 'Shattered Monolith',
    description: 'Square that fractures into pieces and magnetically reassembles.',
    component: ShatteredMonolithSpinner,
  },
];

const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];
const gridSizes = { sm: '2×2', md: '3×3', lg: '4×4', xl: '5×5' };

/**
 * SquareSpinnersDemo - Demo page for FmGoldenGridLoader and archived spinner concepts
 */
export default function SquareSpinnersDemo() {
  return (
    <DemoLayout
      title="FmGoldenGridLoader"
      description="The primary loading animation for Force Majeure. A mesmerizing grid-based spinner with dynamic sizing."
      icon={Square}
      condensed={false}
    >
      <div className="space-y-[60px]">
        {/* Primary Loader Section */}
        <section>
          <div className="border border-fm-gold/50 bg-black/60 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="p-[20px] border-b border-fm-gold/30 bg-fm-gold/5">
              <h2 className="text-2xl font-canela text-fm-gold">FmGoldenGridLoader</h2>
              <p className="text-muted-foreground text-sm mt-[5px]">
                Grid of squares that activate in a spiral pattern. Grid dimensions scale with size:
                sm (2×2), md (3×3), lg (4×4), xl (5×5).
              </p>
            </div>

            {/* Large Preview */}
            <div className="p-[40px]">
              <div className="flex justify-center mb-[40px]">
                <div className="w-40 h-40 flex items-center justify-center border border-white/10 bg-black/40">
                  <FmGoldenGridLoader size="xl" />
                </div>
              </div>

              {/* Size Variants with Grid Info */}
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-[20px] text-center">
                  Size variants
                </p>
                <div className="flex justify-center items-end gap-[40px]">
                  {sizes.map(size => (
                    <div key={size} className="flex flex-col items-center gap-[10px]">
                      <div className="flex items-center justify-center min-h-[80px]">
                        <FmGoldenGridLoader size={size} />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-fm-gold">{size}</span>
                        <p className="text-xs text-muted-foreground">{gridSizes[size]} grid</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="p-[20px] border-t border-white/10 bg-black/40">
              <p className="text-xs uppercase text-muted-foreground mb-[10px]">Usage</p>
              <code className="text-sm text-fm-gold/80 block">
                {'import { FmGoldenGridLoader } from "@/components/common/feedback/FmGoldenGridLoader";'}
              </code>
              <code className="text-sm text-muted-foreground block mt-[5px]">
                {'<FmGoldenGridLoader size="md" />'}
              </code>
            </div>
          </div>
        </section>

        {/* Accessibility Note */}
        <div className="p-[20px] border border-white/20 bg-black/40">
          <p className="text-sm text-muted-foreground">
            <span className="text-fm-gold font-medium">Accessibility:</span> All animations
            respect the <code className="text-fm-gold/80">prefers-reduced-motion</code> media
            query. Enable it in your browser/OS settings to see the static fallback.
          </p>
        </div>

        {/* Archived Concepts Section */}
        <section>
          <div className="flex items-center gap-[10px] mb-[20px]">
            <Archive className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-canela text-muted-foreground">Archived concepts</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-[20px]">
            Alternative spinner designs that were considered. Kept for reference and potential future use.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
            {archivedConcepts.map(concept => {
              const SpinnerComponent = concept.component;
              return (
                <div
                  key={concept.name}
                  className="border border-white/10 bg-black/40 p-[20px]"
                >
                  <div className="flex items-start gap-[20px]">
                    <div className="w-16 h-16 flex items-center justify-center border border-white/10 bg-black/20 flex-shrink-0">
                      <SpinnerComponent size="lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium">{concept.name}</h4>
                      <p className="text-xs text-muted-foreground mt-[5px]">
                        {concept.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DemoLayout>
  );
}
