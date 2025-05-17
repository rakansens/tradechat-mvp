import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChartFooter } from '@/components/chart/container/ChartFooter';
import type { DrawingToolType } from '@/types/store/chart';

// simple helpers
const noop = () => {};

describe('ChartFooter null activeDrawingTool', () => {
  it('renders without active class when activeDrawingTool is null', () => {
    render(
      <ChartFooter
        activeIndicators={[]}
        activeDrawingTool={null as unknown as DrawingToolType}
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
