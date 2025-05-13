// store/market/useMarketDataStore.ts
// 作成: チャート表示用のマーケットデータを管理するストア

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChartTimeframe, MarketDataStoreState, ChartData } from '@/types/chartModels';
import { TIMEFRAME_MAP_SPOT } from '@/types/chart';
import { logger } from '@/utils/logger';

// ダミーデータを生成する関数
function generateDummyData(timeframe: ChartTimeframe): ChartData {
  const now = Date.now();
  const candleCount = 100;
  const msPerCandle = getMillisecondsPerCandle(timeframe);
  
  const candles = Array.from({ length: candleCount }, (_, i) => {
    const timestamp = now - (candleCount - i) * msPerCandle;
    const basePrice = 50000 + Math.random() * 1000;
    const volatility = basePrice * 0.01;
    
    const open = basePrice - volatility + Math.random() * 2 * volatility;
    const close = open - volatility + Math.random() * 2 * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    return {
      time: timestamp,
      open,
      high,
      low,
      close,
      volume: 100 + Math.random() * 900
    };
  });
  
  return {
    candles,
    timestamp: now
  };
}

// タイムフレームからミリ秒単位の期間を取得
function getMillisecondsPerCandle(timeframe: ChartTimeframe): number {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  switch (timeframe) {
    case '1m': return minute;
    case '3m': return 3 * minute;
    case '5m': return 5 * minute;
    case '15m': return 15 * minute;
    case '30m': return 30 * minute;
    case '1h': return hour;
    case '2h': return 2 * hour;
    case '4h': return 4 * hour;
    case '6h': return 6 * hour;
    case '8h': return 8 * hour;
    case '12h': return 12 * hour;
    case '1d': return day;
    case '3d': return 3 * day;
    case '1w': return week;
    case '1M': return month;
    default: return hour;
  }
}

// ストアの初期状態
const initialState = {
  marketData: null,
  isLoading: false,
  error: null,
};

/**
 * マーケットデータを管理するストア
 * 実際のAPIを使用する場合は、APIの呼び出しを実装する
 */
export const useMarketDataStore = create<MarketDataStoreState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // マーケットデータを取得
      fetchMarketData: async (timeframe) => {
        set({ isLoading: true });
        
        try {
          // 実際の実装ではここでAPIを呼び出す
          // ダミーデータを生成して返す
          const dummyData = generateDummyData(timeframe);
          
          // 少し遅延を入れてローディング状態をシミュレート
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({ 
            marketData: dummyData,
            isLoading: false,
            error: null
          });
          
          logger.info(`${timeframe}のマーケットデータを取得しました`, { 
            candleCount: dummyData.candles.length 
          });
          
          return dummyData;
        } catch (error) {
          logger.error('マーケットデータの取得に失敗しました', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          });
          throw error;
        }
      },

      // マーケットデータをリセット
      resetMarketData: () => set({ marketData: null, error: null }),
    }),
    { name: 'market-data-store' }
  )
); 