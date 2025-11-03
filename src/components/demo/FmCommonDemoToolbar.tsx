import { FmInfoCard } from '@/components/common/data/FmInfoCard';
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
 * - Consistent styling with FmInfoCard
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
    <FmInfoCard icon={Wrench} className="mb-6">
      <FmCommonCollapsibleSection title="Demo Tools" defaultExpanded={defaultExpanded}>
        <div className="space-y-6">
          {tools.map((tool) => (
            <div key={tool.id}>
              {tool.render()}
            </div>
          ))}
        </div>
      </FmCommonCollapsibleSection>
    </FmInfoCard>
  );
};
