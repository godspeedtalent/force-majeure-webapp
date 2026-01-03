/**
 * FmLineChart Component
 *
 * A reusable filled area line chart with uniform tooltip styling,
 * right-click context menu for labeling points, and diamond markers
 * for labeled data points.
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, X } from 'lucide-react';

export interface FmLineChartDataPoint {
  /** Unique identifier for the data point */
  id: string;
  /** X-axis value (typically a date string or category) */
  x: string;
  /** Primary Y value */
  value: number;
  /** Optional secondary values for tooltip display */
  secondaryValues?: Array<{ label: string; value: string | number }>;
  /** Optional label for this point */
  label?: string;
}

export interface FmLineChartProps {
  /** Chart data points */
  data: FmLineChartDataPoint[];
  /** Chart title displayed in header */
  title?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Format function for X-axis labels */
  formatXLabel?: (value: string) => string;
  /** Format function for Y-axis values */
  formatYValue?: (value: number) => string;
  /** Format function for tooltip primary value */
  formatTooltipValue?: (value: number) => string;
  /** Primary color (hex) */
  color?: string;
  /** Chart dimensions */
  width?: number;
  height?: number;
  /** Callback when a point label changes */
  onLabelChange?: (pointId: string, label: string | undefined) => void;
  /** External labels map (for controlled mode) */
  labels?: Record<string, string>;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  pointIndex: number;
}

interface LabelInputState {
  isOpen: boolean;
  pointId: string;
  x: number;
  y: number;
  currentLabel: string;
}

