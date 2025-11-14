export function OverviewSection() {
  return (
    <div className='space-y-6'>
      <div className='p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-border shadow-xl'>
        <h3 className='text-2xl font-canela font-semibold mb-4 text-fm-gold'>
          FM Component System
        </h3>

        <div className='space-y-6 text-muted-foreground'>
          <section>
            <h4 className='text-lg font-semibold text-foreground mb-2'>
              Philosophy
            </h4>
            <p>
              The Force Majeure component system is built on principles of
              consistency, reusability, and developer experience. Every{' '}
              <code className='text-fm-gold'>FmCommon</code> component is
              designed to provide a standardized interface while maintaining
              the flexibility needed for diverse use cases across the
              application.
            </p>
          </section>

          <section>
            <h4 className='text-lg font-semibold text-foreground mb-2'>
              Component Hierarchy
            </h4>
            <p className='mb-3'>
              Our components follow a clear hierarchy with three levels:
            </p>
            <ul className='list-disc list-inside space-y-2 ml-4'>
              <li>
                <strong className='text-foreground'>Base Components</strong> -
                Core building blocks like
                <code className='text-fm-gold mx-1'>FmCommonButton</code>,
                <code className='text-fm-gold mx-1'>FmCommonForm</code>, and
                <code className='text-fm-gold mx-1'>
                  FmCommonSearchDropdown
                </code>
              </li>
              <li>
                <strong className='text-foreground'>
                  Specialized Components
                </strong>{' '}
                - Domain-specific implementations that extend base components
                (e.g.,{' '}
                <code className='text-fm-gold'>FmArtistSearchDropdown</code>{' '}
                extends{' '}
                <code className='text-fm-gold'>FmCommonSearchDropdown</code>)
              </li>
              <li>
                <strong className='text-foreground'>Composite Components</strong>{' '}
                - Complex components that compose multiple base components
                (e.g., <code className='text-fm-gold'>FmCommonForm</code> uses{' '}
                <code className='text-fm-gold'>FmCommonFormField</code>,
                <code className='text-fm-gold'>FmCommonFormSection</code>,
                etc.)
              </li>
            </ul>
          </section>

          <section>
            <h4 className='text-lg font-semibold text-foreground mb-2'>
              Naming Conventions
            </h4>
            <p className='mb-3'>All components follow a strict naming pattern:</p>
            <ul className='list-disc list-inside space-y-2 ml-4'>
              <li>
                <code className='text-fm-gold'>FmCommon*</code> - Universal
                components used across all features
              </li>
              <li>
                <code className='text-fm-gold'>Fm[Domain]*</code> -
                Domain-specific components (e.g.,{' '}
                <code className='text-fm-gold'>FmArtistSearchDropdown</code>)
              </li>
              <li>
                All component names are PascalCase and prefixed with "Fm" to
                avoid naming conflicts
              </li>
            </ul>
          </section>

          <section>
            <h4 className='text-lg font-semibold text-foreground mb-2'>
              Categories
            </h4>
            <p className='mb-3'>
              All components are part of the unified FmCommon component system
              and organized into logical categories (see sidebar):
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 ml-4'>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Buttons</strong>
                <p className='text-sm mt-1'>
                  Action buttons, creation buttons, navigation buttons
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Cards & Display</strong>
                <p className='text-sm mt-1'>
                  Cards, badges, stats, headers, and structured information
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Data</strong>
                <p className='text-sm mt-1'>
                  Tables, lists, tabs, and data display components
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Display</strong>
                <p className='text-sm mt-1'>Avatars and user photos</p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Feedback</strong>
                <p className='text-sm mt-1'>Toasts, spinners, error displays</p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Form Inputs</strong>
                <p className='text-sm mt-1'>
                  Individual input components with validation
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Form System</strong>
                <p className='text-sm mt-1'>
                  Complete form system with react-hook-form and Zod
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Layout</strong>
                <p className='text-sm mt-1'>Grid and stack layout components</p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Modals</strong>
                <p className='text-sm mt-1'>
                  Dialogs, confirmations, and modal windows
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Navigation</strong>
                <p className='text-sm mt-1'>Back buttons and sidebar navigation</p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Search</strong>
                <p className='text-sm mt-1'>
                  Autocomplete search dropdowns for various entities
                </p>
              </div>
              <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                <strong className='text-foreground'>Miscellaneous</strong>
                <p className='text-sm mt-1'>
                  Backgrounds, promo codes, and utility components
                </p>
              </div>
            </div>
          </section>

          <section>
            <h4 className='text-lg font-semibold text-foreground mb-2'>
              Design Principles
            </h4>
            <ul className='list-disc list-inside space-y-2 ml-4'>
              <li>
                <strong className='text-foreground'>Consistency</strong> - All
                components share common sizing, spacing, and color schemes
              </li>
              <li>
                <strong className='text-foreground'>Accessibility</strong> -
                Built with ARIA attributes and keyboard navigation support
              </li>
              <li>
                <strong className='text-foreground'>Type Safety</strong> - Full
                TypeScript support with strict prop types
              </li>
              <li>
                <strong className='text-foreground'>Composability</strong> -
                Components are designed to work together seamlessly
              </li>
              <li>
                <strong className='text-foreground'>Performance</strong> -
                Optimized for minimal re-renders and bundle size
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
