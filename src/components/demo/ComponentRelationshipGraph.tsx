import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface ComponentNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  isBase?: boolean;
  children?: string[];
  parents?: string[];
}

interface ComponentRelationship {
  from: string;
  to: string;
  type: 'extends' | 'uses';
}

export function ComponentRelationshipGraph() {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  // Define all components organized by catalog categories
  const components: ComponentNode[] = [
    // BUTTONS CATEGORY (x: 0-1.5)
    {
      id: 'button-base',
      label: 'FmCommonButton',
      category: 'Buttons',
      x: 0.5,
      y: 8,
      isBase: true,
      children: ['button-create', 'button-nav'],
    },
    {
      id: 'button-create',
      label: 'FmCommonCreateButton',
      category: 'Buttons',
      x: 0.3,
      y: 7,
      parents: ['button-base'],
    },
    {
      id: 'button-nav',
      label: 'FmCommonNavigationButton',
      category: 'Buttons',
      x: 0.7,
      y: 7,
      parents: ['button-base'],
    },

    // CARDS & DISPLAY CATEGORY (x: 1.5-3.5)
    {
      id: 'badge',
      label: 'FmBadge',
      category: 'Cards & Display',
      x: 2,
      y: 9,
      isBase: true,
    },
    {
      id: 'badge-group',
      label: 'FmCommonBadgeGroup',
      category: 'Cards & Display',
      x: 2,
      y: 8,
      isBase: true,
      parents: ['badge'],
    },
    {
      id: 'icon-text',
      label: 'FmCommonIconWithText',
      category: 'Cards & Display',
      x: 2.5,
      y: 8.5,
      isBase: true,
    },
    {
      id: 'price',
      label: 'FmCommonPriceDisplay',
      category: 'Cards & Display',
      x: 3,
      y: 8.5,
      isBase: true,
    },
    {
      id: 'info-card',
      label: 'FmCommonInfoCard',
      category: 'Cards & Display',
      x: 2.5,
      y: 7.5,
      isBase: true,
    },
    {
      id: 'stat-card',
      label: 'FmCommonStatCard',
      category: 'Cards & Display',
      x: 3,
      y: 7.5,
      isBase: true,
      parents: ['badge'],
    },
    {
      id: 'page-header',
      label: 'FmCommonPageHeader',
      category: 'Cards & Display',
      x: 2.5,
      y: 6.5,
      isBase: true,
      parents: ['stat-card', 'icon-text'],
    },
    {
      id: 'detail-section',
      label: 'FmCommonDetailSection',
      category: 'Cards & Display',
      x: 2,
      y: 6.5,
      isBase: true,
      parents: ['icon-text'],
    },

    // DATA CATEGORY (x: 3.5-4.5)
    {
      id: 'list',
      label: 'FmCommonList',
      category: 'Data',
      x: 4,
      y: 8,
      isBase: true,
    },
    {
      id: 'tab',
      label: 'FmCommonTab',
      category: 'Data',
      x: 4,
      y: 7.5,
      isBase: true,
    },
    {
      id: 'collapsible',
      label: 'FmCommonCollapsibleSection',
      category: 'Data',
      x: 4,
      y: 7,
      isBase: true,
    },
    {
      id: 'data-grid',
      label: 'FmCommonDataGrid',
      category: 'Data',
      x: 4,
      y: 6.5,
      isBase: true,
    },

    // DISPLAY (AVATARS) CATEGORY (x: 4.5-5.5)
    {
      id: 'user-photo',
      label: 'FmCommonUserPhoto',
      category: 'Display',
      x: 5,
      y: 8,
      isBase: true,
    },
    {
      id: 'gradient-avatar',
      label: 'FmAnimatedGradientAvatar',
      category: 'Display',
      x: 5,
      y: 7.5,
      isBase: true,
    },

    // FEEDBACK CATEGORY (x: 5.5-6.5)
    {
      id: 'loading-spinner',
      label: 'FmCommonLoadingSpinner',
      category: 'Feedback',
      x: 6,
      y: 8,
      isBase: true,
    },
    {
      id: 'loading-overlay',
      label: 'FmCommonLoadingOverlay',
      category: 'Feedback',
      x: 6,
      y: 7.5,
      isBase: true,
      parents: ['loading-spinner'],
    },
    {
      id: 'error-display',
      label: 'FmErrorDisplay',
      category: 'Feedback',
      x: 6,
      y: 7,
      isBase: true,
    },

    // FORM INPUTS CATEGORY (x: 0-1.5, y: 4-6)
    {
      id: 'text-field',
      label: 'FmCommonTextField',
      category: 'Form Inputs',
      x: 0.5,
      y: 5.5,
      isBase: true,
    },
    {
      id: 'select',
      label: 'FmCommonSelect',
      category: 'Form Inputs',
      x: 0.5,
      y: 5,
      isBase: true,
    },
    {
      id: 'checkbox',
      label: 'FmCommonCheckbox',
      category: 'Form Inputs',
      x: 0.5,
      y: 4.5,
      isBase: true,
    },
    {
      id: 'toggle',
      label: 'FmCommonToggle',
      category: 'Form Inputs',
      x: 1,
      y: 5.5,
      isBase: true,
    },
    {
      id: 'date-picker',
      label: 'FmCommonDatePicker',
      category: 'Form Inputs',
      x: 1,
      y: 5,
      isBase: true,
    },
    {
      id: 'time-picker',
      label: 'FmCommonTimePicker',
      category: 'Form Inputs',
      x: 1,
      y: 4.5,
      isBase: true,
    },
    {
      id: 'password-input',
      label: 'PasswordInput',
      category: 'Form Inputs',
      x: 1.5,
      y: 5.5,
      isBase: true,
    },

    // FORM SYSTEM CATEGORY (x: 1.5-3.5, y: 4-6)
    {
      id: 'form',
      label: 'FmCommonForm',
      category: 'Form System',
      x: 2.5,
      y: 5.5,
      isBase: true,
      children: ['form-section', 'form-field', 'form-select', 'form-actions'],
      parents: ['stack-layout'],
    },
    {
      id: 'form-section',
      label: 'FmCommonFormSection',
      category: 'Form System',
      x: 2,
      y: 4.8,
      isBase: true,
      children: ['form-field', 'form-select'],
      parents: ['form'],
    },
    {
      id: 'form-field',
      label: 'FmCommonFormField',
      category: 'Form System',
      x: 2.3,
      y: 4,
      isBase: true,
      parents: ['form', 'form-section'],
    },
    {
      id: 'form-select',
      label: 'FmCommonFormSelect',
      category: 'Form System',
      x: 2.7,
      y: 4,
      isBase: true,
      parents: ['form', 'form-section'],
    },
    {
      id: 'form-actions',
      label: 'FmCommonFormActions',
      category: 'Form System',
      x: 3,
      y: 4.8,
      isBase: true,
      parents: ['form'],
    },

    // LAYOUT CATEGORY (x: 3.5-4.5, y: 4-6)
    {
      id: 'grid-layout',
      label: 'FmCommonGridLayout',
      category: 'Layout',
      x: 4,
      y: 5.5,
      isBase: true,
    },
    {
      id: 'stack-layout',
      label: 'FmCommonStackLayout',
      category: 'Layout',
      x: 4,
      y: 5,
      isBase: true,
    },

    // MODALS CATEGORY (x: 4.5-5.5, y: 4-6)
    {
      id: 'modal',
      label: 'FmCommonModal',
      category: 'Modals',
      x: 5,
      y: 5.5,
      isBase: true,
    },
    {
      id: 'confirm-dialog',
      label: 'FmCommonConfirmDialog',
      category: 'Modals',
      x: 5,
      y: 5,
      isBase: true,
    },

    // NAVIGATION CATEGORY (x: 5.5-6.5, y: 4-6)
    {
      id: 'back-button',
      label: 'FmCommonBackButton',
      category: 'Navigation',
      x: 6,
      y: 5.5,
      isBase: true,
    },
    {
      id: 'side-nav',
      label: 'FmCommonSideNav',
      category: 'Navigation',
      x: 6,
      y: 5,
      isBase: true,
    },

    // SEARCH CATEGORY (x: 0-2, y: 1.5-3)
    {
      id: 'search-base',
      label: 'FmCommonSearchDropdown',
      category: 'Search',
      x: 1,
      y: 3,
      isBase: true,
      children: [
        'search-artist',
        'search-event',
        'search-venue',
        'search-city',
      ],
    },
    {
      id: 'search-artist',
      label: 'FmArtistSearchDropdown',
      category: 'Search',
      x: 0.3,
      y: 2,
      parents: ['search-base'],
    },
    {
      id: 'search-event',
      label: 'FmEventSearchDropdown',
      category: 'Search',
      x: 0.8,
      y: 2,
      parents: ['search-base'],
    },
    {
      id: 'search-venue',
      label: 'FmVenueSearchDropdown',
      category: 'Search',
      x: 1.2,
      y: 2,
      parents: ['search-base'],
    },
    {
      id: 'search-city',
      label: 'FmCitySearchDropdown',
      category: 'Search',
      x: 1.7,
      y: 2,
      parents: ['search-base'],
    },

    // MISCELLANEOUS CATEGORY (x: 2-4, y: 1.5-3)
    {
      id: 'topographic-bg',
      label: 'TopographicBackground',
      category: 'Misc',
      x: 3,
      y: 3,
      isBase: true,
    },
    {
      id: 'promo-code',
      label: 'FmPromoCodeInput',
      category: 'Misc',
      x: 3,
      y: 2.5,
      isBase: true,
    },
  ];

  const relationships: ComponentRelationship[] = [
    // Badge relationships
    { from: 'badge-group', to: 'badge', type: 'uses' },
    { from: 'stat-card', to: 'badge', type: 'uses' },

    // Button inheritance
    { from: 'button-base', to: 'button-create', type: 'extends' },
    { from: 'button-base', to: 'button-nav', type: 'extends' },

    // Form component composition
    { from: 'form', to: 'form-section', type: 'uses' },
    { from: 'form', to: 'form-field', type: 'uses' },
    { from: 'form', to: 'form-select', type: 'uses' },
    { from: 'form', to: 'form-actions', type: 'uses' },
    { from: 'form', to: 'stack-layout', type: 'uses' },
    { from: 'form-section', to: 'form-field', type: 'uses' },
    { from: 'form-section', to: 'form-select', type: 'uses' },

    // PageHeader composition
    { from: 'page-header', to: 'icon-text', type: 'uses' },
    { from: 'page-header', to: 'stat-card', type: 'uses' },

    // DetailSection composition
    { from: 'detail-section', to: 'icon-text', type: 'uses' },

    // Feedback relationships
    { from: 'loading-overlay', to: 'loading-spinner', type: 'uses' },

    // Search dropdown inheritance
    { from: 'search-base', to: 'search-artist', type: 'extends' },
    { from: 'search-base', to: 'search-event', type: 'extends' },
    { from: 'search-base', to: 'search-venue', type: 'extends' },
    { from: 'search-base', to: 'search-city', type: 'extends' },
  ];

  // Calculate ancestor count for each component
  const calculateAncestorCount = (
    componentId: string,
    visited = new Set<string>()
  ): number => {
    if (visited.has(componentId)) return 0;
    visited.add(componentId);

    const component = components.find(c => c.id === componentId);
    if (!component || !component.parents || component.parents.length === 0) {
      return 0;
    }

    let maxDepth = 0;
    for (const parentId of component.parents) {
      const depth = 1 + calculateAncestorCount(parentId, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  };

  // Create datasets for different categories
  const categoryColors: Record<string, string> = {
    Buttons: 'rgba(236, 72, 153, 0.8)', // Pink
    'Cards & Display': 'rgba(212, 175, 55, 0.8)', // Gold
    Data: 'rgba(59, 130, 246, 0.8)', // Blue
    Display: 'rgba(34, 197, 94, 0.8)', // Green
    Feedback: 'rgba(249, 115, 22, 0.8)', // Orange
    'Form Inputs': 'rgba(168, 85, 247, 0.8)', // Purple
    'Form System': 'rgba(147, 51, 234, 0.8)', // Darker Purple
    Layout: 'rgba(99, 102, 241, 0.8)', // Indigo
    Modals: 'rgba(239, 68, 68, 0.8)', // Red
    Navigation: 'rgba(20, 184, 166, 0.8)', // Teal
    Search: 'rgba(16, 185, 129, 0.8)', // Emerald
    Misc: 'rgba(156, 163, 175, 0.8)', // Gray
  };

  const datasets = Object.keys(categoryColors).map(category => ({
    label: category,
    data: components
      .filter(c => c.category === category)
      .map(c => {
        const ancestorCount = calculateAncestorCount(c.id);
        return {
          x: c.x,
          y: c.y,
          label: c.label,
          id: c.id,
          isBase: c.isBase,
          ancestorCount,
        };
      }),
    backgroundColor: categoryColors[category],
    borderColor: categoryColors[category].replace('0.8', '1'),
    borderWidth: 2,
    pointRadius: (context: any) => {
      const point = context.raw;
      if (!point) return 6;
      // Base size + 3px per ancestor
      const baseSize = point.isBase ? 8 : 5;
      return baseSize + point.ancestorCount * 3;
    },
    pointHoverRadius: (context: any) => {
      const point = context.raw;
      if (!point) return 10;
      const baseSize = point.isBase ? 12 : 8;
      return baseSize + point.ancestorCount * 3;
    },
  }));

  const chartData = {
    datasets,
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(203, 213, 225)',
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
        },
      },
      title: {
        display: true,
        text: 'Component Relationships - Click and drag to pan, scroll to zoom',
        color: 'rgb(212, 175, 55)',
        font: {
          size: 16,
          family: 'Canela, serif',
        },
        padding: {
          bottom: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: 'rgb(212, 175, 55)',
        bodyColor: 'rgb(229, 231, 235)',
        borderColor: 'rgb(212, 175, 55)',
        borderWidth: 2,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function () {
            return 'Component Details';
          },
          label: function (context: any) {
            const point = context.raw;
            const component = components.find(c => c.id === point.id);
            const lines = [
              `Name: ${point.label}`,
              `Category: ${component?.category || 'Unknown'}`,
              `Ancestor Depth: ${point.ancestorCount || 0}`,
            ];

            if (component?.isBase) {
              lines.push('Type: Base Component');
            }

            if (component?.parents && component.parents.length > 0) {
              const parentLabels = component.parents
                .map(parentId => components.find(c => c.id === parentId)?.label)
                .filter(Boolean);
              lines.push(`Uses: ${parentLabels.join(', ')}`);
            }

            if (component?.children && component.children.length > 0) {
              const childLabels = component.children
                .map(childId => components.find(c => c.id === childId)?.label)
                .filter(Boolean);
              lines.push(`Extended by: ${childLabels.join(', ')}`);
            }

            return lines;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
          modifierKey: null,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
        },
        limits: {
          x: { min: -2, max: 9 },
          y: { min: 0, max: 11 },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: -0.5,
        max: 7,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 1,
        max: 9.5,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
        },
        ticks: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Draw connection lines after chart renders
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;

    // Custom plugin to draw relationship lines and labels
    const drawLinesAndLabels = () => {
      const meta = chart.getDatasetMeta(0);
      if (!meta) return;

      // Draw relationship lines first (so they appear behind nodes)
      relationships.forEach(rel => {
        const fromComponent = components.find(c => c.id === rel.from);
        const toComponent = components.find(c => c.id === rel.to);

        if (!fromComponent || !toComponent) return;

        // Find the pixel positions
        const fromX = chart.scales.x.getPixelForValue(fromComponent.x);
        const fromY = chart.scales.y.getPixelForValue(fromComponent.y);
        const toX = chart.scales.x.getPixelForValue(toComponent.x);
        const toY = chart.scales.y.getPixelForValue(toComponent.y);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);

        if (rel.type === 'extends') {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
        } else {
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
        }

        ctx.stroke();
        ctx.restore();
      });

      // Draw labels for each component
      components.forEach(component => {
        const x = chart.scales.x.getPixelForValue(component.x);
        const y = chart.scales.y.getPixelForValue(component.y);
        const ancestorCount = calculateAncestorCount(component.id);

        ctx.save();

        // Label styling - bigger for components with more ancestors
        const fontSize = component.isBase ? 11 : 10;
        ctx.font = component.isBase
          ? `bold ${fontSize}px sans-serif`
          : `${fontSize}px sans-serif`;
        ctx.fillStyle = 'rgb(226, 232, 240)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Add a semi-transparent background for better readability
        const textMetrics = ctx.measureText(component.label);
        const textWidth = textMetrics.width;
        const textHeight = 14;
        const padding = 4;
        // Offset increases with ancestor count
        const offsetY = (component.isBase ? 16 : 12) + ancestorCount * 3;

        // Draw background rectangle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(
          x - textWidth / 2 - padding,
          y + offsetY - padding / 2,
          textWidth + padding * 2,
          textHeight + padding
        );

        // Draw border
        ctx.strokeStyle =
          ancestorCount > 0
            ? 'rgba(212, 175, 55, 0.5)'
            : 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = ancestorCount > 0 ? 1.5 : 1;
        ctx.strokeRect(
          x - textWidth / 2 - padding,
          y + offsetY - padding / 2,
          textWidth + padding * 2,
          textHeight + padding
        );

        // Draw text
        ctx.fillStyle = component.isBase
          ? 'rgb(212, 175, 55)'
          : 'rgb(226, 232, 240)';
        ctx.fillText(component.label, x, y + offsetY + padding);

        ctx.restore();
      });
    };

    // Register the plugin
    const plugin = {
      id: 'relationshipLinesAndLabels',
      afterDatasetsDraw: drawLinesAndLabels,
    };

    chart.config.plugins?.push(plugin);
    chart.update();

    return () => {
      const index = chart.config.plugins?.findIndex(
        (p: any) => p.id === 'relationshipLinesAndLabels'
      );
      if (index !== undefined && index > -1) {
        chart.config.plugins?.splice(index, 1);
      }
    };
  }, []);

  return (
    <div className='space-y-4'>
      <div className='h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-6 border border-border shadow-2xl'>
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Legend */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
        <div className='space-y-2 p-4 bg-muted/50 rounded-lg border border-border'>
          <h4 className='font-semibold text-fm-gold'>Visual Guide</h4>
          <ul className='space-y-1 text-muted-foreground'>
            <li className='flex items-center gap-2'>
              <div className='w-4 h-4 rounded-full bg-fm-gold'></div>
              <span>Larger bubbles = More ancestors (composed/extended)</span>
            </li>
            <li className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-muted-foreground'></div>
              <span>Smaller bubbles = Base components</span>
            </li>
            <li className='flex items-center gap-2'>
              <div
                className='w-8 h-0.5 bg-fm-gold/40'
                style={{ borderTop: '2px dashed' }}
              ></div>
              <span>Inheritance (extends)</span>
            </li>
            <li className='flex items-center gap-2'>
              <div
                className='w-8 h-0.5 bg-muted-foreground/20'
                style={{ borderTop: '1px dashed' }}
              ></div>
              <span>Composition (uses)</span>
            </li>
            <li className='text-xs italic mt-2'>
              Click and drag to pan • Scroll to zoom
            </li>
          </ul>
        </div>

        <div className='space-y-2 p-4 bg-muted/50 rounded-lg border border-border'>
          <h4 className='font-semibold text-fm-gold'>Component Categories</h4>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className='flex items-center gap-2'>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: color }}
                ></div>
                <span className='text-muted-foreground'>{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='p-4 bg-muted/50 rounded-lg border border-border'>
        <h4 className='font-semibold text-fm-gold mb-2'>Key Relationships</h4>
        <ul className='text-sm text-muted-foreground space-y-1'>
          <li>
            • <span className='text-foreground'>FmCommonForm</span> composes
            FormSection, FormField, FormSelect, FormActions, and StackLayout
          </li>
          <li>
            • <span className='text-foreground'>SearchDropdown</span> has 4
            specialized implementations (Artist, Event, Venue, City)
          </li>
          <li>
            • <span className='text-foreground'>FmCommonButton</span> extends to
            CreateButton and NavigationButton
          </li>
          <li>
            • <span className='text-foreground'>PageHeader</span> uses
            IconWithText and StatCard for rich headers
          </li>
          <li>
            • Components organized by catalog categories - matches the sidebar
            structure
          </li>
        </ul>
      </div>
    </div>
  );
}
