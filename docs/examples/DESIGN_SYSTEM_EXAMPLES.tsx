/**
 * Example Usage of Force Majeure Design System
 *
 * This file demonstrates how to properly use the design system constants
 * when creating new components and pages.
 */

import React from 'react';
import {
  COLORS,
  COLOR_CLASSES,
  SPACING,
  SPACING_CLASSES,
  TYPOGRAPHY,
  DEPTH,
  BORDER_RADIUS,
} from '@/shared/constants/designSystem';

/**
 * Example 1: Simple Card Component
 * Using design system constants for consistency
 */
export const ExampleCard = () => {
  return (
    <div
      className={`
        ${DEPTH.LEVEL_1.classes}
        ${SPACING_CLASSES.P_MD}
        ${BORDER_RADIUS.SHARP}
        ${COLOR_CLASSES.WHITE_TEXT}
      `}
    >
      <h2 className={`${TYPOGRAPHY.FONT_CANELA} text-2xl mb-[10px]`}>
        Example card title.
      </h2>
      <p className={TYPOGRAPHY.FONT_CANELA}>
        This card follows the design system guidelines.
      </p>
    </div>
  );
};

/**
 * Example 2: Primary Action Button
 * Using gold accent color for CTAs
 */
export const ExampleButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        ${COLOR_CLASSES.GOLD_BG}
        ${COLOR_CLASSES.BLACK_TEXT}
        ${SPACING_CLASSES.P_SM}
        ${BORDER_RADIUS.SHARP}
        ${TYPOGRAPHY.FONT_CANELA}
        transition-all
        hover:opacity-90
      `}
    >
      {children}
    </button>
  );
};

/**
 * Example 3: Danger/Delete Button
 * Using chili red for destructive actions
 */
export const ExampleDangerButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        ${COLOR_CLASSES.DANGER_BG}
        ${COLOR_CLASSES.WHITE_TEXT}
        ${SPACING_CLASSES.P_SM}
        ${BORDER_RADIUS.SHARP}
        ${TYPOGRAPHY.FONT_CANELA}
        transition-all
        hover:opacity-90
      `}
    >
      {children}
    </button>
  );
};

/**
 * Example 4: Outline Card (Level 0 Depth)
 * Transparent background with border
 */
export const ExampleOutlineCard = () => {
  return (
    <div
      className={`
        ${DEPTH.LEVEL_0.classes}
        ${SPACING_CLASSES.P_MD}
        ${BORDER_RADIUS.SHARP}
        ${COLOR_CLASSES.WHITE_TEXT}
      `}
    >
      <h3 className={`${TYPOGRAPHY.FONT_CANELA} text-xl mb-[5px]`}>
        Outline card.
      </h3>
      <p className={TYPOGRAPHY.FONT_CANELA}>
        This uses level 0 depth - transparent with outline.
      </p>
    </div>
  );
};

/**
 * Example 5: Page Layout with Proper Spacing
 * Using spacing scale for consistent gaps
 */
