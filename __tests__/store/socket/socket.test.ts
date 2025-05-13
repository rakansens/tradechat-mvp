// __tests__/store/socket/socket.test.ts
// SocketSliceのテスト

import { getSocketService } from '@/services/socket';
import { useRootStore } from '@/store/rootStore';

// ソケットサービスのモック
jest.mock('@/services/socket', () => ({
  getSocketService: jest.fn()
}));

describe('SocketSlice', () => {
  // テスト前に各関数をリセット
  beforeEach(() => {
    // ストアをリセット
    useRootStore.setState({
      connected: false,
      subscriptions: { orderbook: false, chart: false },
      _unsubscribeFns: {}
    });
    
    // モックをリセット
    jest.clearAllMocks();
  });
  
  describe('setConnected', () => {
    it('接続状態を更新できること', () => {
      // 実行
      useRootStore.getState().setConnected(true);
      
      // 検証
      expect(useRootStore.getState().connected).toBe(true);
    });
    
    it('接続が切断された場合、購読状態がリセットされること', () => {
      // セットアップ - 購読を追加
      const unsubscribeMock = jest.fn();
      useRootStore.getState().setSubscription('chart', true, unsubscribeMock);
      
      // 検証 - 購読が追加されていること
      expect(useRootStore.getState().subscriptions.chart).toBe(true);
      
      // 実行 - 接続を切断
      useRootStore.getState().setConnected(false);
      useRootStore.getState().unsubscribeAll();
      
      // 検証 - 購読が解除されていること
      expect(useRootStore.getState().subscriptions.chart).toBe(false);
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
  
  describe('setSubscription', () => {
    it('購読を追加できること', () => {
      // セットアップ
      const unsubscribeMock = jest.fn();
      
      // 実行
      useRootStore.getState().setSubscription('orderbook', true, unsubscribeMock);
      
      // 検証
      expect(useRootStore.getState().subscriptions.orderbook).toBe(true);
    });
    
    it('購読を解除できること', () => {
      // セットアップ - 購読を追加
      const unsubscribeMock = jest.fn();
      useRootStore.getState().setSubscription('orderbook', true, unsubscribeMock);
      
      // 実行 - 購読を解除
      useRootStore.getState().setSubscription('orderbook', false);
      
      // 検証
      expect(useRootStore.getState().subscriptions.orderbook).toBe(false);
      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
  
  describe('unsubscribeAll', () => {
    it('すべての購読を解除できること', () => {
      // セットアップ - 複数の購読を追加
      const unsubscribeMock1 = jest.fn();
      const unsubscribeMock2 = jest.fn();
      useRootStore.getState().setSubscription('orderbook', true, unsubscribeMock1);
      useRootStore.getState().setSubscription('chart', true, unsubscribeMock2);
      
      // 実行
      useRootStore.getState().unsubscribeAll();
      
      // 検証
      expect(useRootStore.getState().subscriptions.orderbook).toBe(false);
      expect(useRootStore.getState().subscriptions.chart).toBe(false);
      expect(unsubscribeMock1).toHaveBeenCalled();
      expect(unsubscribeMock2).toHaveBeenCalled();
    });
  });
  
  describe('getWebSocketStatus', () => {
    it('WebSocketの状態を取得できること', () => {
      // セットアップ
      useRootStore.setState({
        connected: true,
        subscriptions: { orderbook: true, chart: false }
      });
      
      // 実行
      const status = useRootStore.getState().getWebSocketStatus();
      
      // 検証
      expect(status).toEqual({
        connected: true,
        subscriptions: { orderbook: true, chart: false }
      });
    });
  });
}); 