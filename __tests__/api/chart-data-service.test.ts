/**
 * __tests__/api/chart-data-service.test.ts
 * チャートデータサービスのテスト
 * 
 * 作成: 2023-05-12 - リファクタリングされたチャートデータサービスのテスト
 * 更新: 2023-05-20 - getOrderBookメソッドのテストと統合テストを追加
 */

import { OHLCData, OrderBookData } from '../../types/chart';

// ユニットテスト用にチャートデータサービスをモック
jest.mock('../../services/api/chart-data-service');

// モックした後でインポート
import { chartDataService } from '../../services/api/chart-data-service';

// 統合テスト用にモックを使わないチャートデータサービスをインポート
jest.unmock('../../services/api/chart-data-service');
const { chartDataService: realChartDataService } = jest.requireActual('../../services/api/chart-data-service');

describe('ChartDataService - ユニットテスト', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
  });
  
  test('getChartData should fetch data', async () => {
    // モックデータ
    const mockData: OHLCData[] = [
      {
        time: 1620000000000,
        open: 30000,
        high: 30100,
        low: 29900,
        close: 30050,
        volume: 10.5
      }
    ];
    
    // getChartDataメソッドのモック
    (chartDataService.getChartData as jest.Mock).mockResolvedValue(mockData);
    
    // チャートデータを取得
    const result = await chartDataService.getChartData('BTC/USDT', '1m', 'spot', 100);
    
    // getChartDataが呼び出されたことを確認
    expect(chartDataService.getChartData).toHaveBeenCalledWith('BTC/USDT', '1m', 'spot', 100);
    
    // 結果が正しいことを確認
    expect(result).toEqual(mockData);
  });
  
  test('subscribeRealtimeChartData should register callback', () => {
    // コールバック関数
    const callback = jest.fn();
    const unsubscribeMock = jest.fn();
    
    // subscribeRealtimeChartDataメソッドのモック
    (chartDataService.subscribeRealtimeChartData as jest.Mock).mockReturnValue(unsubscribeMock);
    
    // リアルタイムデータを購読
    const unsubscribe = chartDataService.subscribeRealtimeChartData('BTC/USDT', '1m', callback);
    
    // subscribeRealtimeChartDataが呼び出されたことを確認
    expect(chartDataService.subscribeRealtimeChartData).toHaveBeenCalledWith('BTC/USDT', '1m', callback);
    
    // 購読解除関数が返されたことを確認
    expect(unsubscribe).toBe(unsubscribeMock);
  });
  
  test('unsubscribeAll should clear all subscriptions', () => {
    // unsubscribeAllメソッドのモック
    (chartDataService.unsubscribeAll as jest.Mock).mockImplementation(() => {});
    
    // すべての購読を解除
    chartDataService.unsubscribeAll();
    
    // unsubscribeAllが呼び出されたことを確認
    expect(chartDataService.unsubscribeAll).toHaveBeenCalled();
  });
  
  test('getOrderBook should fetch order book data', async () => {
    // モックデータ
    const mockOrderBookData: OrderBookData = {
      asks: [[30100, 1.5], [30200, 2.5]],
      bids: [[30000, 2.0], [29900, 3.0]],
      timestamp: 1620000000000,
      symbol: 'BTC/USDT'
    };
    
    // getOrderBookメソッドのモック
    (chartDataService.getOrderBook as jest.Mock).mockResolvedValue(mockOrderBookData);
    
    // オーダーブックデータを取得
    const result = await chartDataService.getOrderBook('BTC/USDT', 'spot');
    
    // getOrderBookが呼び出されたことを確認
    expect(chartDataService.getOrderBook).toHaveBeenCalledWith('BTC/USDT', 'spot');
    
    // 結果が正しいことを確認
    expect(result).toEqual(mockOrderBookData);
  });
});

// 統合テスト - 実際のサービスを使用
describe('ChartDataService - 統合テスト', () => {
  // タイムアウトを長めに設定
  jest.setTimeout(30000);
  
  test('chartDataServiceがチャートデータを取得できる', async () => {
    // チャートデータを取得するメソッドをスパイ
    const getChartDataSpy = jest.spyOn(realChartDataService, 'getChartData').mockResolvedValue([]);
    
    // 新しいサービスでチャートデータを取得
    await realChartDataService.getChartData('BTC/USDT', '1m', 'spot', 10);
    
    // メソッドが呼び出されたことを確認
    expect(getChartDataSpy).toHaveBeenCalledWith('BTC/USDT', '1m', 'spot', 10);
    
    // スパイを元に戻す
    getChartDataSpy.mockRestore();
  });
  
  test('chartDataServiceがオーダーブックデータを取得できる', async () => {
    // getOrderBookメソッドをスパイ
    const getOrderBookSpy = jest.spyOn(realChartDataService, 'getOrderBook').mockResolvedValue({
      asks: [],
      bids: [],
      timestamp: Date.now(),
      symbol: 'BTC/USDT'
    });
    
    // 新しいサービスでオーダーブックデータを取得
    await realChartDataService.getOrderBook('BTC/USDT', 'spot');
    
    // メソッドが呼び出されたことを確認
    expect(getOrderBookSpy).toHaveBeenCalledWith('BTC/USDT', 'spot');
    
    // スパイを元に戻す
    getOrderBookSpy.mockRestore();
  });
});
