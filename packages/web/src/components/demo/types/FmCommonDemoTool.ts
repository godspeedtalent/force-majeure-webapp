import { ReactNode } from 'react';

/**
 * FmCommonDemoTool - Interface for demo tool components
 *
 * All demo tools should implement this interface to ensure consistency
 * across the demo toolbar.
 */
export interface FmCommonDemoTool {
  /** Unique identifier for the demo tool */
  id: string;
  /** Display label for the demo tool section */
  label: string;
  /** Render the demo tool content */
  render: () => ReactNode;
}
