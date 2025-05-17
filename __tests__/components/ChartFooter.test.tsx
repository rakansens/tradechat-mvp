import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChartFooter } from '@/components/chart/container/ChartFooter';
import type { DrawingToolType } from '@/types/store/chart';

// simple helpers
const noop = () => {};

describe('ChartFooter null activeDrawingTools', () => {
  it('renders without active class when activeDrawingTools is null', () => {
    render(
      <ChartFooter
        activeIndicators={[]}
        activeDrawingTools={null as unknown as DrawingToolType[]}
        handleToggleIndicator={noop}
        handleToggleDrawingTool={noop}
        clearAllIndicators={noop}
        clearAllDrawingTools={noop}
      />
    );

    const fibButton = screen.getByText('Fibonacci');
    expect(fibButton.className).toBe('');
  });
});
