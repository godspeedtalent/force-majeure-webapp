import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { QUALITATIVE_RATING_OPTIONS } from '../config/reviewMetrics';
import { QualitativeMetricSelector } from './QualitativeMetricSelector';

describe('QualitativeMetricSelector', () => {
  const hoverMetric = {
    id: 'trackSelection',
    title: 'Track Selection & Musical Identity',
    descriptor: 'Descriptor',
    tooltips: {
      0: 'Zero tooltip',
      1: 'One tooltip',
      2: 'Two tooltip',
      3: 'Three tooltip',
      4: 'Four tooltip',
    },
  } as const;

  it.each(
    QUALITATIVE_RATING_OPTIONS.map(option => [option.label, option] as const)
  )('reveals tooltip text for %s on hover', async (_label, option) => {
    const user = userEvent.setup();
    render(
      <QualitativeMetricSelector metric={hoverMetric} value={2} onChange={() => {}} />
    );

    const button = screen.getByRole('radio', {
      name: `${hoverMetric.title}: ${option.label}`,
    });

    await user.hover(button);
    const tooltipMatches = await screen.findAllByText(
      hoverMetric.tooltips[option.value]
    );
    expect(tooltipMatches.length).toBeGreaterThanOrEqual(1);
    await user.unhover(button);
  });

  it('shows tooltip when an option gains keyboard focus', async () => {
    const metric = {
      id: 'flowEnergy',
      title: 'Flow & Energy Management',
      descriptor: 'Descriptor',
      tooltips: {
        0: 'Flow zero',
        1: 'Flow one',
        2: 'Flow two',
        3: 'Flow three',
        4: 'Flow four',
      },
    } as const;

    render(
      <QualitativeMetricSelector metric={metric} value={1} onChange={() => {}} />
    );

    const option = screen.getByRole('radio', {
      name: `${metric.title}: Disliked`,
    });
    fireEvent.focus(option);

    const tooltipMatches = await screen.findAllByText(metric.tooltips[1]);
    expect(tooltipMatches.length).toBeGreaterThanOrEqual(1);
  });
});
