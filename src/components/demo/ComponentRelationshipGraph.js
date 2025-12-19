import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { COMPONENT_NODES, COMPONENT_RELATIONSHIPS, } from './data/componentGraphData';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);
export function ComponentRelationshipGraph() {
    const chartRef = useRef(null);
    const components = COMPONENT_NODES;
    const relationships = COMPONENT_RELATIONSHIPS;
    const calculateAncestorCount = (componentId, visited = new Set()) => {
        if (visited.has(componentId))
            return 0;
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
    const categoryColors = {
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
        pointRadius: (context) => {
            const point = context.raw;
            if (!point)
                return 6;
            // Base size + 3px per ancestor
            const baseSize = point.isBase ? 8 : 5;
            return baseSize + point.ancestorCount * 3;
        },
        pointHoverRadius: (context) => {
            const point = context.raw;
            if (!point)
                return 10;
            const baseSize = point.isBase ? 12 : 8;
            return baseSize + point.ancestorCount * 3;
        },
    }));
    const chartData = {
        datasets,
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'rgb(203, 213, 225)',
                    padding: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                        size: 11,
                        weight: 'bold',
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
                    label: function (context) {
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
                    modifierKey: undefined,
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
        if (!chart)
            return;
        const ctx = chart.ctx;
        // Custom plugin to draw relationship lines and labels
        const drawLinesAndLabels = () => {
            const meta = chart.getDatasetMeta(0);
            if (!meta)
                return;
            // Draw relationship lines first (so they appear behind nodes)
            relationships.forEach(rel => {
                const fromComponent = components.find(c => c.id === rel.from);
                const toComponent = components.find(c => c.id === rel.to);
                if (!fromComponent || !toComponent)
                    return;
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
                }
                else {
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
                ctx.fillRect(x - textWidth / 2 - padding, y + offsetY - padding / 2, textWidth + padding * 2, textHeight + padding);
                // Draw border
                ctx.strokeStyle =
                    ancestorCount > 0
                        ? 'rgba(212, 175, 55, 0.5)'
                        : 'rgba(148, 163, 184, 0.3)';
                ctx.lineWidth = ancestorCount > 0 ? 1.5 : 1;
                ctx.strokeRect(x - textWidth / 2 - padding, y + offsetY - padding / 2, textWidth + padding * 2, textHeight + padding);
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
            const index = chart.config.plugins?.findIndex((p) => p.id === 'relationshipLinesAndLabels');
            if (index !== undefined && index > -1) {
                chart.config.plugins?.splice(index, 1);
            }
        };
    }, []);
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx("div", { className: 'h-[700px] bg-black/60 backdrop-blur-sm rounded-none p-6 border border-white/20 shadow-2xl', children: _jsx(Scatter, { ref: chartRef, data: chartData, options: options }) }), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm', children: [_jsxs("div", { className: 'space-y-2 p-4 bg-muted/50 rounded-lg border border-border', children: [_jsx("h4", { className: 'font-semibold text-fm-gold', children: "Visual Guide" }), _jsxs("ul", { className: 'space-y-1 text-muted-foreground', children: [_jsxs("li", { className: 'flex items-center gap-2', children: [_jsx("div", { className: 'w-4 h-4 rounded-full bg-fm-gold' }), _jsx("span", { children: "Larger bubbles = More ancestors (composed/extended)" })] }), _jsxs("li", { className: 'flex items-center gap-2', children: [_jsx("div", { className: 'w-2 h-2 rounded-full bg-muted-foreground' }), _jsx("span", { children: "Smaller bubbles = Base components" })] }), _jsxs("li", { className: 'flex items-center gap-2', children: [_jsx("div", { className: 'w-8 h-0.5 bg-fm-gold/40', style: { borderTop: '2px dashed' } }), _jsx("span", { children: "Inheritance (extends)" })] }), _jsxs("li", { className: 'flex items-center gap-2', children: [_jsx("div", { className: 'w-8 h-0.5 bg-muted-foreground/20', style: { borderTop: '1px dashed' } }), _jsx("span", { children: "Composition (uses)" })] }), _jsx("li", { className: 'text-xs italic mt-2', children: "Click and drag to pan \u2022 Scroll to zoom" })] })] }), _jsxs("div", { className: 'space-y-2 p-4 bg-muted/50 rounded-lg border border-border', children: [_jsx("h4", { className: 'font-semibold text-fm-gold', children: "Component Categories" }), _jsx("div", { className: 'grid grid-cols-2 gap-2 text-xs', children: Object.entries(categoryColors).map(([category, color]) => (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("div", { className: 'w-3 h-3 rounded-full', style: { backgroundColor: color } }), _jsx("span", { className: 'text-muted-foreground', children: category })] }, category))) })] })] }), _jsxs("div", { className: 'p-4 bg-muted/50 rounded-lg border border-border', children: [_jsx("h4", { className: 'font-semibold text-fm-gold mb-2', children: "Key Relationships" }), _jsxs("ul", { className: 'text-sm text-muted-foreground space-y-1', children: [_jsxs("li", { children: ["\u2022 ", _jsx("span", { className: 'text-foreground', children: "FmCommonForm" }), " composes FormSection, FormField, FormSelect, FormActions, and StackLayout"] }), _jsxs("li", { children: ["\u2022 ", _jsx("span", { className: 'text-foreground', children: "SearchDropdown" }), " has 4 specialized implementations (Artist, Event, Venue, City)"] }), _jsxs("li", { children: ["\u2022 ", _jsx("span", { className: 'text-foreground', children: "FmCommonButton" }), " extends to CreateButton and NavigationButton"] }), _jsxs("li", { children: ["\u2022 ", _jsx("span", { className: 'text-foreground', children: "PageHeader" }), " uses IconWithText and StatCard for rich headers"] }), _jsx("li", { children: "\u2022 Components organized by catalog categories - matches the sidebar structure" })] })] })] }));
}
