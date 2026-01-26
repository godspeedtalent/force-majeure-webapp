/**
 * Site Health Report Formatter
 *
 * Converts a SiteHealthReport object to an AI-optimized markdown format.
 * The output is designed to be easily parsed by Claude for analysis
 * and recommendations on site efficiency, performance, and reliability.
 */

import type { SiteHealthReport, WebVitalSummary, ErrorHealthSection } from '../types/siteHealth';

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a number with commas for thousands
 */
function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format cents to dollars
 */
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a metric value with its unit
 */
function formatMetricValue(value: number, unit: string): string {
  if (unit === 'ms') return formatDuration(value);
  if (unit === '') return value.toFixed(3); // CLS is unitless
  return `${value}${unit}`;
}

/**
 * Get rating emoji
 */
function getRatingEmoji(rating: string): string {
  switch (rating) {
    case 'good':
      return '🟢';
    case 'needs-improvement':
      return '🟡';
    case 'poor':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Get trend arrow
 */
function getTrendArrow(trend: string, percentChange: number): string {
  switch (trend) {
    case 'increasing':
      return `📈 +${percentChange}%`;
    case 'decreasing':
      return `📉 ${percentChange}%`;
    default:
      return '➡️ Stable';
  }
}

/**
 * Format the site health report to AI-readable markdown
 */
export function formatSiteHealthReport(report: SiteHealthReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# Force Majeure Site Health Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.generatedAt).toLocaleString()}`);
  lines.push(`**Report Period:** ${new Date(report.dateRange.start).toLocaleDateString()} to ${new Date(report.dateRange.end).toLocaleDateString()} (${report.dateRange.days} days)`);
  lines.push(`**Environment:** ${report.configuration.environment}`);
  lines.push('');

  // System Overview
  lines.push('## System Overview');
  lines.push('');
  lines.push(`- **Total Sessions:** ${formatNumber(report.overview.totalSessions)}`);
  lines.push(`- **Unique Users:** ${formatNumber(report.overview.uniqueUsers)}`);
  lines.push(`- **Total Page Views:** ${formatNumber(report.overview.totalPageViews)}`);
  lines.push(`- **Avg. Session Duration:** ${formatDuration(report.overview.avgSessionDurationMs)}`);
  lines.push(`- **Avg. Pages/Session:** ${report.overview.avgPagesPerSession.toFixed(1)}`);
  lines.push(`- **Bounce Rate:** ${report.overview.bounceRate.toFixed(1)}%`);
  lines.push(`- **Active Sessions (now):** ${report.overview.activeSessions}`);
  lines.push('');

  // Performance Section
  lines.push('## Performance Metrics (Web Vitals)');
  lines.push('');
  lines.push(`**Overall Health:** ${getRatingEmoji(report.performance.overallRating)} ${report.performance.overallRating.toUpperCase()}`);
  lines.push('');

  if (report.performance.webVitals.length > 0) {
    lines.push('| Metric | P50 | P75 | P95 | Good % | Poor % | Rating |');
    lines.push('|--------|-----|-----|-----|--------|--------|--------|');

    for (const vital of report.performance.webVitals) {
      lines.push(formatWebVitalRow(vital));
    }
    lines.push('');
  } else {
    lines.push('*No performance data available for this period.*');
    lines.push('');
  }

  // Slowest Pages
  if (report.performance.slowestPages.length > 0) {
    lines.push('### Slowest Pages (by P95 load time)');
    lines.push('');
    for (let i = 0; i < report.performance.slowestPages.length; i++) {
      const page = report.performance.slowestPages[i];
      lines.push(`${i + 1}. \`${page.pagePath}\` - P95: ${formatDuration(page.p95LoadTimeMs)}, Avg: ${formatDuration(page.avgLoadTimeMs)} (${page.sampleCount} samples)`);
    }
    lines.push('');
  }

  // Slowest Endpoints
  if (report.performance.slowestEndpoints.length > 0) {
    lines.push('### Slowest API Endpoints');
    lines.push('');
    for (let i = 0; i < report.performance.slowestEndpoints.length; i++) {
      const endpoint = report.performance.slowestEndpoints[i];
      lines.push(`${i + 1}. \`${endpoint.endpoint}\` - P95: ${formatDuration(endpoint.p95ResponseTimeMs)}, Avg: ${formatDuration(endpoint.avgResponseTimeMs)}, Error: ${endpoint.errorRate}% (${endpoint.sampleCount} samples)`);
    }
    lines.push('');
  }

  // Error Summary
  lines.push('## Error Summary');
  lines.push('');
  lines.push(formatErrorSection(report.errors));

  // Conversion Funnel
  lines.push('## Conversion Funnel Health');
  lines.push('');
  lines.push(`- **Event Views:** ${formatNumber(report.funnel.eventViews)}`);
  lines.push(`- **Ticket Tier View Rate:** ${report.funnel.ticketTierViewRate}%`);
  lines.push(`- **Add to Cart Rate:** ${report.funnel.addToCartRate}%`);
  lines.push(`- **Checkout Start Rate:** ${report.funnel.checkoutStartRate}%`);
  lines.push(`- **Conversion Rate:** ${report.funnel.conversionRate}%`);
  lines.push(`- **Cart Abandonment Rate:** ${report.funnel.cartAbandonmentRate}%`);
  lines.push(`- **Checkout Abandonment Rate:** ${report.funnel.checkoutAbandonmentRate}%`);
  lines.push(`- **Total Revenue:** ${formatCurrency(report.funnel.totalRevenueCents)}`);
  if (report.funnel.avgTimeToPurchaseMs) {
    lines.push(`- **Avg. Time to Purchase:** ${formatDuration(report.funnel.avgTimeToPurchaseMs)}`);
  }
  lines.push('');

  // Configuration Status
  lines.push('## Configuration Status');
  lines.push('');

  // Feature Flags Table
  lines.push('### Feature Flags');
  lines.push('');
  lines.push('| Flag | Status |');
  lines.push('|------|--------|');
  for (const flag of report.configuration.featureFlags) {
    const status = flag.enabled ? '✅ Enabled' : '❌ Disabled';
    lines.push(`| ${flag.displayName} | ${status} |`);
  }
  lines.push('');

  // Analytics Config
  lines.push('### Analytics Configuration');
  lines.push('');
  lines.push(`- **Tracking:** ${report.configuration.analyticsConfig.trackingEnabled ? 'Enabled' : 'Disabled'}`);
  lines.push(`- **Web Vitals:** ${report.configuration.analyticsConfig.webVitalsEnabled ? 'Enabled' : 'Disabled'}`);
  lines.push(`- **Error Logging:** ${report.configuration.analyticsConfig.errorLoggingEnabled ? 'Enabled' : 'Disabled'}`);
  lines.push(`- **Sample Rate:** ${(report.configuration.analyticsConfig.sampleRate * 100).toFixed(0)}%`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push('*Report optimized for AI analysis. Paste into Claude for recommendations on site efficiency, performance, and reliability.*');

  return lines.join('\n');
}

/**
 * Format a single Web Vital row
 */
function formatWebVitalRow(vital: WebVitalSummary): string {
  const p50 = formatMetricValue(vital.p50, vital.unit);
  const p75 = formatMetricValue(vital.p75, vital.unit);
  const p95 = formatMetricValue(vital.p95, vital.unit);
  const ratingEmoji = getRatingEmoji(vital.rating);

  return `| ${vital.displayName} | ${p50} | ${p75} | ${p95} | ${vital.goodPercent}% | ${vital.poorPercent}% | ${ratingEmoji} ${vital.rating} |`;
}

/**
 * Format the error section
 */
function formatErrorSection(errors: ErrorHealthSection): string {
  const lines: string[] = [];

  lines.push(`### Error Count by Level (${getTrendArrow(errors.trend, errors.trendPercentChange)})`);
  lines.push('');
  lines.push(`- **Fatal:** ${errors.countByLevel.fatal}`);
  lines.push(`- **Error:** ${errors.countByLevel.error}`);
  lines.push(`- **Warning:** ${errors.countByLevel.warn}`);
  lines.push(`- **Info:** ${errors.countByLevel.info}`);
  lines.push(`- **Debug:** ${errors.countByLevel.debug}`);
  lines.push(`- **Total:** ${errors.totalCount}`);
  lines.push('');

  if (errors.topErrorPatterns.length > 0) {
    lines.push('### Top Error Patterns');
    lines.push('');
    for (let i = 0; i < errors.topErrorPatterns.length; i++) {
      const pattern = errors.topErrorPatterns[i];
      lines.push(`${i + 1}. **"${pattern.message}"** (${pattern.count} occurrences)`);
      lines.push(`   - Source: ${pattern.source}`);
      lines.push(`   - Last seen: ${new Date(pattern.lastSeen).toLocaleString()}`);
      if (pattern.affectedEndpoints.length > 0) {
        lines.push(`   - Endpoints: ${pattern.affectedEndpoints.join(', ')}`);
      }
    }
    lines.push('');
  }

  if (errors.recentCriticalErrors.length > 0) {
    lines.push('### Recent Critical Errors');
    lines.push('');
    for (const err of errors.recentCriticalErrors) {
      const time = new Date(err.timestamp).toLocaleString();
      let line = `- [${time}] **${err.level.toUpperCase()}** - "${err.message}"`;
      if (err.endpoint) {
        line += ` (${err.endpoint})`;
      }
      if (err.statusCode) {
        line += ` [${err.statusCode}]`;
      }
      lines.push(line);
    }
    lines.push('');
  }

  return lines.join('\n');
}
