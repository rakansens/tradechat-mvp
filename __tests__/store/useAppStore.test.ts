// __tests__/store/useAppStore.test.ts
// useAppStore.tsのテスト
//
// 主な機能:
// - initializeApp関数のテスト
// - setExchangeType関数のテスト
// - 特にリフレッシュ時に銘柄がリセットされる問題の検証

import { useAppStore } from '../../store';
import { logger } from '../../utils/logger';
import { dataFetchService } from '../../services/dataFetchService';
import { socketService } from '../../services/socketService';

// モック
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// dataFetchServiceのモック
jest.mock('../../services/dataFetchService', () => ({
  dataFetchService: {
    fetchOrderBook: jest.fn(),
    fetchChartData: jest.fn(),
    subscribeOrderBookRealtime: jest.fn(),
    subscribeKlineRealtime: jest.fn(),
    handleSymbolChange: jest.fn()
  }
}));

// socketServiceのモック
jest.mock('../../services/socketService', () => ({
  socketService: {
    isConnected: jest.fn().mockReturnValue(false)
  }
}));

// localStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// setTimeoutのモック
jest.useFakeTimers();

describe('useAppStore', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // ストアの状態をリセット
    useAppStore.setState({
      currentSymbol: 'BTCUSDT',
      exchangeType: 'futures',
      _wsUnsubscribeFunctions: {},
      wsSubscriptions: {
        orderbook: false,
        chart: false
      },
      _pollingTimers: {}
    });
  });
  
  describe('initializeApp', () => {
    it('localStorageに保存されている値を使用して初期化すること', () => {
      // localStorageに値を設定
      mockLocalStorage.setItem('lastUsedSymbol', 'ETHUSDT');
      mockLocalStorage.setItem('lastUsedExchangeType', 'spot');
      
      // initializeApp関数を呼び出し
      const { initializeApp } = useAppStore.getState();
      const result = initializeApp();
      
      // 戻り値を確認
      expect(result).toEqual({
        symbol: 'ETHUSDT',
        exchangeType: 'spot'
      });
      
      // ストアの状態が更新されていることを確認
      const state = useAppStore.getState();
      expect(state.currentSymbol).toBe('ETHUSDT');
      expect(state.exchangeType).toBe('spot');
      
      // データ取得関数が呼ばれることを確認
      expect(dataFetchService.fetchOrderBook).toHaveBeenCalled();
      expect(dataFetchService.fetchChartData).toHaveBeenCalled();
    });
    
    it('localStorageに値がない場合、デフォルト値を使用すること', () => {
      // localStorageをクリア
      mockLocalStorage.clear();
      
      // initializeApp関数を呼び出し
      const { initializeApp } = useAppStore.getState();
      const result = initializeApp();
      
      // 戻り値を確認
      expect(result).toEqual({
        symbol: 'BTCUSDT',
        exchangeType: 'spot'
      });
      
      // ストアの状態が更新されていることを確認
      const state = useAppStore.getState();
      expect(state.currentSymbol).toBe('BTCUSDT'); // デフォルト値
      expect(state.exchangeType).toBe('spot'); // デフォルト値
    });
  });
  
  describe('setExchangeType', () => {
    it('取引種別を変更し、localStorageに保存すること', () => {
      // 初期状態を設定
      useAppStore.setState({
        currentSymbol: 'BTCUSDT',
        exchangeType: 'futures',
        _wsUnsubscribeFunctions: {},
        wsSubscriptions: {
          orderbook: false,
          chart: false
        },
        _pollingTimers: {}
      });
      
      // setExchangeType関数を呼び出し
      const { setExchangeType } = useAppStore.getState();
      setExchangeType('spot');
      
      // ストアの状態が更新されていることを確認
      const state = useAppStore.getState();
      expect(state.exchangeType).toBe('spot');
      
      // localStorageに保存されていることを確認
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastUsedExchangeType', 'spot');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedInstrumentType', 'spot');
      
      // ログが出力されることを確認
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('取引種別を'),
        expect.objectContaining({
          component: 'useAppStore',
          action: 'setExchangeType',
          timestamp: expect.any(Number)
        })
      );
    });
    
    it('同じ取引種別を設定した場合、何も変更されないこと', () => {
      // 初期状態を設定
      useAppStore.setState({
        currentSymbol: 'BTCUSDT',
        exchangeType: 'futures',
        _wsUnsubscribeFunctions: {},
        wsSubscriptions: {
          orderbook: false,
          chart: false
        },
        _pollingTimers: {}
      });
      
      // モックをリセット
      jest.clearAllMocks();
      
      // setExchangeType関数を呼び出し（同じ値）
      const { setExchangeType } = useAppStore.getState();
      setExchangeType('futures');
      
      // ストアの状態が変わらないことを確認
      const state = useAppStore.getState();
      expect(state.exchangeType).toBe('futures');
      
      // ログが出力されることを確認
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('取引種別が既に'),
        expect.objectContaining({
          component: 'useAppStore',
          action: 'setExchangeType',
          timestamp: expect.any(Number)
        })
      );
      
      // データ取得関数が呼ばれないことを確認
      expect(dataFetchService.fetchOrderBook).not.toHaveBeenCalled();
      expect(dataFetchService.fetchChartData).not.toHaveBeenCalled();
    });
  });
});