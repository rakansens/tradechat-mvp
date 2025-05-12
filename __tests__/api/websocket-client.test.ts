/**
 * __tests__/api/websocket-client.test.ts
 * WebSocketクライアントのユニットテスト
 * 
 * 作成: 2025-05-12 - リファクタリングされたWebSocketクライアントのテスト
 */

import { BitgetWebSocketClient } from '../../services/api/bitget/websocket-client';
import { EventEmitter } from 'events';

// WebSocketのモック
class MockWebSocket extends EventEmitter {
  public send = jest.fn();
  public close = jest.fn();
  
  constructor() {
    super();
  }
  
  // Node.js環境でのイベントエミット
  public emit(event: string, ...args: any[]): boolean {
    if (event === 'open') {
      if (this.onopen) this.onopen(args[0]);
    } else if (event === 'message') {
      if (this.onmessage) this.onmessage({ data: args[0] });
    } else if (event === 'error') {
      if (this.onerror) this.onerror(args[0]);
    } else if (event === 'close') {
      if (this.onclose) this.onclose({ code: args[0], reason: args[1] });
    }
    return super.emit(event, ...args);
  }
  
  // ブラウザ環境のイベントハンドラ
  public onopen: ((event: any) => void) | null = null;
  public onmessage: ((event: { data: any }) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onclose: ((event: { code: number, reason: string }) => void) | null = null;
}

// テスト用のタイムアウト設定
jest.setTimeout(5000);

describe('BitgetWebSocketClient', () => {
  let client: BitgetWebSocketClient;
  let mockWs: MockWebSocket;
  
  beforeEach(() => {
    // WebSocketのモック
    mockWs = new MockWebSocket();
    
    // グローバルWebSocketをモック
    global.WebSocket = jest.fn().mockImplementation(() => mockWs) as any;
    
    // クライアントの作成
    client = new BitgetWebSocketClient();
    
    // タイマー関数をモック
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  test('connect should establish WebSocket connection', async () => {
    // 接続プロミス
    const connectPromise = client.connect();
    
    // 接続イベントをエミット
    mockWs.emit('open');
    
    // 接続プロミスが解決されるのを待つ
    await connectPromise;
    
    // WebSocketが作成されたことを確認
    expect(global.WebSocket).toHaveBeenCalled();
  });
  
  test('disconnect should close WebSocket connection', async () => {
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // 切断
    client.disconnect();
    
    // WebSocketが閉じられたことを確認
    expect(mockWs.close).toHaveBeenCalled();
  });
  
  test('subscribeOrderBook should send subscription message', async () => {
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // オーダーブックを購読
    client.subscribeOrderBook('BTC/USDT');
    
    // 購読メッセージが送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"op":"subscribe"')
    );
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"channel":"books"')
    );
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"instId":"BTC/USDT"')
    );
  });
  
  test('subscribeCandles should send subscription message', async () => {
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // ローソク足データを購読
    client.subscribeCandles('BTC/USDT', '1m');
    
    // 購読メッセージが送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"op":"subscribe"')
    );
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"channel":"candle1m"')
    );
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('"instId":"BTC/USDT"')
    );
  });
  
  test('should handle orderbook data message', async () => {
    // イベントリスナー
    const orderBookHandler = jest.fn();
    client.on('orderbook', orderBookHandler);
    
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // オーダーブックデータメッセージをエミット
    const message = {
      arg: {
        instId: 'BTC/USDT',
        channel: 'books'
      },
      data: {
        asks: [['30000.00', '1.0']],
        bids: [['29900.00', '1.0']]
      }
    };
    mockWs.emit('message', JSON.stringify(message));
    
    // オーダーブックハンドラーが呼び出されたことを確認
    expect(orderBookHandler).toHaveBeenCalledWith(
      'BTC/USDT',
      expect.objectContaining({
        asks: [['30000.00', '1.0']],
        bids: [['29900.00', '1.0']],
        timestamp: expect.any(Number)
      })
    );
  });
  
  test('should handle candle data message', async () => {
    // イベントリスナー
    const candleHandler = jest.fn();
    client.on('candle', candleHandler);
    
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // ローソク足データメッセージをエミット
    const message = {
      arg: {
        instId: 'BTC/USDT',
        channel: 'candle1m'
      },
      data: [
        ['1620000000000', '30000.00', '30100.00', '29900.00', '30050.00', '10.5']
      ]
    };
    mockWs.emit('message', JSON.stringify(message));
    
    // ローソク足ハンドラーが呼び出されたことを確認
    expect(candleHandler).toHaveBeenCalledWith(
      'BTC/USDT',
      '1m',
      expect.objectContaining({
        timestamp: 1620000000000,
        open: 30000,
        high: 30100,
        low: 29900,
        close: 30050,
        volume: 10.5
      })
    );
  });
  
  test('should send ping message periodically', async () => {
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // pingメッセージがまだ送信されていないことを確認
    expect(mockWs.send).not.toHaveBeenCalledWith('ping');
    
    // 30秒進める
    jest.advanceTimersByTime(30000);
    
    // pingメッセージが送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledWith('ping');
    
    // さらに30秒進める
    jest.advanceTimersByTime(30000);
    
    // pingメッセージが再度送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledTimes(2);
  });
  
  test('should handle pong message', async () => {
    // イベントリスナー
    const pongHandler = jest.fn();
    client.on('pong', pongHandler);
    
    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // pongメッセージをエミット
    mockWs.emit('message', 'pong');
    
    // pongハンドラーが呼び出されたことを確認
    expect(pongHandler).toHaveBeenCalled();
  });
  
  test('should attempt reconnect on close', async () => {
    // setTimeoutをモック
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
      return originalSetTimeout(callback, 0) as any;
    });

    // 接続
    const connectPromise = client.connect();
    mockWs.emit('open');
    await connectPromise;
    
    // 切断イベントをエミット
    mockWs.emit('close', 1000, 'Normal closure');
    
    // 再接続タイマーが設定されたことを確認
    expect(global.setTimeout).toHaveBeenCalled();
    
    // タイマーを進める
    jest.runOnlyPendingTimers();
    
    // 再接続が試みられたことを確認
    expect(global.WebSocket).toHaveBeenCalledTimes(2);

    // モックをリストア
    global.setTimeout = originalSetTimeout;
  });
});
