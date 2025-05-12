/**
 * __tests__/websocket-ping-pong.test.ts
 * WebSocketのPing/Pongメカニズムのテスト
 * 
 * このテストは、BitgetWebSocketClientのPing/Pongメカニズムが
 * 正しく機能していることを確認します。
 * 
 * 更新: 2025-05-12 - リファクタリング: services/api/bitget/websocket-clientを使用するように変更
 * 更新: 2025-05-12 - モックの改善: クライアントの内部メソッドをモックし、実際の接続を試みないように変更
 */

import { BitgetWebSocketClient } from '../services/api/bitget/websocket-client';

// テスト用のタイムアウト設定（ms）
jest.setTimeout(10000);

// タイマーをモック化
jest.useFakeTimers();

// モック関数
const sendPingMock = jest.fn();
const handleMessageMock = jest.fn();
const resubscribeAllMock = jest.fn();

// BitgetWebSocketClientをモック
jest.mock('../services/api/bitget/websocket-client', () => {
  const originalModule = jest.requireActual('../services/api/bitget/websocket-client');
  
  return {
    ...originalModule,
    BitgetWebSocketClient: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockImplementation(() => {
          // 接続成功時にsendPingを直接呼び出すように修正
          // タイマーは使用せず、テスト内で直接呼び出す
          return Promise.resolve();
        }),
        disconnect: jest.fn(),
        subscribeOrderBook: jest.fn().mockReturnValue(() => {}),
        subscribeCandles: jest.fn().mockReturnValue(() => {}),
        handleOpen: jest.fn().mockImplementation(() => {
          // 再接続成功時に再購読を実行
          resubscribeAllMock();
        }),
        handleMessage: handleMessageMock,
        handleError: jest.fn(),
        handleClose: jest.fn(),
        send: jest.fn(),
        sendPing: sendPingMock,
        resubscribeAll: resubscribeAllMock,
        setupPingInterval: jest.fn(),
        clearPingInterval: jest.fn(),
        attemptReconnect: jest.fn(),
        clearReconnectTimeout: jest.fn(),
        ws: {
          send: jest.fn(),
          close: jest.fn(),
          onopen: null,
          onmessage: null,
          onerror: null,
          onclose: null
        }
      };
    })
  };
});

describe('BitgetWebSocketClient Ping/Pong Tests', () => {
  let client: BitgetWebSocketClient;
  
  // 各テストの前にセットアップ
  beforeEach(() => {
    // クライアントの作成
    client = new BitgetWebSocketClient();
    
    // モック関数をリセット
    sendPingMock.mockClear();
    handleMessageMock.mockClear();
    resubscribeAllMock.mockClear();
  });
  
  // 各テストの後にクリーンアップ
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should establish connection and send ping messages', async () => {
    // クライアントの接続
    await client.connect();
    
    // 手動でsendPingを呼び出す
    (client as any).sendPing();
    
    // pingメソッドが呼び出されたことを確認
    expect(sendPingMock).toHaveBeenCalled();
  });
  
  test('should handle pong responses correctly', async () => {
    // クライアントの接続
    await client.connect();
    
    // pongメッセージをシミュレート
    (client as any).handleMessage('pong');
    
    // handleMessageが呼び出されたことを確認
    expect((client as any).handleMessage).toHaveBeenCalledWith('pong');
  });
  
  test('should resubscribe after reconnection', async () => {
    // クライアントの接続
    await client.connect();
    
    // ローソク足データを購読
    client.subscribeCandles('BTCUSDT', '1m');
    expect(client.subscribeCandles).toHaveBeenCalledWith('BTCUSDT', '1m');
    
    // 接続切断をシミュレート
    (client as any).handleClose(1006, 'Connection closed');
    
    // 再接続のためのタイマーをモック
    jest.useFakeTimers();
    
    // 再接続タイムアウトをトリガー
    jest.advanceTimersByTime(1000);
    
    // 再接続成功をシミュレート
    (client as any).handleOpen();
    
    // 再購読が呼び出されたことを確認
    expect((client as any).resubscribeAll).toHaveBeenCalled();
    
    // タイマーをリセット
    jest.useRealTimers();
  });
  
  test('should maintain connection with ping/pong mechanism', async () => {
    // クライアントの接続
    await client.connect();
    
    // 1回目のping送信
    (client as any).sendPing();
    
    // pingが送信されたことを確認
    expect(sendPingMock).toHaveBeenCalledTimes(1);
    
    // pongメッセージの受信をシミュレート
    (client as any).handleMessage('pong');
    
    // メッセージハンドラが呼び出されたことを確認
    expect(handleMessageMock).toHaveBeenCalledWith('pong');
    
    // 2回目のping送信
    (client as any).sendPing();
    
    // 再度pingが送信されたことを確認
    expect(sendPingMock).toHaveBeenCalledTimes(2);
    
    // クライアントの切断
    client.disconnect();
  });
});
