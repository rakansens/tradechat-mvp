import { createChartCaptureAnalysisTool } from '../../src/mastra/tools/chart-capture';

jest.mock('../../utils/aiUtils', () => ({
  analyzeChartWithAI: jest.fn(async () => ({
    analysis: 'ai analysis',
    recommendation: 'buy',
    confidence: 80
  }))
}));

const { analyzeChartWithAI } = require('../../utils/aiUtils');

describe('chart capture analysis tool', () => {
  it('uses injected request and store functions', async () => {
    const cache = new Map<string, string>();
    const requestCapture = jest.fn().mockResolvedValue('data:image/png;base64,abc');
    const storeChartImage = jest.fn().mockReturnValue('img-1');

    const tool = createChartCaptureAnalysisTool({ requestCapture, storeChartImage, cache });
    const result = await tool.execute({ context: {} } as any);

    expect(requestCapture).toHaveBeenCalled();
    expect(storeChartImage).toHaveBeenCalledWith('data:image/png;base64,abc');
    expect(result.imageId).toBe('img-1');
    expect(analyzeChartWithAI).toHaveBeenCalled();
  });

  it('falls back to cache when store function missing', async () => {
    const cache = new Map<string, string>();
    const requestCapture = jest.fn().mockResolvedValue('data:image/png;base64,xyz');

    const tool = createChartCaptureAnalysisTool({ requestCapture, cache });
    const result = await tool.execute({ context: {} } as any);

    expect(cache.get(result.imageId)).toBe('data:image/png;base64,xyz');
  });
});