export const ExamplePageLayout = () => {
  return (
    <div className='bg-topography min-h-screen p-[40px]'>
      {/* Page Header */}
      <header className='mb-[60px]'>
        <h1
          className={`${TYPOGRAPHY.FONT_CANELA} text-4xl ${COLOR_CLASSES.WHITE_TEXT}`}
        >
          Welcome to the page.
        </h1>
        <p
          className={`${TYPOGRAPHY.FONT_CANELA} ${COLOR_CLASSES.WHITE_TEXT} mt-[10px]`}
        >
          This page follows all design system guidelines.
        </p>
      </header>

      {/* Content Grid with Proper Spacing */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-[40px]'>
        <ExampleCard />
        <ExampleOutlineCard />
      </div>

      {/* Action Buttons with Spacing */}
      <div className='flex gap-[20px] mt-[40px]'>
        <ExampleButton>Save changes</ExampleButton>
        <ExampleDangerButton>Delete item</ExampleDangerButton>
      </div>
    </div>
  );
};

/**
 * Example 6: Using Direct Color Values (when Tailwind classes aren't available)
 * For inline styles or custom styling scenarios
 */
export const ExampleWithInlineStyles = () => {
  return (
    <div
      style={{
        backgroundColor: COLORS.BLACK,
        color: COLORS.WHITE,
        padding: SPACING.MD,
        borderRadius: 0, // Sharp corners
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.PRIMARY_FONT,
          marginBottom: SPACING.SM,
          color: COLORS.DUSTY_GOLD,
        }}
      >
        Using inline styles.
      </h2>
      <p style={{ fontFamily: TYPOGRAPHY.PRIMARY_FONT }}>
        When Tailwind classes aren't available, use the constant values
        directly.
      </p>
    </div>
  );
};

/**
 * Example 7: Icon Button
 * Sharp edges, minimal padding
 */
export const ExampleIconButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        p-[5px]
        ${BORDER_RADIUS.SHARP}
        ${COLOR_CLASSES.WHITE_TEXT}
        ${COLOR_CLASSES.GOLD_HOVER_TEXT}
        transition-colors
      `}
    >
      {icon}
    </button>
  );
};

/**
 * Example 8: Multi-Level Depth Stack
 * Showing how depth increases with layering
 */
export const ExampleDepthStack = () => {
  return (
    <div className='relative'>
      {/* Level 0: Base outline */}
      <div className={`${DEPTH.LEVEL_0.classes} p-[40px]`}>
        <h2
          className={`${TYPOGRAPHY.FONT_CANELA} text-2xl ${COLOR_CLASSES.WHITE_TEXT} mb-[20px]`}
        >
          Level 0: Transparent outline.
        </h2>

        {/* Level 1: Frosted glass */}
        <div className={`${DEPTH.LEVEL_1.classes} p-[20px] mb-[20px]`}>
          <h3
            className={`${TYPOGRAPHY.FONT_CANELA} ${COLOR_CLASSES.WHITE_TEXT} mb-[10px]`}
          >
            Level 1: Base frosted glass.
          </h3>

          {/* Level 2: Elevated */}
          <div className={`${DEPTH.LEVEL_2.classes} p-[20px]`}>
            <h4
              className={`${TYPOGRAPHY.FONT_CANELA} ${COLOR_CLASSES.WHITE_TEXT}`}
            >
              Level 2: Elevated frosted glass.
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ❌ WRONG: Don't do this
 * - Arbitrary colors
 * - Arbitrary spacing
 * - Rounded corners
 * - Title case headers
 * - Overuse of bold
 */
export const ExampleWrongWay = () => {
  return (
    <div className='bg-[#1a1a1a] p-6 rounded-lg'>
      {' '}
      {/* ❌ arbitrary values, rounded */}
      <h2 className='text-2xl font-bold'>Title Case Header</h2>{' '}
      {/* ❌ title case, unnecessary bold */}
      <p className='text-[#cccccc] mt-4 font-bold'>
        {' '}
        {/* ❌ arbitrary color, spacing, bold */}
        This doesn't follow the design system
      </p>
      <button className='bg-[#ffd700] px-5 py-3 rounded-full mt-3'>
        {' '}
        {/* ❌ arbitrary color, spacing, rounded */}
        Click Me
      </button>
    </div>
  );
};

/**
 * ✅ RIGHT: Do this instead
 * - Design system constants
 * - Defined spacing scale
 * - Sharp corners
 * - Sentence case
 * - Minimal bold
 */
export const ExampleRightWay = () => {
  return (
    <div className={`${DEPTH.LEVEL_1.classes} p-[20px] ${BORDER_RADIUS.SHARP}`}>
      <h2
        className={`${TYPOGRAPHY.FONT_CANELA} text-2xl ${COLOR_CLASSES.WHITE_TEXT}`}
      >
        Sentence case header.
      </h2>
      <p
        className={`${TYPOGRAPHY.FONT_CANELA} ${COLOR_CLASSES.WHITE_TEXT} mt-[20px]`}
      >
        This follows the design system guidelines.
      </p>
      <button
        className={`${COLOR_CLASSES.GOLD_BG} ${COLOR_CLASSES.BLACK_TEXT} px-[20px] py-[10px] ${BORDER_RADIUS.SHARP} mt-[20px]`}
      >
        Click me
      </button>
    </div>
  );
};

/**
 * Example 9: Input Field with Focus Styling
 * Following FmCommonTextField patterns
 */
export const ExampleInputField = () => {
  return (
    <div className='space-y-1'>
      <input
        type='text'
        placeholder='Enter your email'
        className='
          w-full h-12 px-6 py-4
          border border-input bg-background
          rounded-none
          transition-all duration-300
          hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]
          focus:outline-none focus:bg-white/5
          focus:border-t-0 focus:border-l-0 focus:border-r-0
          focus:border-b-[3px] focus:border-b-fm-gold
          focus:shadow-[0_4px_16px_rgba(223,186,125,0.3)]
        '
      />
      <label className='text-xs uppercase text-muted-foreground transition-colors duration-200'>
        Email Address
      </label>
    </div>
  );
};

/**
 * Example 10: Label with Focus State
 * Labels should be small, ALL CAPS, muted color
 */
export const ExampleLabel = ({ isFocused }: { isFocused?: boolean }) => {
  return (
    <label
      className={`
        text-xs uppercase transition-colors duration-200
        ${isFocused ? 'text-fm-gold' : 'text-muted-foreground'}
      `}
    >
      Field Label *
    </label>
  );
};

/**
 * Example 11: Striped List (Context Menu Style)
 * Based on FmCommonContextMenu pattern
 */
export const ExampleStripedList = () => {
  const items = [
    { id: 1, label: 'Edit event', icon: '✏️' },
    { id: 2, label: 'Duplicate event', icon: '📋' },
    { id: 3, label: 'View details', icon: '👁️' },
    {
      id: 4,
      label: 'Delete event',
      icon: '🗑️',
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className='w-56 bg-gradient-to-br from-background to-background/95 backdrop-blur-xl border-2 border-white/20 shadow-lg p-1 rounded-md'>
      {items.map((item, idx) => {
        const isEven = idx % 2 === 0;
        const isDestructive = item.variant === 'destructive';

        return (
          <div
            key={item.id}
            className={`
              group cursor-pointer rounded-md my-0.5 p-3 relative
              transition-all duration-300
              ${isEven ? 'bg-background/40' : 'bg-background/60'}
              hover:bg-fm-gold/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white
              focus:bg-fm-gold/15 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white
              active:scale-[0.98]
              ${isDestructive ? 'text-fm-danger hover:bg-fm-danger/15 hover:shadow-fm-danger/20' : ''}
            `}
          >
            <span className='mr-2 transition-transform duration-300 group-hover:scale-110'>
              {item.icon}
            </span>
            {item.label}
            {/* Divider after each item except the last */}
            {idx < items.length - 1 && (
              <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Example 12: Complete Form with All Patterns
 * Combining input styling, labels, and list patterns
 */
export const ExampleCompleteForm = () => {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  return (
    <div
      className={`${DEPTH.LEVEL_1.classes} p-[40px] max-w-md ${BORDER_RADIUS.SHARP}`}
    >
      <h2
        className={`${TYPOGRAPHY.FONT_CANELA} text-2xl ${COLOR_CLASSES.WHITE_TEXT} mb-[40px]`}
      >
        Create new event.
      </h2>

      {/* Input field with proper styling */}
      <div className='space-y-1 mb-[20px]'>
        <input
          type='text'
          placeholder='Electronic Music Festival'
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          className='
            w-full h-12 px-6 py-4
            border border-input bg-background rounded-none
            font-canela
            transition-all duration-300
            hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]
            focus:outline-none focus:bg-white/5
            focus:border-t-0 focus:border-l-0 focus:border-r-0
            focus:border-b-[3px] focus:border-b-fm-gold
            focus:shadow-[0_4px_16px_rgba(223,186,125,0.3)]
          '
        />
        <label
          className={`
            text-xs uppercase transition-colors duration-200
            ${focusedField === 'name' ? 'text-fm-gold' : 'text-muted-foreground'}
          `}
        >
          Event Name *
        </label>
      </div>

      {/* Another field */}
      <div className='space-y-1 mb-[40px]'>
        <input
          type='text'
          placeholder='The Venue'
          onFocus={() => setFocusedField('venue')}
          onBlur={() => setFocusedField(null)}
          className='
            w-full h-12 px-6 py-4
            border border-input bg-background rounded-none
            font-canela
            transition-all duration-300
            hover:bg-white/5 hover:border-fm-gold/50 hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]
            focus:outline-none focus:bg-white/5
            focus:border-t-0 focus:border-l-0 focus:border-r-0
            focus:border-b-[3px] focus:border-b-fm-gold
            focus:shadow-[0_4px_16px_rgba(223,186,125,0.3)]
          '
        />
        <label
          className={`
            text-xs uppercase transition-colors duration-200
            ${focusedField === 'venue' ? 'text-fm-gold' : 'text-muted-foreground'}
          `}
        >
          Venue Location
        </label>
      </div>

      {/* Action buttons */}
      <div className='flex gap-[20px]'>
        <button
          className={`${COLOR_CLASSES.GOLD_BG} ${COLOR_CLASSES.BLACK_TEXT} px-[20px] py-[10px] ${BORDER_RADIUS.SHARP} ${TYPOGRAPHY.FONT_CANELA} transition-opacity hover:opacity-90`}
        >
          Create event
        </button>
        <button
          className={`bg-transparent border border-white/20 ${COLOR_CLASSES.WHITE_TEXT} px-[20px] py-[10px] ${BORDER_RADIUS.SHARP} ${TYPOGRAPHY.FONT_CANELA} transition-all hover:border-white/40`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
