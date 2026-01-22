import { ComponentRelationshipGraph } from '@/components/demo/ComponentRelationshipGraph';

export function RelationshipsSection() {
  return (
    <div className='space-y-6'>
      <div className='p-6 bg-muted/30 rounded-none border border-border'>
        <h3 className='text-xl font-canela font-semibold mb-2 text-fm-gold'>
          Component Architecture Overview
        </h3>
        <p className='text-muted-foreground'>
          This interactive graph visualizes the relationships between all
          FmCommon components. Larger dots represent base components, while
          lines show inheritance (dashed gold) and composition (dotted gray)
          relationships. Hover over components to see details.
        </p>
      </div>
      <ComponentRelationshipGraph />
    </div>
  );
}
