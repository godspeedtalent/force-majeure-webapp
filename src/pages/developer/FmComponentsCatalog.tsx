import { useState } from 'react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { ComponentRelationshipGraph } from '@/components/demo/ComponentRelationshipGraph';
import {
  Calendar,
  DollarSign,
  Heart,
  MapPin,
  Music,
  Tag,
  TrendingUp,
  User,
  Users,
  Layout,
  FormInput,
  Navigation,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Network,
  BookOpen,
  MousePointerClick,
  Table,
  Eye,
  MessageSquare,
  Sparkles,
  Search,
  Box,
  LayoutGrid,
} from 'lucide-react';
import { z } from 'zod';

// Import all FmCommon components
import {
  FmBadge,
  FmCommonIconWithText,
  FmCommonPriceDisplay,
  FmCommonBadgeGroup,
  FmCommonInfoCard,
  FmCommonStatCard,
  FmCommonPageHeader,
  FmCommonDetailSection,
  FmCommonForm,
  FmCommonFormSection,
  FmCommonFormField,
  FmCommonFormSelect,
  FmCommonFormActions,
  FmCommonGridLayout,
  FmCommonStackLayout,
  FmCommonConfirmDialog,
  FmCommonBackButton,
} from '@/components/common';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';

// Buttons
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCreateButton } from '@/components/common/buttons/FmCommonCreateButton';
import { FmCommonNavigationButton } from '@/components/common/buttons/FmCommonNavigationButton';

// Search
import { FmCommonSearchDropdown } from '@/components/common/search/FmCommonSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCitySearchDropdown } from '@/components/common/search/FmCitySearchDropdown';

// Forms
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { PasswordInput } from '@/components/common/forms/PasswordInput';

// Data
import { FmCommonList } from '@/components/common/data/FmCommonList';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';

// Display
import { FmCommonUserPhoto } from '@/components/common/display/FmCommonUserPhoto';
import { FmAnimatedGradientAvatar } from '@/components/common/display/FmAnimatedGradientAvatar';

// Feedback
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmErrorDisplay } from '@/components/common/feedback/FmErrorDisplay';

// Modals
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';

