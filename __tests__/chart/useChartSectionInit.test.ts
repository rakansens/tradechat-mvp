/**
 * __tests__/chart/useChartSectionInit.test.ts
 * チャートセクション初期化フックのテスト
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSectionのリファクタリングに伴い作成
 * - 2025-10-09: S-10.2フェーズ: ExchangeType型の一貫性を確保
 */

import { renderHook } from '@testing-library/react';
import { useChartSectionInit } from '@/hooks/chart/useChartSectionInit';
import { useSymbolStore } from '@/store/symbol';
import { useChartDataStore } from '@/store/chart/data';
import { type ExchangeType } from '@/types/constants/enums';
import { safeExchangeType } from '@/utils/exchangeTypeUtils';

// ストアをモック
jest.mock('@/store/symbol', () => ({
  useSymbolStore: {
    getState: jest.fn().mockReturnValue({
      currentSymbol: 'BTCUSDT'
    })
  }
}));

jest.mock('@/store/chart/data', () => ({
  useChartDataStore: {
    getState: jest.fn().mockReturnValue({
      currentTimeFrame: '1h'
    })
  }
}));

// ロガーをモック
jest.mock('@/utils/common/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// モックされたエクスチェンジタイプ
const MOCK_EXCHANGE_TYPES = {
  SPOT: 'bitget' as ExchangeType,
  FUTURES: 'demo' as ExchangeType
};

describe('useChartSectionInit', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期化時にinitializeApiが正しく呼び出される', () => {
    // モックハンドラ
    const initializeApiMock = jest.fn();
    const fetchChartDataMock = jest.fn();
    
    // フックをレンダリング
    renderHook(() => 
      useChartSectionInit({
        currentSymbol: 'BTCUSDT',
        currentTimeFrame: '1h',
        exchangeType: MOCK_EXCHANGE_TYPES.SPOT,
        initializeApi: initializeApiMock,
        fetchChartData: fetchChartDataMock
      })
    );
    
    // 初期化時にinitializeApiが1回呼び出されることを検証
    expect(initializeApiMock).toHaveBeenCalledTimes(2); // 2つのuseEffectがあるため
    expect(initializeApiMock).toHaveBeenCalledWith(MOCK_EXCHANGE_TYPES.SPOT);
    
    // 初期化時にfetchChartDataが1回呼び出されることを検証
    expect(fetchChartDataMock).toHaveBeenCalledTimes(1);
    expect(fetchChartDataMock).toHaveBeenCalledWith('BTCUSDT', '1h');
  });
  
  test('exchangeTypeが変更されたときに再初期化される', () => {
    // モックハンドラ
    const initializeApiMock = jest.fn();
    const fetchChartDataMock = jest.fn();
    
    // フックをレンダリング
    const { rerender } = renderHook(
      (props: { exchangeType: ExchangeType }) => useChartSectionInit({
        currentSymbol: 'BTCUSDT',
        currentTimeFrame: '1h',
        exchangeType: props.exchangeType,
        initializeApi: initializeApiMock,
        fetchChartData: fetchChartDataMock
      }),
      { initialProps: { exchangeType: MOCK_EXCHANGE_TYPES.SPOT } }
    );
    
    // 初期化時の呼び出しをリセット
    initializeApiMock.mockClear();
    fetchChartDataMock.mockClear();
    
    // exchangeTypeを変更して再レンダリング
    rerender({ exchangeType: MOCK_EXCHANGE_TYPES.FUTURES });
    
    // exchangeTypeが変更されたときにinitializeApiが再度呼び出されることを検証
    expect(initializeApiMock).toHaveBeenCalledTimes(2); // 2つのuseEffectのうち、exchangeTypeが依存配列にある2つが実行される
    expect(initializeApiMock).toHaveBeenCalledWith(MOCK_EXCHANGE_TYPES.FUTURES);
  });
  
  test('fetchData関数が正しく動作する', () => {
    // モックハンドラ
    const initializeApiMock = jest.fn();
    const fetchChartDataMock = jest.fn();
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useChartSectionInit({
        currentSymbol: 'BTCUSDT',
        currentTimeFrame: '1h',
        exchangeType: MOCK_EXCHANGE_TYPES.SPOT,
        initializeApi: initializeApiMock,
        fetchChartData: fetchChartDataMock
      })
    );
    
    // 初期化時の呼び出しをリセット
    initializeApiMock.mockClear();
    fetchChartDataMock.mockClear();
    
    // fetchData関数を呼び出す
    result.current.fetchData();
    
    // fetchChartDataが呼び出されることを検証
    expect(fetchChartDataMock).toHaveBeenCalledTimes(1);
    expect(fetchChartDataMock).toHaveBeenCalledWith('BTCUSDT', '1h');
  });
  
  test('fetchChartDataがundefinedの場合にエラーログが出力される', () => {
    // モックハンドラ
    const initializeApiMock = jest.fn();
    const fetchChartDataMock = undefined;
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useChartSectionInit({
        currentSymbol: 'BTCUSDT',
        currentTimeFrame: '1h',
        exchangeType: MOCK_EXCHANGE_TYPES.SPOT,
        initializeApi: initializeApiMock,
        fetchChartData: fetchChartDataMock as any
      })
    );
    
    // 初期化時の呼び出しをリセット
    initializeApiMock.mockClear();
    
    // fetchData関数を呼び出す
    result.current.fetchData();
    
    // エラーログが出力されることを検証
    expect(require('@/utils/common/logger').logger.error).toHaveBeenCalled();
  });
}); 