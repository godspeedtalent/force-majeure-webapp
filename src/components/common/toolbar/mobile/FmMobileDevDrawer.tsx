import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/common/shadcn/drawer';
import {
  Compass,
  Database,
  ToggleLeft,
  Settings2,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/shared';
import { MobileDevToolId } from './useMobileDevTools';

interface FmMobileDevDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolSelect: (toolId: MobileDevToolId) => void;
  badges: Record<MobileDevToolId, number>;
}

interface ToolCardProps {
  id: MobileDevToolId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
}

function ToolCard({ label, icon, badge, onClick }: ToolCardProps) {
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styling
        'relative',
        'bg-white/5 border border-white/10',
        // Sharp corners per design system
        'rounded-none',
        // Spacing - MD padding
        'p-[20px]',
        // Layout - flex column for icon + label
        'flex flex-col items-center justify-center',
        'gap-[10px]',
        // Min height for consistency
        'min-h-[100px]',
        // Hover states
        'hover:bg-white/10 hover:border-fm-gold/50',
        // Active state
        'active:scale-95',
        // Transitions
        'transition-all duration-200',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
      )}
      type="button"
    >
      {/* Icon */}
      <div className="text-fm-gold">{icon}</div>

      {/* Label */}
      <span className="text-sm font-canela uppercase text-white">{label}</span>

      {/* Badge */}
      {hasBadge && (
        <span
          className={cn(
            // Position - top-right corner
            'absolute top-[5px] right-[5px]',
            // Size
            'min-w-[20px] h-[20px]',
            // Styling
            'bg-fm-danger text-white',
            // Shape
            'rounded-full',
            // Typography
            'text-[10px] font-bold',
            // Layout
            'flex items-center justify-center',
            // Padding
            'px-[5px]',
            // Border
            'border border-black'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

/**
 * Main tool selection drawer for mobile developer toolbar
 * Displays grid of available developer tools with badges
 * Uses Vaul drawer for native mobile bottom sheet behavior
 */
export function FmMobileDevDrawer({
  open,
  onOpenChange,
  onToolSelect,
  badges,
}: FmMobileDevDrawerProps) {
  const tools: Array<{
    id: MobileDevToolId;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'navigation',
      label: 'Navigation',
      icon: <Compass className="h-[24px] w-[24px]" strokeWidth={2} />,
    },
    {
      id: 'database',
      label: 'Database',
      icon: <Database className="h-[24px] w-[24px]" strokeWidth={2} />,
    },
    {
      id: 'features',
      label: 'Features',
      icon: <ToggleLeft className="h-[24px] w-[24px]" strokeWidth={2} />,
    },
    {
      id: 'session',
      label: 'Session',
      icon: <Settings2 className="h-[24px] w-[24px]" strokeWidth={2} />,
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <ClipboardList className="h-[24px] w-[24px]" strokeWidth={2} />,
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          // Background - frosted glass Level 2
          'bg-black/80 backdrop-blur-lg',
          // Border - white subtle
          'border-t-2 border-white/20',
          // Rounded top corners (bottom sheet convention)
          'rounded-t-[20px]',
          // Max height - 70vh to show content behind
          'max-h-[70vh]',
          // z-index - above FAB
          'z-[70]'
        )}
      >
        {/* Header with drag handle */}
        <DrawerHeader className="pb-[10px]">
          {/* Drag Handle */}
          <div className="mx-auto h-[4px] w-[100px] rounded-full bg-fm-gold/50 mb-[20px]" />

          <DrawerTitle className="text-center font-canela uppercase text-fm-gold text-lg">
            Developer Tools
          </DrawerTitle>
        </DrawerHeader>

        {/* Tool Grid */}
        <div className="p-[20px] pt-0">
          <div
            className={cn(
              // Responsive grid - 2 cols on small, 3 cols on larger mobile
              'grid grid-cols-2 sm:grid-cols-3',
              // Gap - SM spacing
              'gap-[10px]'
            )}
          >
            {tools.map(tool => (
              <ToolCard
                key={tool.id}
                id={tool.id}
                label={tool.label}
                icon={tool.icon}
                badge={badges[tool.id]}
                onClick={() => {
                  onToolSelect(tool.id);
                  // Don't close main drawer - let nested drawer open on top
                }}
              />
            ))}
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
  );
}