export function FmLineChart({
  data,
  title,
  formatXLabel = (v) => v,
  formatYValue = (v) => v.toLocaleString(),
  formatTooltipValue = (v) => v.toLocaleString(),
  color = '#dfba7d',
  width = 800,
  height = 200,
  onLabelChange,
  labels: externalLabels,
}: FmLineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    pointIndex: -1,
  });
  const [labelInput, setLabelInput] = useState<LabelInputState>({
    isOpen: false,
    pointId: '',
    x: 0,
    y: 0,
    currentLabel: '',
  });
  const [internalLabels, setInternalLabels] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use external labels if provided, otherwise use internal state
  const labels = externalLabels ?? internalLabels;

  // Chart padding
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate max value for scaling
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  // Generate chart points
  const points = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight;
      return { x, y, data: d, index: i };
    });
  }, [data, chartWidth, chartHeight, maxValue, padding.left, padding.top]);

  // Generate SVG paths
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    const linePathStr = points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ');

    const areaPathStr = `${linePathStr} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

    return { linePath: linePathStr, areaPath: areaPathStr };
  }, [points, chartHeight, padding.left, padding.top]);

  // Y-axis ticks
  const yTicks = useMemo(() =>
    [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
      value: Math.round(maxValue * ratio),
      y: padding.top + chartHeight * (1 - ratio),
    })),
  [maxValue, chartHeight, padding.top]);

  // X-axis labels (show subset for readability)
  const xLabels = useMemo(() => {
    if (data.length === 0) return [];

    return data
      .filter((_, i) => i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0)
      .map(d => {
        const index = data.indexOf(d);
        const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
        return { value: d.x, x };
      });
  }, [data, chartWidth, padding.left]);

  // Handle right-click on point
  const handleContextMenu = useCallback((e: React.MouseEvent, pointIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      pointIndex,
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Open label input
  const openLabelInput = useCallback(() => {
    const point = points[contextMenu.pointIndex];
    if (!point) return;

    setLabelInput({
      isOpen: true,
      pointId: point.data.id,
      x: contextMenu.x,
      y: contextMenu.y,
      currentLabel: labels[point.data.id] || '',
    });
    closeContextMenu();
  }, [contextMenu, points, labels, closeContextMenu]);

  // Save label
  const saveLabel = useCallback(() => {
    const trimmedLabel = labelInput.currentLabel.trim();

    if (onLabelChange) {
      onLabelChange(labelInput.pointId, trimmedLabel || undefined);
    } else {
      setInternalLabels(prev => {
        if (trimmedLabel) {
          return { ...prev, [labelInput.pointId]: trimmedLabel };
        } else {
          const { [labelInput.pointId]: _, ...rest } = prev;
          return rest;
        }
      });
    }

    setLabelInput(prev => ({ ...prev, isOpen: false }));
  }, [labelInput, onLabelChange]);

  // Close label input on Escape, save on Enter
  useEffect(() => {
    if (labelInput.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [labelInput.isOpen]);

  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveLabel();
    } else if (e.key === 'Escape') {
      setLabelInput(prev => ({ ...prev, isOpen: false }));
    }
  }, [saveLabel]);

  // Close menus on outside click
  useEffect(() => {
    if (!contextMenu.isOpen) return;

    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.isOpen, closeContextMenu]);

  // Render diamond shape for labeled points
  const renderDiamond = (x: number, y: number, size: number = 6) => {
    const half = size / 2;
    return `M ${x} ${y - half} L ${x + half} ${y} L ${x} ${y + half} L ${x - half} ${y} Z`;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="font-canela text-lg mb-4">{title}</h3>
      )}

      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
        >
          {/* Grid lines */}
          {yTicks.map(tick => (
            <line
              key={tick.value}
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="4 4"
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map(tick => (
            <text
              key={tick.value}
              x={padding.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              fontFamily="monospace"
            >
              {formatYValue(tick.value)}
            </text>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="fmLineChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Filled area */}
          <path d={areaPath} fill="url(#fmLineChartGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points and interaction areas */}
          {points.map((point, i) => {
            const isLabeled = !!labels[point.data.id];
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={point.data.id}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onContextMenu={(e) => handleContextMenu(e, i)}
                className="cursor-pointer"
              >
                {/* Invisible larger hit area centered on point */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="15"
                  fill="transparent"
                />

                {/* Point marker - diamond for labeled, circle for unlabeled */}
                {isLabeled ? (
                  <path
                    d={renderDiamond(point.x, point.y, 10)}
                    fill={color}
                    stroke="#000"
                    strokeWidth="1"
                    className={isHovered ? 'opacity-100' : 'opacity-80'}
                    style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
                  />
                ) : (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={color}
                    stroke="#000"
                    strokeWidth="1"
                    className={isHovered ? 'opacity-100' : 'opacity-0'}
                    style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(label => (
            <text
              key={label.value}
              x={label.x}
              y={height - 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
            >
              {formatXLabel(label.value)}
            </text>
          ))}
        </svg>
      </div>

      {/* Tooltip - rendered as portal to appear on top */}
      {hoveredIndex !== null && points[hoveredIndex] && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: (() => {
              if (!svgRef.current) return 0;
              const svgRect = svgRef.current.getBoundingClientRect();
              const point = points[hoveredIndex];
              const pointXInViewport = svgRect.left + (point.x / width) * svgRect.width;
              // Position tooltip to the right of the point
              return pointXInViewport + 15;
            })(),
            top: (() => {
              if (!svgRef.current) return 0;
              const svgRect = svgRef.current.getBoundingClientRect();
              const point = points[hoveredIndex];
              const pointYInViewport = svgRect.top + (point.y / height) * svgRect.height;
              return pointYInViewport - 30;
            })(),
          }}
        >
          <div className="bg-black/95 border border-white/20 px-3 py-2 shadow-lg">
            <div className="text-xs font-bold text-white mb-1">
              {formatXLabel(points[hoveredIndex].data.x)}
            </div>
            <div className="text-sm" style={{ color }}>
              {formatTooltipValue(points[hoveredIndex].data.value)}
            </div>
            {points[hoveredIndex].data.secondaryValues?.map((sv, i) => (
              <div key={i} className="text-xs text-white/70 mt-0.5">
                {sv.label}: {sv.value}
              </div>
            ))}
            {labels[points[hoveredIndex].data.id] && (
              <div className="text-xs text-fm-gold mt-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {labels[points[hoveredIndex].data.id]}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Context Menu */}
      {contextMenu.isOpen && createPortal(
        <div
          className="fixed z-[9999] bg-black/95 border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50 py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-fm-gold/10 transition-colors"
            onClick={openLabelInput}
          >
            <Tag className="h-4 w-4" />
            <span>Label</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors text-muted-foreground"
            onClick={closeContextMenu}
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>,
        document.body
      )}

      {/* Label Input */}
      {labelInput.isOpen && createPortal(
        <div
          className="fixed z-[9999] bg-black/95 border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50 p-3 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
          style={{ left: labelInput.x, top: labelInput.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs uppercase text-muted-foreground mb-2 block">
            Point label
          </label>
          <input
            ref={inputRef}
            type="text"
            value={labelInput.currentLabel}
            onChange={(e) => setLabelInput(prev => ({ ...prev, currentLabel: e.target.value }))}
            onKeyDown={handleLabelKeyDown}
            className="w-full bg-black/40 border border-white/20 px-2 py-1.5 text-sm focus:border-fm-gold focus:outline-none"
            placeholder="Enter label..."
          />
          <div className="flex gap-2 mt-2">
            <button
              className="flex-1 px-2 py-1 text-xs border border-white/20 hover:bg-white/10 transition-colors"
              onClick={() => setLabelInput(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-2 py-1 text-xs bg-fm-gold/20 border border-fm-gold/40 hover:bg-fm-gold/30 transition-colors text-fm-gold"
              onClick={saveLabel}
            >
              Save
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
