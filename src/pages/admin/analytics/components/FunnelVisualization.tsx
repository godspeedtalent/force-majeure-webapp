/**
 * Funnel Visualization
 *
 * Visual representation of the conversion funnel.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import type { FunnelSummary } from '@/features/analytics';

interface FunnelVisualizationProps {
  data: FunnelSummary[];
}

export function FunnelVisualization({ data }: FunnelVisualizationProps) {
  // Aggregate all funnel data
  const aggregated = useMemo(() => {
    return data.reduce(
      (acc, item) => ({
        eventViews: acc.eventViews + item.event_views,
        ticketTierViews: acc.ticketTierViews + item.ticket_tier_views,
        addToCarts: acc.addToCarts + item.add_to_carts,
        checkoutStarts: acc.checkoutStarts + item.checkout_starts,
        checkoutCompletes: acc.checkoutCompletes + item.checkout_completes,
        checkoutAbandons: acc.checkoutAbandons + item.checkout_abandons,
        cartAbandons: acc.cartAbandons + item.cart_abandons,
        totalRevenue: acc.totalRevenue + (item.total_revenue_cents || 0),
      }),
      {
        eventViews: 0,
        ticketTierViews: 0,
        addToCarts: 0,
        checkoutStarts: 0,
        checkoutCompletes: 0,
        checkoutAbandons: 0,
        cartAbandons: 0,
        totalRevenue: 0,
      }
    );
  }, [data]);

  const stages = [
    {
      name: 'Event views',
      value: aggregated.eventViews,
      color: 'bg-blue-500',
    },
    {
      name: 'Ticket tier views',
      value: aggregated.ticketTierViews,
      color: 'bg-cyan-500',
    },
    {
      name: 'Add to cart',
      value: aggregated.addToCarts,
      color: 'bg-green-500',
    },
    {
      name: 'Checkout start',
      value: aggregated.checkoutStarts,
      color: 'bg-yellow-500',
    },
    {
      name: 'Checkout complete',
      value: aggregated.checkoutCompletes,
      color: 'bg-fm-gold',
    },
  ];

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  // Calculate conversion rates
  const conversionRates = stages.slice(1).map((stage, index) => {
    const previousValue = stages[index].value;
    if (previousValue === 0) return 0;
    return (stage.value / previousValue) * 100;
  });

  const overallConversion = aggregated.eventViews > 0
    ? (aggregated.checkoutCompletes / aggregated.eventViews) * 100
    : 0;

  if (aggregated.eventViews === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No funnel data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-canela">Conversion funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Funnel visualization */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const conversionRate = index > 0 ? conversionRates[index - 1] : null;

            return (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium font-canela">{stage.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {stage.value.toLocaleString()}
                    </span>
                    {conversionRate !== null && (
                      <span
                        className={`text-xs ${
                          conversionRate >= 50
                            ? 'text-green-400'
                            : conversionRate >= 25
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {conversionRate.toFixed(1)}% conversion
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-white/5 relative">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${Math.max(width, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/10">
          <div>
            <div className="text-2xl font-bold font-canela text-fm-gold">
              {overallConversion.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">Overall conversion rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela">
              ${(aggregated.totalRevenue / 100).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-canela text-red-400">
              {aggregated.checkoutAbandons + aggregated.cartAbandons}
            </div>
            <div className="text-xs text-muted-foreground">Total abandons</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
