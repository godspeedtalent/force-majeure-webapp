import { useState } from 'react';
import { DemoLayout } from '@/components/demo/DemoLayout';
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
} from '@/components/common/fm';
import { FmCommonLoadingOverlay } from '@/components/common/FmCommonLoadingOverlay';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { FmCommonCreateButton } from '@/components/ui/buttons/FmCommonCreateButton';
import { FmCommonSearchDropdown } from '@/components/ui/search/FmCommonSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/ui/search/FmArtistSearchDropdown';
import { FmEventSearchDropdown } from '@/components/ui/search/FmEventSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/search/FmVenueSearchDropdown';
import { FmCitySearchDropdown } from '@/components/ui/search/FmCitySearchDropdown';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import type { FmCommonBadgeItem } from '@/components/common/fm';

interface ComponentSectionProps {
  name: string;
  description: string;
  caveats?: string[];
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function ComponentSection({ name, description, caveats, children, defaultOpen = false }: ComponentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="border-border">
      <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              <CardTitle className="font-mono text-lg">{name}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
            {caveats && caveats.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-yellow-500/80">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
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
        <CardContent className="pt-6 space-y-6">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CategorySection({ title, icon, children, defaultOpen = false }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <div 
        className="flex items-center gap-3 pb-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="p-2 rounded-lg bg-accent/10">
          {icon}
        </div>
        <h2 className="text-2xl font-canela font-semibold">{title}</h2>
        {isOpen ? (
          <ChevronDown className="h-6 w-6 text-muted-foreground ml-auto" />
        ) : (
          <ChevronRight className="h-6 w-6 text-muted-foreground ml-auto" />
        )}
      </div>
      {isOpen && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FmComponentsCatalog() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);

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

  return (
    <DemoLayout
      title="FM Components Catalog"
      description="Comprehensive catalog of all Force Majeure common components with live demos and documentation"
      icon={Layout}
    >
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="components" className="gap-2">
            <Layout className="h-4 w-4" />
            Component Demos
          </TabsTrigger>
          <TabsTrigger value="relationships" className="gap-2">
            <Network className="h-4 w-4" />
            Relationship Graph
          </TabsTrigger>
          <TabsTrigger value="documentation" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="mt-0">
          <div className="space-y-6 max-w-4xl">
            <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-border shadow-xl">
              <h3 className="text-2xl font-canela font-semibold mb-4 text-fm-gold">FM Component System</h3>
              
              <div className="space-y-6 text-muted-foreground">
                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Philosophy</h4>
                  <p>
                    The Force Majeure component system is built on principles of consistency, reusability, and developer 
                    experience. Every <code className="text-fm-gold">FmCommon</code> component is designed to provide a 
                    standardized interface while maintaining the flexibility needed for diverse use cases across the application.
                  </p>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Component Hierarchy</h4>
                  <p className="mb-3">
                    Our components follow a clear hierarchy with three levels:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-foreground">Base Components</strong> - Core building blocks like 
                      <code className="text-fm-gold mx-1">FmCommonButton</code>, 
                      <code className="text-fm-gold mx-1">FmCommonForm</code>, and 
                      <code className="text-fm-gold mx-1">FmCommonSearchDropdown</code>
                    </li>
                    <li>
                      <strong className="text-foreground">Specialized Components</strong> - Domain-specific implementations that extend base components 
                      (e.g., <code className="text-fm-gold">FmArtistSearchDropdown</code> extends <code className="text-fm-gold">FmCommonSearchDropdown</code>)
                    </li>
                    <li>
                      <strong className="text-foreground">Composite Components</strong> - Complex components that compose multiple base components 
                      (e.g., <code className="text-fm-gold">FmCommonForm</code> uses <code className="text-fm-gold">FmCommonFormField</code>, 
                      <code className="text-fm-gold">FmCommonFormSection</code>, etc.)
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Naming Conventions</h4>
                  <p className="mb-3">
                    All components follow a strict naming pattern:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <code className="text-fm-gold">FmCommon*</code> - Universal components used across all features
                    </li>
                    <li>
                      <code className="text-fm-gold">Fm[Domain]*</code> - Domain-specific components (e.g., <code className="text-fm-gold">FmArtistSearchDropdown</code>)
                    </li>
                    <li>
                      All component names are PascalCase and prefixed with "Fm" to avoid naming conflicts
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Categories</h4>
                  <p className="mb-3">
                    Components are organized into logical categories:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <strong className="text-foreground">Display</strong>
                      <p className="text-sm mt-1">Visual presentation components for showing data (cards, badges, headers)</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <strong className="text-foreground">Forms</strong>
                      <p className="text-sm mt-1">Input components integrated with react-hook-form and Zod validation</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <strong className="text-foreground">Layout</strong>
                      <p className="text-sm mt-1">Structural components for organizing content (grids, stacks)</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                      <strong className="text-foreground">Modals & Navigation</strong>
                      <p className="text-sm mt-1">Interactive UI elements for navigation and confirmations</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Design Principles</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-foreground">Consistency</strong> - All components share common sizing, spacing, and color schemes
                    </li>
                    <li>
                      <strong className="text-foreground">Accessibility</strong> - Built with ARIA attributes and keyboard navigation support
                    </li>
                    <li>
                      <strong className="text-foreground">Type Safety</strong> - Full TypeScript support with strict prop types
                    </li>
                    <li>
                      <strong className="text-foreground">Composability</strong> - Components are designed to work together seamlessly
                    </li>
                    <li>
                      <strong className="text-foreground">Performance</strong> - Optimized for minimal re-renders and bundle size
                    </li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Always use <code className="text-fm-gold">FmCommon</code> components over one-off implementations</li>
                    <li>Extend base components through composition, not duplication</li>
                    <li>Use the provided size variants (sm, md, lg) instead of custom sizing</li>
                    <li>Leverage the <code className="text-fm-gold">className</code> prop for component-specific styling only</li>
                    <li>Check the catalog before creating new components - it might already exist</li>
                    <li>When creating specialized components, follow the established patterns (see <code className="text-fm-gold">FmArtistSearchDropdown</code> as reference)</li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Integration</h4>
                  <p className="mb-3">
                    All components are designed to integrate seamlessly with our tech stack:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-foreground">React Hook Form</strong> - Form components include built-in validation</li>
                    <li><strong className="text-foreground">Zod</strong> - Schema validation is required for all forms</li>
                    <li><strong className="text-foreground">Tailwind CSS</strong> - Styling uses our custom theme tokens</li>
                    <li><strong className="text-foreground">Radix UI</strong> - Accessible primitives power our complex components</li>
                    <li><strong className="text-foreground">Lucide Icons</strong> - Icon system is consistent across all components</li>
                  </ul>
                </section>

                <section className="pt-4 border-t border-border">
                  <h4 className="text-lg font-semibold text-foreground mb-2">Contributing</h4>
                  <p>
                    When adding new components to the system, ensure they follow these guidelines, include proper TypeScript 
                    types, have JSDoc comments, and are added to this catalog with working examples. All new components should 
                    be reviewed by a senior developer to ensure consistency with the existing system.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationships" className="mt-0">
          <div className="space-y-6">
            <div className="p-6 bg-muted/30 rounded-lg border border-border">
              <h3 className="text-xl font-canela font-semibold mb-2 text-fm-gold">Component Architecture Overview</h3>
              <p className="text-muted-foreground">
                This interactive graph visualizes the relationships between all FmCommon components. 
                Larger dots represent base components, while lines show inheritance (dashed gold) and 
                composition (dotted gray) relationships. Hover over components to see details.
              </p>
            </div>
            <ComponentRelationshipGraph />
          </div>
        </TabsContent>

        <TabsContent value="components" className="mt-0">
          <div className="space-y-8">
            {/* Display Components - Alphabetically Sorted */}
            <CategorySection title="Display Components" icon={<Info className="h-5 w-5 text-fm-gold" />} defaultOpen={true}>
              
              {/* FmBadge */}
              <ComponentSection
                name="FmBadge"
                description="Styled badge component for Force Majeure brand. Primary badges are gold with black text (transparent white on hover). Secondary badges have transparent background with white text/border (white fill on hover). Both scale up and glow gold on hover."
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Primary badge (gold background):</p>
                    <div className="flex gap-3">
                      <FmBadge label="Featured" variant="primary" />
                      <FmBadge label="VIP" variant="primary" />
                      <FmBadge label="Sold Out" variant="primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Secondary badge (transparent background):</p>
                    <div className="flex gap-3">
                      <FmBadge label="Electronic" variant="secondary" />
                      <FmBadge label="Techno" variant="secondary" />
                      <FmBadge label="House" variant="secondary" />
                    </div>
                  </div>
                </div>
              </ComponentSection>

              {/* FmCommonBadgeGroup */}
              <ComponentSection
                name="FmCommonBadgeGroup"
                description="Display a collection of FmBadge components with automatic overflow handling. Great for tags, genres, or categories. Uses FmBadge components internally."
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Standard badge group:</p>
                    <FmCommonBadgeGroup badges={sampleBadges} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">With max display (3) and overflow:</p>
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

              {/* FmCommonDetailSection */}
              <ComponentSection
                name="FmCommonDetailSection"
                description="Section component for grouping related content with a title (using Canela font), description, icon, and optional actions. Commonly uses FmCommonIconWithText components in its children for displaying structured detail lists."
              >
                <FmCommonDetailSection
                  title="Event Details"
                  description="Core information about this event"
                  icon={Info}
                  showSeparator={true}
                  actions={
                    <Button variant="ghost" size="sm">Edit</Button>
                  }
                >
                  <div className="space-y-4">
                    <FmCommonIconWithText icon={Calendar} text="March 15, 2025" />
                    <FmCommonIconWithText icon={MapPin} text="The Warehouse, Los Angeles" />
                    <FmCommonIconWithText icon={Music} text="Charlotte de Witte" />
                  </div>
                </FmCommonDetailSection>
              </ComponentSection>

              {/* FmCommonIconWithText */}
              <ComponentSection
                name="FmCommonIconWithText"
                description="Display an icon alongside text with flexible sizing and positioning. Commonly used for inline metadata. Features hover effects: background gently turns gold, and icon/text color turns gold."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Small size, left icon:</p>
                      <FmCommonIconWithText icon={MapPin} text="Los Angeles, CA" size="sm" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Medium size, right icon:</p>
                      <FmCommonIconWithText icon={Calendar} text="March 15, 2025" size="md" iconPosition="right" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Large size, custom styling:</p>
                      <FmCommonIconWithText 
                        icon={Music} 
                        text="Electronic Music" 
                        size="lg" 
                        iconClassName="text-fm-gold"
                        textClassName="font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </ComponentSection>

              {/* FmCommonInfoCard */}
              <ComponentSection
                name="FmCommonInfoCard"
                description="Card component for displaying key-value information with an icon. Used throughout event details."
              >
                <div className="space-y-4">
                  <FmCommonGridLayout columns={{ default: 1, md: 2, lg: 3 }} gap="md">
                    <FmCommonInfoCard
                      icon={Calendar}
                      label="Event Date"
                      value="March 15, 2025"
                      size="md"
                    />
                    <FmCommonInfoCard
                      icon={MapPin}
                      label="Venue"
                      value="The Warehouse"
                      size="md"
                    />
                    <FmCommonInfoCard
                      icon={Users}
                      label="Capacity"
                      value="500 people"
                      size="md"
                    />
                  </FmCommonGridLayout>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Vertical layout, large size:</p>
                    <FmCommonInfoCard
                      icon={Music}
                      label="Headliner"
                      value="Charlotte de Witte"
                      layout="vertical"
                      size="lg"
                      className="max-w-md"
                    />
                  </div>
                </div>
              </ComponentSection>

              {/* FmCommonPageHeader */}
              <ComponentSection
                name="FmCommonPageHeader"
                description="Standardized page header with title, description, icon, actions, and optional stats section."
              >
                <FmCommonPageHeader
                  title="Event Management"
                  icon={Calendar}
                  description="View and manage all upcoming events"
                  actions={
                    <Button variant="outline">
                      Create Event
                    </Button>
                  }
                  stats={
                    <FmCommonGridLayout columns={{ default: 1, md: 3 }} gap="sm">
                      <FmCommonStatCard value="12" label="Upcoming Events" size="sm" />
                      <FmCommonStatCard value="345" label="Tickets Sold" size="sm" />
                      <FmCommonStatCard value="$8,950" label="Revenue" size="sm" />
                    </FmCommonGridLayout>
                  }
                />
              </ComponentSection>

              {/* FmCommonPriceDisplay */}
              <ComponentSection
                name="FmCommonPriceDisplay"
                description="Consistent price formatting with support for discounts and free items. Amounts are in cents."
                caveats={["Amounts must be in cents (e.g., 2500 = $25.00)"]}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Regular price:</p>
                    <FmCommonPriceDisplay amountCents={2500} size="lg" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">With discount:</p>
                    <FmCommonPriceDisplay 
                      amountCents={1500} 
                      originalAmountCents={2500}
                      size="lg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Free:</p>
                    <FmCommonPriceDisplay amountCents={0} size="lg" />
                  </div>
                </div>
              </ComponentSection>

              {/* FmCommonStatCard */}
              <ComponentSection
                name="FmCommonStatCard"
                description="Dashboard-style stat card with support for trends, badges, and descriptions. Perfect for admin dashboards."
              >
                <FmCommonGridLayout columns={{ default: 1, md: 2, lg: 3 }} gap="md">
                  <FmCommonStatCard
                    value="1,234"
                    label="Total Tickets Sold"
                    icon={Tag}
                    size="md"
                  />
                  <FmCommonStatCard
                    value="$45,678"
                    label="Total Revenue"
                    icon={DollarSign}
                    badge={{ label: 'This Month', variant: 'secondary' }}
                    size="md"
                  />
                  <FmCommonStatCard
                    value="89%"
                    label="Capacity"
                    icon={TrendingUp}
                    trend={{ value: '+12%', isPositive: true }}
                    description="vs. last event"
                    size="md"
                  />
                </FmCommonGridLayout>
              </ComponentSection>
            </CategorySection>

            <Separator className="my-8" />

            {/* Form Components - Alphabetically Sorted */}
            <CategorySection title="Form Components" icon={<FormInput className="h-5 w-5 text-fm-gold" />}>
              {/* FmCommonForm */}
              <ComponentSection
                name="FmCommonForm"
                description="Complete form wrapper with react-hook-form and Zod validation. Provides form state and validation handling."
                caveats={["Requires Zod schema for validation", "Children receive form methods as render prop"]}
              >
            <FmCommonForm
              schema={formSchema}
              defaultValues={{ name: '', email: '', role: '', bio: '' }}
              onSubmit={(data) => {
                setFormValues(data);
                console.log('Form submitted:', data);
              }}
            >
              {(form) => (
                <FmCommonStackLayout spacing="lg">
                  <FmCommonFormSection
                    title="Personal Information"
                    description="Enter your basic details"
                    icon={User}
                    layout="grid-2"
                  >
                    <FmCommonFormField
                      form={form}
                      name="name"
                      label="Full Name"
                      placeholder="John Doe"
                      required
                    />
                    <FmCommonFormField
                      form={form}
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="john@example.com"
                      required
                    />
                  </FmCommonFormSection>

                  <FmCommonFormSection
                    title="Professional Details"
                    description="Tell us about your role"
                    layout="stack"
                  >
                    <FmCommonFormSelect
                      form={form}
                      name="role"
                      label="Role"
                      placeholder="Select a role"
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
                      name="bio"
                      label="Bio"
                      textarea
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </FmCommonFormSection>

                  <FmCommonFormActions
                    submitText="Save Profile"
                    showCancel
                    cancelText="Reset"
                    onCancel={() => form.reset()}
                    isSubmitting={form.formState.isSubmitting}
                    align="right"
                  />
                </FmCommonStackLayout>
              )}
            </FmCommonForm>
            {formValues && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Last Submission:</p>
                <pre className="text-xs">{JSON.stringify(formValues, null, 2)}</pre>
              </div>
            )}
          </ComponentSection>

          {/* FmCommonFormSection */}
          <ComponentSection
            name="FmCommonFormSection"
            description="Groups form fields with a title, description, and icon. Supports multiple layout options (stack, grid-2, grid-3)."
          >
            <p className="text-sm text-muted-foreground">See example in FmCommonForm above ↑</p>
          </ComponentSection>

          {/* FmCommonFormField */}
          <ComponentSection
            name="FmCommonFormField"
            description="Individual form field with validation, error display, and support for text inputs and textareas."
          >
            <p className="text-sm text-muted-foreground">See example in FmCommonForm above ↑</p>
          </ComponentSection>

          {/* FmCommonFormSelect */}
          <ComponentSection
            name="FmCommonFormSelect"
            description="Dropdown select field integrated with react-hook-form. Supports disabled options and custom placeholders."
          >
            <p className="text-sm text-muted-foreground">See example in FmCommonForm above ↑</p>
          </ComponentSection>

          {/* FmCommonFormActions */}
          <ComponentSection
            name="FmCommonFormActions"
            description="Standard form action buttons (submit, cancel, reset) with loading states and flexible alignment."
          >
            <p className="text-sm text-muted-foreground">See example in FmCommonForm above ↑</p>
          </ComponentSection>
        </CategorySection>

        <Separator className="my-8" />

        {/* Layout Components */}
        <CategorySection title="Layout Components" icon={<Layout className="h-5 w-5 text-fm-gold" />}>
          {/* FmCommonGridLayout */}
          <ComponentSection
            name="FmCommonGridLayout"
            description="Responsive grid layout with configurable columns at different breakpoints. Provides consistent spacing."
          >
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">2 columns on md, 4 on lg:</p>
                <FmCommonGridLayout columns={{ default: 1, md: 2, lg: 4 }} gap="md">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-accent/10 rounded-lg text-center">
                      Item {i}
                    </div>
                  ))}
                </FmCommonGridLayout>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">3 columns on lg with large gap:</p>
                <FmCommonGridLayout columns={{ default: 1, md: 2, lg: 3 }} gap="lg">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-6 bg-accent/10 rounded-lg text-center">
                      Item {i}
                    </div>
                  ))}
                </FmCommonGridLayout>
              </div>
            </div>
          </ComponentSection>

          {/* FmCommonStackLayout */}
          <ComponentSection
            name="FmCommonStackLayout"
            description="Vertical stack layout with consistent spacing. Supports dividers and alignment options."
          >
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Standard stack with medium spacing:</p>
                <FmCommonStackLayout spacing="md">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-accent/10 rounded-lg">
                      Stack Item {i}
                    </div>
                  ))}
                </FmCommonStackLayout>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Stack with dividers and large spacing:</p>
                <FmCommonStackLayout spacing="lg" dividers>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-accent/10 rounded-lg">
                      Divided Item {i}
                    </div>
                  ))}
                </FmCommonStackLayout>
              </div>
            </div>
          </ComponentSection>
        </CategorySection>

        <Separator className="my-8" />

        {/* Modals & Navigation - Alphabetically Sorted */}
        <CategorySection title="Modals & Navigation" icon={<Navigation className="h-5 w-5 text-fm-gold" />}>
          {/* FmCommonBackButton */}
          <ComponentSection
            name="FmCommonBackButton"
            description="Navigation button for going back. Can use browser history or navigate to a specific path."
          >
            <div className="space-y-4">
              <FmCommonBackButton text="Back to Events" />
              <FmCommonBackButton text="Custom Back" to="/demo" variant="outline" />
            </div>
          </ComponentSection>

          {/* FmCommonConfirmDialog */}
          <ComponentSection
            name="FmCommonConfirmDialog"
            description="Confirmation dialog for important or destructive actions. Supports different variants (default, destructive, warning)."
          >
            <div className="space-y-4">
              <Button onClick={() => setConfirmOpen(true)} variant="destructive">
                Delete Item
              </Button>
              <FmCommonConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete Event"
                description="Are you sure you want to delete this event? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => {
                  console.log('Confirmed!');
                  setConfirmOpen(false);
                }}
                variant="destructive"
              />
            </div>
          </ComponentSection>

          {/* FmCommonLoadingOverlay */}
          <ComponentSection
            name="FmCommonLoadingOverlay"
            description="Full-screen loading overlay with spinner. Used for async operations that block interaction."
          >
            <div className="space-y-4">
              <Button onClick={() => {
                setLoadingOverlay(true);
                setTimeout(() => setLoadingOverlay(false), 2000);
              }}>
                Show Loading Overlay (2s)
              </Button>
              {loadingOverlay && <FmCommonLoadingOverlay message="Loading demo..." />}
            </div>
          </ComponentSection>
        </CategorySection>

        <Separator className="my-8" />

        {/* Components with Inheritance */}
        <CategorySection title="Components with Specializations" icon={<Users className="h-5 w-5 text-fm-gold" />}>
          {/* FmCommonButton & Variants */}
          <ComponentSection
            name="FmCommonButton"
            description="Base button component with ripple effects, loading states, and icon support."
          >
            <Tabs defaultValue="base" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="base">Base Component</TabsTrigger>
                <TabsTrigger value="create">FmCommonCreateButton</TabsTrigger>
              </TabsList>
              <TabsContent value="base" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FmCommonButton variant="default">Default</FmCommonButton>
                  <FmCommonButton variant="outline">Outline</FmCommonButton>
                  <FmCommonButton variant="ghost">Ghost</FmCommonButton>
                  <FmCommonButton variant="gold">Gold</FmCommonButton>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FmCommonButton icon={Heart} iconPosition="left">With Icon</FmCommonButton>
                  <FmCommonButton icon={Music} iconPosition="right">Icon Right</FmCommonButton>
                  <FmCommonButton loading>Loading...</FmCommonButton>
                </div>
              </TabsContent>
              <TabsContent value="create" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Specialized button for "create new" actions. Always includes a Plus icon.
                </p>
                <div className="space-y-4">
                  <FmCommonCreateButton label="Create New Event" onClick={() => console.log('Create event')} />
                  <FmCommonCreateButton 
                    label="Add Artist" 
                    onClick={() => console.log('Create artist')} 
                    variant="default"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </ComponentSection>

          {/* FmCommonSearchDropdown & Variants */}
          <ComponentSection
            name="FmCommonSearchDropdown"
            description="Base search dropdown with async search capability. Specialized versions exist for Artists, Events, Venues, and Cities."
            caveats={["Requires async onSearch function", "Specialized versions include Supabase integration"]}
          >
            <Tabs defaultValue="base" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="base">Base</TabsTrigger>
                <TabsTrigger value="artist">Artist</TabsTrigger>
                <TabsTrigger value="event">Event</TabsTrigger>
                <TabsTrigger value="venue">Venue</TabsTrigger>
                <TabsTrigger value="city">City</TabsTrigger>
              </TabsList>
              <TabsContent value="base" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Base component requires manual search implementation. Use specialized versions for common entities.
                </p>
                <FmCommonSearchDropdown
                  onChange={(value, label) => console.log('Selected:', value, label)}
                  onSearch={async (query) => {
                    // Simulate async search
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return [
                      { id: '1', label: `Result for "${query}" #1` },
                      { id: '2', label: `Result for "${query}" #2` },
                    ];
                  }}
                  placeholder="Search for anything..."
                />
              </TabsContent>
              <TabsContent value="artist" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Searches artists from Supabase with image display and recent options.
                </p>
                <FmArtistSearchDropdown
                  onChange={(value) => console.log('Selected artist:', value)}
                />
              </TabsContent>
              <TabsContent value="event" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Searches upcoming events with headliner and venue information.
                </p>
                <FmEventSearchDropdown
                  onChange={(value) => console.log('Selected event:', value)}
                />
              </TabsContent>
              <TabsContent value="venue" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Searches venues from Supabase with location information.
                </p>
                <FmVenueSearchDropdown
                  onChange={(value) => console.log('Selected venue:', value)}
                />
              </TabsContent>
              <TabsContent value="city" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Searches cities from Supabase database.
                </p>
                <FmCitySearchDropdown
                  onChange={(value) => console.log('Selected city:', value)}
                />
              </TabsContent>
            </Tabs>
          </ComponentSection>
        </CategorySection>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-fm-gold mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Component Guidelines</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All FmCommon components support className prop for custom styling</li>
                <li>Form components require react-hook-form integration</li>
                <li>Layout components are responsive by default</li>
                <li>Always check TypeScript definitions for complete prop lists</li>
              </ul>
            </div>
          </div>
        </div>
          </div>
        </TabsContent>
      </Tabs>
    </DemoLayout>
  );
}
