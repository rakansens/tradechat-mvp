// __tests__/store/chart.test.ts
// チャートスライスのテスト

import { useRootStore } from '@/store/rootStore'
import { selectTimeframe, selectChartType, selectOHLCData } from '@/store/chart/selectors'
import { DEFAULT_TIMEFRAME } from '@/store/chart/state'
import type { Timeframe } from '@/types/chart'

// モック用のヘルパー関数
const setupStore = () => {
  // テスト前にストアをリセット
  useRootStore.setState({
    timeframe: DEFAULT_TIMEFRAME,
    chartType: 'candles',
    ohlcData: []
  })
}

describe('Chart Slice', () => {
  beforeEach(() => {
    setupStore()
  })

  describe('Selectors', () => {
    it('should select timeframe', () => {
      expect(selectTimeframe(useRootStore.getState())).toBe(DEFAULT_TIMEFRAME)
    })

    it('should select chart type', () => {
      expect(selectChartType(useRootStore.getState())).toBe('candles')
    })

    it('should select OHLC data', () => {
      const testData = useRootStore.getState().ohlcData
      expect(selectOHLCData(useRootStore.getState())).toEqual(testData)
    })
  })

  describe('Actions', () => {
    it('should update timeframe and regenerate OHLC data', () => {
      const newTimeframe: Timeframe = '1h'
      useRootStore.getState().setTimeframe(newTimeframe)
      
      const state = useRootStore.getState()
      expect(state.timeframe).toBe(newTimeframe)
      expect(state.ohlcData.length).toBeGreaterThan(0) // OHLCデータが生成されていること
    })

    it('should update chart type', () => {
      useRootStore.getState().setChartType('line')
      expect(useRootStore.getState().chartType).toBe('line')
    })

    it('should refresh OHLC data', () => {
      const initialData = [...useRootStore.getState().ohlcData]
      useRootStore.getState().refreshOhlcData()
      
      // データが再生成されていることを確認（少なくとも長さは同じ）
      const newData = useRootStore.getState().ohlcData
      expect(newData.length).toBe(initialData.length)
      
      // データが変更されていることを確認（完全一致はしない）
      const isDifferent = newData.some((item, index) => 
        item.close !== initialData[index].close
      )
      expect(isDifferent).toBe(true)
    })
  })
}) 