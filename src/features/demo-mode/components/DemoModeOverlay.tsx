import { createPortal } from 'react-dom';
import { useDemoModeSafe } from '@/shared/contexts/DemoModeContext';
import { useDemoModeTouchHandler } from '../hooks/useDemoModeTouchHandler';
import { TouchIndicator } from './TouchIndicator';
import { LongPressIndicator } from './LongPressIndicator';

/**
 * Demo mode overlay component that renders touch visualizations.
 * Uses a portal to render directly to document.body, ensuring
 * indicators appear above all other content.
 *
 * Only renders on mobile devices (when demo mode is enabled).
 */
export function DemoModeOverlay() {
  const { settings, isActive } = useDemoModeSafe();

  const { activeTouches, longPressTouches, removeTouch } =
    useDemoModeTouchHandler({
      settings,
    });

  // Don't render anything if demo mode is not active
  if (!isActive) return null;

  // Render to document.body via portal
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        // Ensure we don't interfere with touches
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-hidden="true"
    >
      {/* Tap indicators */}
      {activeTouches.map(touch => (
        <TouchIndicator
          key={touch.id}
          id={touch.id}
          x={touch.x}
          y={touch.y}
          size={settings.indicatorSize}
          onAnimationEnd={() => removeTouch(touch.id)}
        />
      ))}

      {/* Long press indicators */}
      {settings.showLongPressIndicator &&
        longPressTouches.map(touch => (
          <LongPressIndicator
            key={`longpress-${touch.id}`}
            x={touch.x}
            y={touch.y}
            size={settings.indicatorSize}
            duration={settings.longPressThreshold}
            isActive={touch.isActive}
          />
        ))}
    </div>,
    document.body
  );
}