// Misc
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmPromoCodeInput } from '@/components/common/misc/FmPromoCodeInput';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Separator } from '@/components/common/shadcn/separator';
import type { FmCommonBadgeItem } from '@/components/common';
import type { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';

// Component category type
type ComponentCategory =
  | 'overview'
  | 'relationships'
  | 'buttons'
  | 'forms'
  | 'search'
  | 'data'
  | 'display'
  | 'feedback'
  | 'modals'
  | 'navigation'
  | 'misc'
  | 'common-display'
  | 'common-layout'
  | 'common-forms';

interface ComponentSectionProps {
  name: string;
  description: string;
  caveats?: string[];
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

function ComponentSection({
  name,
  description,
  caveats,
  children,
  defaultOpen = false,
  id,
}: ComponentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className='border-border' id={id}>
      <CardHeader
        className='cursor-pointer hover:bg-accent/5 transition-colors'
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <div className='flex items-center gap-2'>
              {isOpen ? (
                <ChevronDown className='h-5 w-5 text-muted-foreground' />
              ) : (
                <ChevronRight className='h-5 w-5 text-muted-foreground' />
              )}
              <CardTitle className='font-mono text-lg'>{name}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
            {caveats && caveats.length > 0 && (
              <div className='flex items-start gap-2 text-sm text-yellow-500/80'>
                <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                <div className='space-y-1'>
                  {caveats.map((caveat, idx) => (
                    <p key={idx}>{caveat}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className='pt-6 space-y-6'>{children}</CardContent>
      )}
    </Card>
  );
}

interface ComponentGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

function ComponentGroup({
  title,
  children,
  defaultOpen = true,
  id,
}: ComponentGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='space-y-4' id={id}>
      <div
        className='flex items-center gap-2 cursor-pointer group py-2'
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className='h-5 w-5 text-fm-gold transition-transform' />
        ) : (
          <ChevronRight className='h-5 w-5 text-fm-gold transition-transform' />
        )}
        <h3 className='text-xl font-canela font-semibold text-foreground group-hover:text-fm-gold transition-colors'>
          {title}
        </h3>
      </div>
      {isOpen && <div className='space-y-4 ml-7'>{children}</div>}
      <Separator className='mt-6' />
    </div>
  );
}

export default function FmComponentsCatalog() {
  const [activeCategory, setActiveCategory] =
    useState<ComponentCategory>('overview');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sample data
  const sampleBadges: FmCommonBadgeItem[] = [
    { label: 'Electronic', variant: 'primary' },
    { label: 'House', variant: 'secondary' },
    { label: 'Techno', variant: 'secondary' },
  ];

  const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Role is required'),
    bio: z.string().optional(),
  });

  // Navigation structure
  const navigationGroups: FmCommonSideNavGroup<ComponentCategory>[] = [
    {
      label: 'Documentation',
      icon: BookOpen,
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          description: 'Component system philosophy',
        },
        {
          id: 'relationships',
          label: 'Relationships',
          icon: Network,
          description: 'Component architecture',
        },
      ],
    },
    {
      label: 'Components',
      icon: LayoutGrid,
      items: [
        {
          id: 'buttons',
          label: 'Buttons',
          icon: MousePointerClick,
          description: 'Action buttons',
        },
        {
          id: 'common-display',
          label: 'Cards & Display',
          icon: Info,
          description: 'Cards, badges, stats',
        },
        {
          id: 'data',
          label: 'Data',
          icon: Table,
          description: 'Tables and lists',
        },
        {
          id: 'display',
          label: 'Display',
          icon: Eye,
          description: 'Avatars and photos',
        },
        {
          id: 'feedback',
          label: 'Feedback',
          icon: MessageSquare,
          description: 'Toasts and spinners',
        },
        {
          id: 'forms',
          label: 'Form Inputs',
          icon: FormInput,
          description: 'Input components',
        },
        {
          id: 'common-forms',
          label: 'Form System',
          icon: FormInput,
          description: 'Complete form system',
        },
        {
          id: 'common-layout',
          label: 'Layout',
          icon: Layout,
          description: 'Grids and stacks',
        },
        {
          id: 'modals',
          label: 'Modals',
          icon: Layout,
          description: 'Dialogs and modals',
        },
        {
          id: 'navigation',
          label: 'Navigation',
          icon: Navigation,
          description: 'Navigation components',
        },
        {
          id: 'search',
          label: 'Search',
          icon: Search,
          description: 'Search dropdowns',
        },
        {
          id: 'misc',
          label: 'Miscellaneous',
          icon: Sparkles,
          description: 'Utility components',
        },
      ],
    },
  ];

  // Render content based on active category
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'overview':
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
                    designed to provide a standardized interface while
                    maintaining the flexibility needed for diverse use cases
                    across the application.
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
                      <strong className='text-foreground'>
                        Base Components
                      </strong>{' '}
                      - Core building blocks like
                      <code className='text-fm-gold mx-1'>FmCommonButton</code>,
                      <code className='text-fm-gold mx-1'>FmCommonForm</code>,
                      and
                      <code className='text-fm-gold mx-1'>
                        FmCommonSearchDropdown
                      </code>
                    </li>
                    <li>
                      <strong className='text-foreground'>
                        Specialized Components
                      </strong>{' '}
                      - Domain-specific implementations that extend base
                      components (e.g.,{' '}
                      <code className='text-fm-gold'>
                        FmArtistSearchDropdown
                      </code>{' '}
                      extends{' '}
                      <code className='text-fm-gold'>
                        FmCommonSearchDropdown
                      </code>
                      )
                    </li>
                    <li>
                      <strong className='text-foreground'>
                        Composite Components
                      </strong>{' '}
                      - Complex components that compose multiple base components
                      (e.g., <code className='text-fm-gold'>FmCommonForm</code>{' '}
                      uses{' '}
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
                  <p className='mb-3'>
                    All components follow a strict naming pattern:
                  </p>
                  <ul className='list-disc list-inside space-y-2 ml-4'>
                    <li>
                      <code className='text-fm-gold'>FmCommon*</code> -
                      Universal components used across all features
                    </li>
                    <li>
                      <code className='text-fm-gold'>Fm[Domain]*</code> -
                      Domain-specific components (e.g.,{' '}
                      <code className='text-fm-gold'>
                        FmArtistSearchDropdown
                      </code>
                      )
                    </li>
                    <li>
                      All component names are PascalCase and prefixed with "Fm"
                      to avoid naming conflicts
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className='text-lg font-semibold text-foreground mb-2'>
                    Categories
                  </h4>
                  <p className='mb-3'>
                    All components are part of the unified FmCommon component
                    system and organized into logical categories (see sidebar):
                  </p>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 ml-4'>
                    <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                      <strong className='text-foreground'>Buttons</strong>
                      <p className='text-sm mt-1'>
                        Action buttons, creation buttons, navigation buttons
                      </p>
                    </div>
                    <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                      <strong className='text-foreground'>
                        Cards & Display
                      </strong>
                      <p className='text-sm mt-1'>
                        Cards, badges, stats, headers, and structured
                        information
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
                      <p className='text-sm mt-1'>
                        Toasts, spinners, error displays
                      </p>
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
                      <p className='text-sm mt-1'>
                        Grid and stack layout components
                      </p>
                    </div>
                    <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                      <strong className='text-foreground'>Modals</strong>
                      <p className='text-sm mt-1'>
                        Dialogs, confirmations, and modal windows
                      </p>
                    </div>
                    <div className='p-4 bg-slate-900/50 rounded-lg border border-slate-700'>
                      <strong className='text-foreground'>Navigation</strong>
                      <p className='text-sm mt-1'>
                        Back buttons and sidebar navigation
                      </p>
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
                      <strong className='text-foreground'>Consistency</strong> -
                      All components share common sizing, spacing, and color
                      schemes
                    </li>
                    <li>
                      <strong className='text-foreground'>Accessibility</strong>{' '}
                      - Built with ARIA attributes and keyboard navigation
                      support
                    </li>
                    <li>
                      <strong className='text-foreground'>Type Safety</strong> -
                      Full TypeScript support with strict prop types
                    </li>
                    <li>
                      <strong className='text-foreground'>Composability</strong>{' '}
                      - Components are designed to work together seamlessly
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

      case 'relationships':
        return (
          <div className='space-y-6'>
            <div className='p-6 bg-muted/30 rounded-lg border border-border'>
              <h3 className='text-xl font-canela font-semibold mb-2 text-fm-gold'>
                Component Architecture Overview
              </h3>
              <p className='text-muted-foreground'>
                This interactive graph visualizes the relationships between all
                FmCommon components. Larger dots represent base components,
                while lines show inheritance (dashed gold) and composition
                (dotted gray) relationships. Hover over components to see
                details.
              </p>
            </div>
            <ComponentRelationshipGraph />
          </div>
        );

      case 'buttons':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Button Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Action buttons with ripple effects, loading states, and icon
              support. All buttons use shadcn/ui primitives as their base.
            </p>

            <ComponentSection
              name='FmCommonButton'
              description='Base button component with ripple effects, loading states, and icon support. Variants: default (outlined with gold hover), secondary (ghost/minimal), gold (solid gold), destructive. Composed of: Button (shadcn), FmCommonLoadingSpinner (for loading state). FmCommonCreateButton extends this component.'
              defaultOpen
            >
              <div className='space-y-4'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <FmCommonButton variant='default'>Default</FmCommonButton>
                  <FmCommonButton variant='secondary'>Secondary</FmCommonButton>
                  <FmCommonButton variant='gold'>Gold</FmCommonButton>
                  <FmCommonButton variant='destructive'>
                    Destructive
                  </FmCommonButton>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  <FmCommonButton icon={Heart} iconPosition='left'>
                    With Icon
                  </FmCommonButton>
                  <FmCommonButton icon={Music} iconPosition='right'>
                    Icon Right
                  </FmCommonButton>
                  <FmCommonButton loading>Loading...</FmCommonButton>
                </div>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonCreateButton'
              description='Specialized button for create new actions. Always includes a Plus icon. Extends FmCommonButton.'
            >
              <div className='space-y-4'>
                <FmCommonCreateButton
                  label='Create New Event'
                  onClick={() => console.log('Create event')}
                />
                <FmCommonCreateButton
                  label='Add Artist'
                  onClick={() => console.log('Create artist')}
                  variant='default'
                />
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonNavigationButton'
              description='Navigation button for page transitions with consistent styling.'
            >
              <div className='space-y-4'>
                <FmCommonNavigationButton to='/developer/demo'>
                  Go to Demo
                </FmCommonNavigationButton>
                <FmCommonNavigationButton to='/events' variant='default'>
                  View Events
                </FmCommonNavigationButton>
              </div>
            </ComponentSection>
          </div>
        );

      case 'forms':
        return (
          <div className='space-y-6'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Form Input Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Input components for forms with validation, labels, and error
              handling.
            </p>

            <ComponentGroup title='Text Inputs' id='text-inputs' defaultOpen>
              <ComponentSection
                name='FmCommonTextField'
                description='Enhanced text input/textarea with labels, validation, and focus animations.'
                defaultOpen
              >
                <div className='space-y-4 max-w-md'>
                  <FmCommonTextField
                    label='Name'
                    placeholder='Enter your name'
                    value=''
                    onChange={() => {}}
                  />
                  <FmCommonTextField
                    label='Email'
                    type='email'
                    placeholder='you@example.com'
                    value=''
                    onChange={() => {}}
                  />
                  <FmCommonTextField
                    label='Bio'
                    placeholder='Tell us about yourself...'
                    value=''
                    onChange={() => {}}
                    multiline
                    rows={4}
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='PasswordInput'
                description='Password field with show/hide toggle.'
              >
                <div className='max-w-md'>
                  <PasswordInput
                    placeholder='Enter password'
                    value=''
                    onChange={() => {}}
                  />
                </div>
              </ComponentSection>
            </ComponentGroup>

            <ComponentGroup
              title='Selection Inputs'
              id='selection-inputs'
              defaultOpen
            >
              <ComponentSection
                name='FmCommonSelect'
                description='Select dropdown component with consistent styling.'
                defaultOpen
              >
                <div className='max-w-md'>
                  <FmCommonSelect
                    label='Role'
                    value=''
                    onChange={() => {}}
                    options={[
                      { value: 'artist', label: 'Artist' },
                      { value: 'promoter', label: 'Promoter' },
                      { value: 'venue', label: 'Venue Owner' },
                      { value: 'fan', label: 'Fan' },
                    ]}
                    placeholder='Select a role'
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonCheckbox'
                description='Checkbox input with label support.'
              >
                <div className='space-y-3'>
                  <FmCommonCheckbox label='Accept terms and conditions' />
                  <FmCommonCheckbox label='Subscribe to newsletter' />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonToggle'
                description='Toggle switch component for boolean values.'
              >
                <div className='space-y-3'>
                  <FmCommonToggle label='Enable notifications' />
                  <FmCommonToggle label='Dark mode' />
                </div>
              </ComponentSection>
            </ComponentGroup>

            <ComponentGroup
              title='Date/Time Inputs'
              id='datetime-inputs'
              defaultOpen
            >
              <ComponentSection
                name='FmCommonDatePicker'
                description='Date selection component with calendar popup.'
                defaultOpen
              >
                <div className='max-w-md'>
                  <FmCommonDatePicker
                    label='Event Date'
                    value={new Date()}
                    onChange={() => {}}
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonTimePicker'
                description='Time selection component.'
              >
                <div className='max-w-md'>
                  <FmCommonTimePicker
                    label='Start Time'
                    value='19:00'
                    onChange={() => {}}
                  />
                </div>
              </ComponentSection>
            </ComponentGroup>
          </div>
        );

      case 'search':
        return (
          <div className='space-y-6'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Search Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Autocomplete search dropdowns for various entities. All
              specialized components extend FmCommonSearchDropdown.
            </p>

            <ComponentSection
              name='FmCommonSearchDropdown'
              description='Base search dropdown with async search capability. Specialized versions exist for Artists, Events, Venues, and Cities. Composed of: Popover, PopoverContent, PopoverTrigger (shadcn), Input (shadcn), FmCommonLoadingSpinner.'
              caveats={[
                'Requires async onSearch function',
                'Specialized versions include Supabase integration',
              ]}
              defaultOpen
              id='base-search'
            >
              <div className='max-w-md'>
                <FmCommonSearchDropdown
                  onChange={(value, label) =>
                    console.log('Selected:', value, label)
                  }
                  onSearch={async query => {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return [
                      { id: '1', label: `Result for "${query}" #1` },
                      { id: '2', label: `Result for "${query}" #2` },
                    ];
                  }}
                  placeholder='Search for anything...'
                />
              </div>
            </ComponentSection>

            <ComponentGroup
              title='Specialized Search Dropdowns'
              id='specialized-search'
              defaultOpen
            >
              <ComponentSection
                name='FmArtistSearchDropdown'
                description='Searches artists from Supabase with image display and recent options. Extends FmCommonSearchDropdown.'
                defaultOpen
              >
                <div className='max-w-md'>
                  <FmArtistSearchDropdown
                    onChange={value => console.log('Selected artist:', value)}
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmEventSearchDropdown'
                description='Searches upcoming events with headliner and venue information. Extends FmCommonSearchDropdown.'
              >
                <div className='max-w-md'>
                  <FmEventSearchDropdown
                    onChange={value => console.log('Selected event:', value)}
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmVenueSearchDropdown'
                description='Searches venues from Supabase with location information. Extends FmCommonSearchDropdown.'
              >
                <div className='max-w-md'>
                  <FmVenueSearchDropdown
                    onChange={value => console.log('Selected venue:', value)}
                  />
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCitySearchDropdown'
                description='Searches cities from Supabase database. Extends FmCommonSearchDropdown.'
              >
                <div className='max-w-md'>
                  <FmCitySearchDropdown
                    onChange={value => console.log('Selected city:', value)}
                  />
                </div>
              </ComponentSection>
            </ComponentGroup>
          </div>
        );

      case 'data':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Data Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Components for displaying structured data, tables, lists, and
              tabs.
            </p>

            <ComponentSection
              name='FmCommonList'
              description='List display component with consistent styling.'
              defaultOpen
            >
              <FmCommonList
                items={[
                  { id: '1', content: 'First item' },
                  { id: '2', content: 'Second item' },
                  { id: '3', content: 'Third item' },
                ]}
                renderItem={item => <div className='p-3'>{item.content}</div>}
              />
            </ComponentSection>

            <ComponentSection
              name='FmCommonTab'
              description='Tabbed content navigation component.'
            >
              <FmCommonTab
                tabs={[
                  {
                    id: 'tab1',
                    label: 'Tab 1',
                    content: <div className='p-4'>Content 1</div>,
                  },
                  {
                    id: 'tab2',
                    label: 'Tab 2',
                    content: <div className='p-4'>Content 2</div>,
                  },
                  {
                    id: 'tab3',
                    label: 'Tab 3',
                    content: <div className='p-4'>Content 3</div>,
                  },
                ]}
              />
            </ComponentSection>

            <ComponentSection
              name='FmCommonCollapsibleSection'
              description='Expandable/collapsible content sections with header and toggle.'
            >
              <FmCommonCollapsibleSection
                title='Click to expand'
                defaultOpen={false}
              >
                <div className='p-4 text-muted-foreground'>
                  This content can be collapsed and expanded.
                </div>
              </FmCommonCollapsibleSection>
            </ComponentSection>

            <ComponentSection
              name='FmCommonDataGrid'
              description='Powerful data table component with sorting, filtering, pagination, inline editing, context menus, and row selection.'
              caveats={[
                'Large component (859 lines)',
                'Technical debt: Should be split into smaller components',
              ]}
            >
              <p className='text-sm text-muted-foreground'>
                See implementation in actual admin pages like User Management or
                Event Management for full examples.
              </p>
            </ComponentSection>
          </div>
        );

      case 'display':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Display Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Visual display components for user photos and avatars.
            </p>

            <ComponentSection
              name='FmCommonUserPhoto'
              description='User profile photo/avatar display with fallback to initials.'
              defaultOpen
            >
              <div className='flex gap-4 items-center'>
                <FmCommonUserPhoto src={undefined} alt='User Name' size='sm' />
                <FmCommonUserPhoto src={undefined} alt='User Name' size='md' />
                <FmCommonUserPhoto src={undefined} alt='User Name' size='lg' />
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmAnimatedGradientAvatar'
              description='Animated gradient avatar with visual appeal and smooth transitions.'
            >
              <div className='flex gap-4 items-center'>
                <FmAnimatedGradientAvatar size='sm' />
                <FmAnimatedGradientAvatar size='md' />
                <FmAnimatedGradientAvatar size='lg' />
              </div>
            </ComponentSection>
          </div>
        );

      case 'feedback':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Feedback Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              User feedback components for loading states, errors, and
              notifications.
            </p>

            <ComponentSection
              name='FmCommonLoadingSpinner'
              description='Loading/spinner animation for async operations.'
              defaultOpen
            >
              <div className='flex gap-6 items-center'>
                <div className='space-y-2 text-center'>
                  <FmCommonLoadingSpinner size='sm' />
                  <p className='text-xs text-muted-foreground'>Small</p>
                </div>
                <div className='space-y-2 text-center'>
                  <FmCommonLoadingSpinner size='md' />
                  <p className='text-xs text-muted-foreground'>Medium</p>
                </div>
                <div className='space-y-2 text-center'>
                  <FmCommonLoadingSpinner size='lg' />
                  <p className='text-xs text-muted-foreground'>Large</p>
                </div>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonLoadingOverlay'
              description='Full-screen loading overlay with spinner. Used for async operations that block interaction.'
            >
              <div className='space-y-4'>
                <Button
                  onClick={() => {
                    setLoadingOverlay(true);
                    setTimeout(() => setLoadingOverlay(false), 2000);
                  }}
                >
                  Show Loading Overlay (2s)
                </Button>
                {loadingOverlay && (
                  <FmCommonLoadingOverlay message='Loading demo...' />
                )}
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmErrorDisplay'
              description='Error message display component with consistent styling.'
            >
              <FmErrorDisplay
                error={{ message: 'This is a sample error message' }}
                title='Error Occurred'
              />
            </ComponentSection>
          </div>
        );

      case 'modals':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Modal Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Dialog and modal components for user interactions and
              confirmations.
            </p>

            <ComponentSection
              name='FmCommonModal'
              description='Base modal dialog component with header, content, and footer sections.'
              defaultOpen
            >
              <div className='space-y-4'>
                <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                <FmCommonModal
                  isOpen={modalOpen}
                  onClose={() => setModalOpen(false)}
                  title='Sample Modal'
                >
                  <div className='p-4'>
                    <p className='text-muted-foreground'>
                      This is modal content.
                    </p>
                  </div>
                </FmCommonModal>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonConfirmDialog'
              description='Confirmation dialog for important or destructive actions. Supports different variants (default, destructive, warning). Composed of: AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle (shadcn).'
            >
              <div className='space-y-4'>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  variant='destructive'
                >
                  Delete Item
                </Button>
                <FmCommonConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title='Delete Event'
                  description='Are you sure you want to delete this event? This action cannot be undone.'
                  confirmText='Delete'
                  cancelText='Cancel'
                  onConfirm={() => {
                    console.log('Confirmed!');
                    setConfirmOpen(false);
                  }}
                  variant='destructive'
                />
              </div>
            </ComponentSection>
          </div>
        );

      case 'navigation':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Navigation Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Navigation components for page transitions and back buttons.
            </p>

            <ComponentSection
              name='FmCommonBackButton'
              description='Navigation button for going back. Can use browser history or navigate to a specific path. Composed of: Button (shadcn).'
              defaultOpen
            >
              <div className='space-y-4'>
                <FmCommonBackButton text='Back to Events' />
                <FmCommonBackButton
                  text='Custom Back'
                  to='/developer/demo'
                  variant='default'
                />
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonSideNav'
              description='Collapsible sidebar navigation with grouped items, active states, ripple effects, and icons. Used in SideNavbarLayout.'
            >
              <p className='text-sm text-muted-foreground'>
                See this catalog page's sidebar for a live example of
                FmCommonSideNav in action.
              </p>
            </ComponentSection>
          </div>
        );

      case 'misc':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Miscellaneous Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Utility components for backgrounds, promo codes, and OAuth
              dividers.
            </p>

            <ComponentSection
              name='TopographicBackground'
              description='Decorative topographic pattern background with adjustable opacity.'
              defaultOpen
            >
              <div className='relative h-48 overflow-hidden rounded-lg border border-border'>
                <TopographicBackground opacity={0.5} />
                <div className='relative z-10 flex items-center justify-center h-full'>
                  <p className='text-foreground font-semibold'>
                    Content over topographic background
                  </p>
                </div>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmPromoCodeInput'
              description='Promo/coupon code input with apply button.'
            >
              <div className='max-w-md'>
                <FmPromoCodeInput
                  value=''
                  onChange={() => {}}
                  onApply={() => console.log('Apply promo code')}
                />
              </div>
            </ComponentSection>
          </div>
        );

      case 'common-display':
        return (
          <div className='space-y-6'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Cards & Display Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              High-level display components for cards, badges, stats, and
              structured information.
            </p>

            <ComponentGroup
              title='Badge Components'
              id='badge-components'
              defaultOpen
            >
              <ComponentSection
                name='FmBadge'
                description='Styled badge component for Force Majeure brand. Primary badges are gold with black text (white on hover). Secondary badges have transparent background with white text/border (white fill on hover). Both scale up and glow gold on hover.'
                defaultOpen
              >
                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Primary badge (gold background):
                    </p>
                    <div className='flex gap-3'>
                      <FmBadge label='Featured' variant='primary' />
                      <FmBadge label='VIP' variant='primary' />
                      <FmBadge label='Sold Out' variant='primary' />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Secondary badge (transparent background):
                    </p>
                    <div className='flex gap-3'>
                      <FmBadge label='Electronic' variant='secondary' />
                      <FmBadge label='Techno' variant='secondary' />
                      <FmBadge label='House' variant='secondary' />
                    </div>
                  </div>
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonBadgeGroup'
                description="Display a collection of FmBadge components with automatic overflow handling and expandable '+X more' badge. Great for tags, genres, or categories. Clicking the '+X more' badge expands to show more badges (configurable pageSize, default 5). Composed of: FmBadge components."
              >
                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Standard badge group:
                    </p>
                    <FmCommonBadgeGroup badges={sampleBadges} />
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      With max display (3) and overflow:
                    </p>
                    <FmCommonBadgeGroup
                      badges={[
                        ...sampleBadges,
                        { label: 'Deep House', variant: 'secondary' },
                        { label: 'Progressive', variant: 'primary' },
                        { label: 'Minimal', variant: 'secondary' },
                      ]}
                      maxDisplay={3}
                    />
                  </div>
                </div>
              </ComponentSection>
            </ComponentGroup>

            <ComponentGroup
              title='Display Components'
              id='display-components'
              defaultOpen
            >
              <ComponentSection
                name='FmCommonIconWithText'
                description='Display an icon alongside text with flexible sizing and positioning. Commonly used for inline metadata. Features hover effects: icon and text color turn gold.'
                defaultOpen
              >
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>
                        Small size, left icon:
                      </p>
                      <FmCommonIconWithText
                        icon={MapPin}
                        text='Los Angeles, CA'
                        size='sm'
                      />
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>
                        Medium size, right icon:
                      </p>
                      <FmCommonIconWithText
                        icon={Calendar}
                        text='March 15, 2025'
                        size='md'
                        iconPosition='right'
                      />
                    </div>
                  </div>
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonPriceDisplay'
                description='Consistent price formatting with support for discounts and free items. Amounts are in cents.'
                caveats={['Amounts must be in cents (e.g., 2500 = $25.00)']}
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Regular price:
                    </p>
                    <FmCommonPriceDisplay amountCents={2500} size='lg' />
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      With discount:
                    </p>
                    <FmCommonPriceDisplay
                      amountCents={1500}
                      originalAmountCents={2500}
                      size='lg'
                    />
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>Free:</p>
                    <FmCommonPriceDisplay amountCents={0} size='lg' />
                  </div>
                </div>
              </ComponentSection>
            </ComponentGroup>

            <ComponentGroup
              title='Card Components'
              id='card-components'
              defaultOpen
            >
              <ComponentSection
                name='FmCommonInfoCard'
                description='Card component for displaying key-value information with an icon. Used throughout event details. Composed of: Card and CardContent (shadcn).'
                defaultOpen
              >
                <div className='space-y-4'>
                  <FmCommonGridLayout
                    columns={{ default: 1, md: 2, lg: 3 }}
                    gap='md'
                  >
                    <FmCommonInfoCard
                      icon={Calendar}
                      label='Event Date'
                      value='March 15, 2025'
                      size='md'
                    />
                    <FmCommonInfoCard
                      icon={MapPin}
                      label='Venue'
                      value='The Warehouse'
                      size='md'
                    />
                    <FmCommonInfoCard
                      icon={Users}
                      label='Capacity'
                      value='500 people'
                      size='md'
                    />
                  </FmCommonGridLayout>
                </div>
              </ComponentSection>

              <ComponentSection
                name='FmCommonStatCard'
                description='Dashboard-style stat card with support for trends, badges, and descriptions. Perfect for admin dashboards. Composed of: FmBadge (optional), Card and CardContent (shadcn).'
              >
                <FmCommonGridLayout
                  columns={{ default: 1, md: 2, lg: 3 }}
                  gap='md'
                >
                  <FmCommonStatCard
                    value='1,234'
                    label='Total Tickets Sold'
                    icon={Tag}
                    size='md'
                  />
                  <FmCommonStatCard
                    value='$45,678'
                    label='Total Revenue'
                    icon={DollarSign}
                    badge={{ label: 'This Month', variant: 'secondary' }}
                    size='md'
                  />
                  <FmCommonStatCard
                    value='89%'
                    label='Capacity'
                    icon={TrendingUp}
                    trend={{ value: '+12%', isPositive: true }}
                    description='vs. last event'
                    size='md'
                  />
                </FmCommonGridLayout>
              </ComponentSection>
            </ComponentGroup>

            <ComponentGroup
              title='Page Components'
              id='page-components'
              defaultOpen
            >
              <ComponentSection
                name='FmCommonPageHeader'
                description='Standardized page header with title, description, icon, actions, and optional stats section. Composed of: commonly contains FmCommonStatCard components in stats prop, Separator (shadcn).'
                defaultOpen
              >
                <FmCommonPageHeader
                  title='Event Management'
                  icon={Calendar}
                  description='View and manage all upcoming events'
                  actions={<Button variant='outline'>Create Event</Button>}
                  stats={
                    <FmCommonGridLayout
                      columns={{ default: 1, md: 3 }}
                      gap='sm'
                    >
                      <FmCommonStatCard
                        value='12'
                        label='Upcoming Events'
                        size='sm'
                      />
                      <FmCommonStatCard
                        value='345'
                        label='Tickets Sold'
                        size='sm'
                      />
                      <FmCommonStatCard
                        value='$8,950'
                        label='Revenue'
                        size='sm'
                      />
                    </FmCommonGridLayout>
                  }
                />
              </ComponentSection>

              <ComponentSection
                name='FmCommonDetailSection'
                description='Section component for grouping related content with a title (using Canela font), description, icon, and optional actions. Commonly uses FmCommonIconWithText components in its children for displaying structured detail lists. Composed of: Separator (shadcn), commonly contains FmCommonIconWithText components.'
              >
                <FmCommonDetailSection
                  title='Event Details'
                  description='Core information about this event'
                  icon={Info}
                  showSeparator={true}
                  actions={
                    <Button variant='ghost' size='sm'>
                      Edit
                    </Button>
                  }
                >
                  <div className='space-y-4'>
                    <FmCommonIconWithText
                      icon={Calendar}
                      text='March 15, 2025'
                    />
                    <FmCommonIconWithText
                      icon={MapPin}
                      text='The Warehouse, Los Angeles'
                    />
                    <FmCommonIconWithText
                      icon={Music}
                      text='Charlotte de Witte'
                    />
                  </div>
                </FmCommonDetailSection>
              </ComponentSection>
            </ComponentGroup>
          </div>
        );

      case 'common-layout':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Layout Components
            </h2>
            <p className='text-muted-foreground mb-6'>
              Layout components for organizing content with consistent spacing
              and responsive grids.
            </p>

            <ComponentSection
              name='FmCommonGridLayout'
              description='Responsive grid layout with configurable columns at different breakpoints. Provides consistent spacing.'
              defaultOpen
            >
              <div className='space-y-6'>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    2 columns on md, 4 on lg:
                  </p>
                  <FmCommonGridLayout
                    columns={{ default: 1, md: 2, lg: 4 }}
                    gap='md'
                  >
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className='p-4 bg-accent/10 rounded-lg text-center'
                      >
                        Item {i}
                      </div>
                    ))}
                  </FmCommonGridLayout>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    3 columns on lg with large gap:
                  </p>
                  <FmCommonGridLayout
                    columns={{ default: 1, md: 2, lg: 3 }}
                    gap='lg'
                  >
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div
                        key={i}
                        className='p-6 bg-accent/10 rounded-lg text-center'
                      >
                        Item {i}
                      </div>
                    ))}
                  </FmCommonGridLayout>
                </div>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonStackLayout'
              description='Vertical stack layout with consistent spacing. Supports dividers and alignment options.'
            >
              <div className='space-y-6'>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Standard stack with medium spacing:
                  </p>
                  <FmCommonStackLayout spacing='md'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='p-4 bg-accent/10 rounded-lg'>
                        Stack Item {i}
                      </div>
                    ))}
                  </FmCommonStackLayout>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Stack with dividers and large spacing:
                  </p>
                  <FmCommonStackLayout spacing='lg' dividers>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='p-4 bg-accent/10 rounded-lg'>
                        Divided Item {i}
                      </div>
                    ))}
                  </FmCommonStackLayout>
                </div>
              </div>
            </ComponentSection>

            <ComponentSection
              name='FmCommonCard'
              description='Versatile card component with two variants: default (frosted glass with gradient background) and outline (clean bordered style). Both include smooth hover effects and support interactive states.'
            >
              <div className='space-y-6'>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Default variant (frosted glass):
                  </p>
                  <FmCommonGridLayout columns={{ default: 1, md: 2 }} gap='md'>
                    <FmCommonCard variant='default' size='md'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Calendar className='h-5 w-5 text-fm-gold' />
                        <h3 className='font-canela text-lg'>Event Details</h3>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        This card uses the classic frosted glass effect with
                        gradient background. Perfect for feature sections and
                        highlighted content.
                      </p>
                    </FmCommonCard>
                    <FmCommonCard
                      variant='default'
                      size='md'
                      onClick={() => console.log('Clicked!')}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <User className='h-5 w-5 text-fm-gold' />
                        <h3 className='font-canela text-lg'>Clickable Card</h3>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        This card is interactive with onClick handler. Notice
                        the enhanced hover scale effect.
                      </p>
                    </FmCommonCard>
                  </FmCommonGridLayout>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Outline variant (clean border):
                  </p>
                  <FmCommonGridLayout columns={{ default: 1, md: 2 }} gap='md'>
                    <FmCommonCard variant='outline' size='md'>
                      <div className='flex items-center gap-2 mb-2'>
                        <MapPin className='h-5 w-5 text-fm-gold' />
                        <h3 className='font-canela text-lg'>
                          Billing Information
                        </h3>
                      </div>
                      <div className='space-y-2 text-sm text-muted-foreground'>
                        <p>123 Main St</p>
                        <p>New York, NY 10001</p>
                      </div>
                    </FmCommonCard>
                    <FmCommonCard
                      variant='outline'
                      size='md'
                      onClick={() => console.log('Outline clicked!')}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <Tag className='h-5 w-5 text-fm-gold' />
                        <h3 className='font-canela text-lg'>
                          Interactive Outline
                        </h3>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        Outline cards work great for forms and input sections.
                        Subtle hover effects with gold accents.
                      </p>
                    </FmCommonCard>
                  </FmCommonGridLayout>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Size variants:
                  </p>
                  <FmCommonStackLayout spacing='md'>
                    <FmCommonCard variant='outline' size='sm'>
                      <p className='text-sm'>Small card (sm padding)</p>
                    </FmCommonCard>
                    <FmCommonCard variant='outline' size='md'>
                      <p className='text-sm'>
                        Medium card (md padding - default)
                      </p>
                    </FmCommonCard>
                    <FmCommonCard variant='outline' size='lg'>
                      <p className='text-sm'>Large card (lg padding)</p>
                    </FmCommonCard>
                  </FmCommonStackLayout>
                </div>
              </div>
            </ComponentSection>
          </div>
        );

      case 'common-forms':
        return (
          <div className='space-y-4'>
            <h2 className='text-2xl font-canela font-semibold text-fm-gold'>
              FmCommon Form System
            </h2>
            <p className='text-muted-foreground mb-6'>
              Complete form system with react-hook-form integration, Zod
              validation, and standardized layouts.
            </p>

            <ComponentSection
              name='FmCommonForm'
              description='Complete form wrapper with react-hook-form and Zod validation. Provides form state and validation handling. Composed of: commonly contains FmCommonFormSection, FmCommonFormField, FmCommonFormSelect, FmCommonFormActions, and FmCommonStackLayout components.'
              caveats={[
                'Requires Zod schema for validation',
                'Children receive form methods as render prop',
              ]}
              defaultOpen
            >
              <FmCommonForm
                schema={formSchema}
                defaultValues={{ name: '', email: '', role: '', bio: '' }}
                onSubmit={data => {
                  setFormValues(data);
                  console.log('Form submitted:', data);
                }}
              >
                {form => (
                  <FmCommonStackLayout spacing='lg'>
                    <FmCommonFormSection
                      title='Personal Information'
                      description='Enter your basic details'
                      icon={User}
                      layout='grid-2'
                    >
                      <FmCommonFormField
                        form={form}
                        name='name'
                        label='Full Name'
                        placeholder='John Doe'
                        required
                      />
                      <FmCommonFormField
                        form={form}
                        name='email'
                        label='Email'
                        type='email'
                        placeholder='john@example.com'
                        required
                      />
                    </FmCommonFormSection>

                    <FmCommonFormSection
                      title='Professional Details'
                      description='Tell us about your role'
                      layout='stack'
                    >
                      <FmCommonFormSelect
                        form={form}
                        name='role'
                        label='Role'
                        placeholder='Select a role'
                        options={[
                          { value: 'artist', label: 'Artist' },
                          { value: 'promoter', label: 'Promoter' },
                          { value: 'venue', label: 'Venue Owner' },
                          { value: 'fan', label: 'Fan' },
                        ]}
                        required
                      />
                      <FmCommonFormField
                        form={form}
                        name='bio'
                        label='Bio'
                        textarea
                        rows={4}
                        placeholder='Tell us about yourself...'
                      />
                    </FmCommonFormSection>

                    <FmCommonFormActions
                      submitText='Save Profile'
                      showCancel
                      cancelText='Reset'
                      onCancel={() => form.reset()}
                      isSubmitting={form.formState.isSubmitting}
                      align='right'
                    />
                  </FmCommonStackLayout>
                )}
              </FmCommonForm>
              {formValues && (
                <div className='mt-4 p-4 bg-muted/50 rounded-lg'>
                  <p className='text-sm font-semibold mb-2'>Last Submission:</p>
                  <pre className='text-xs'>
                    {JSON.stringify(formValues, null, 2)}
                  </pre>
                </div>
              )}
            </ComponentSection>

            <ComponentSection
              name='FmCommonFormSection'
              description='Groups form fields with a title, description, and icon. Supports multiple layout options (stack, grid-2, grid-3). Composed of: commonly contains FmCommonFormField and FmCommonFormSelect components.'
            >
              <p className='text-sm text-muted-foreground'>
                See example in FmCommonForm above ↑
              </p>
            </ComponentSection>

            <ComponentSection
              name='FmCommonFormField'
              description='Individual form field with validation, error display, and support for text inputs and textareas.'
            >
              <p className='text-sm text-muted-foreground'>
                See example in FmCommonForm above ↑
              </p>
            </ComponentSection>

            <ComponentSection
              name='FmCommonFormSelect'
              description='Dropdown select field integrated with react-hook-form. Supports disabled options and custom placeholders.'
            >
              <p className='text-sm text-muted-foreground'>
                See example in FmCommonForm above ↑
              </p>
            </ComponentSection>

            <ComponentSection
              name='FmCommonFormActions'
              description='Standard form action buttons (submit, cancel, reset) with loading states and flexible alignment.'
            >
              <p className='text-sm text-muted-foreground'>
                See example in FmCommonForm above ↑
              </p>
            </ComponentSection>
          </div>
        );

      default:
        return <div>Select a category from the sidebar</div>;
    }
  };

  // Mobile horizontal tabs
  const mobileTabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'relationships', label: 'Relations', icon: Network },
    { id: 'buttons', label: 'Buttons', icon: MousePointerClick },
    { id: 'forms', label: 'Forms', icon: FormInput },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'data', label: 'Data', icon: Table },
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'modals', label: 'Modals', icon: AlertCircle },
    { id: 'navigation', label: 'Nav', icon: Navigation },
    { id: 'misc', label: 'Misc', icon: Sparkles },
  ];

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeCategory}
      onItemChange={setActiveCategory}
      showDividers
      defaultOpen
      backgroundOpacity={0.25}
    >
      {/* Mobile horizontal tabs */}
      <MobileHorizontalTabs
        tabs={mobileTabs}
        activeTab={activeCategory}
        onTabChange={tab => setActiveCategory(tab as ComponentCategory)}
      />

      <div className='space-y-6'>
        <div className='mb-8'>
          <h1 className='text-4xl font-canela text-fm-gold mb-2'>
            Component Catalog
          </h1>
          <p className='text-muted-foreground text-lg'>
            Comprehensive catalog of all Force Majeure components with live
            demos and documentation
          </p>
        </div>

        {renderCategoryContent()}
      </div>
    </SideNavbarLayout>
  );
}
