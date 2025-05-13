// __tests__/lightweight-charts.js
// Jest stub for lightweight-charts to allow running chart-related code in Node.

const noop = () => {};

module.exports = {
  CrosshairMode: { Normal: 0 },
  LineStyle: {},
  LineWidth: {},
  createChart: jest.fn(() => ({
    remove: noop,
    applyOptions: noop,
    subscribeCrosshairMove: noop,
    unsubscribeCrosshairMove: noop,
    timeScale: () => ({
      fitContent: noop,
      setVisibleRange: noop,
    }),
    addLineSeries: jest.fn(() => ({ setData: noop, setMarkers: noop, applyOptions: noop })),
    addAreaSeries: jest.fn(() => ({ setData: noop })),
    addCandlestickSeries: jest.fn(() => ({ setData: noop })),
  })),
};
