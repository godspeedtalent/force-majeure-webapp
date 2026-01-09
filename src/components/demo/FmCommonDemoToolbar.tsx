import { FmCommonCard, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { Wrench } from 'lucide-react';
import { FmCommonDemoTool } from './types/FmCommonDemoTool';

interface FmCommonDemoToolbarProps {
  tools: FmCommonDemoTool[];
  defaultExpanded?: boolean;
}

/**
 * FmCommonDemoToolbar - A toolbar for demo tools
 *
 * Features:
 * - Displays an array of demo tools in a collapsible card
 * - Each tool is rendered in its own section
 * - Consistent styling with FmCommonCard
 * - Collapsible with FmCommonCollapsibleSection
 *
 * Usage:
 * ```tsx
 * const tools = [
 *   eventSelectionTool,
 *   anotherTool,
 * ];
 *
 * <FmCommonDemoToolbar tools={tools} />
 * ```
 */
export const FmCommonDemoToolbar = ({
  tools,
  defaultExpanded = true,
}: FmCommonDemoToolbarProps) => {
  return (
    <FmCommonCard size='lg' className='mb-6'>
      <FmCommonCardHeader icon={Wrench}>
        <FmCommonCollapsibleSection
          title='Demo Tools'
          defaultExpanded={defaultExpanded}
        >
          <div className='space-y-6'>
            {tools.map(tool => (
              <div key={tool.id}>{tool.render()}</div>
            ))}
          </div>
        </FmCommonCollapsibleSection>
      </FmCommonCardHeader>
    </FmCommonCard>
  );
};
