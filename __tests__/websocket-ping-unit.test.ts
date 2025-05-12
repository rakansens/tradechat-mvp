/**
 * __tests__/websocket-ping-unit.test.ts
 * WebSocketクライアントのPing/Pong機能のユニットテスト
 * 
 * このテストは、BitgetWebSocketClientのPing/Pongメカニズムの
 * 個々のコンポーネントをユニットテストします。
 * 
 * 更新: 2025-05-12 - リファクタリング: services/api/bitget/websocket-clientを使用するように変更
 */

import { BitgetWebSocketClient } from '../services/api/bitget/websocket-client';

// テスト用のタイムアウト設定
jest.setTimeout(5000);

describe('BitgetWebSocketClient Ping/Pong Unit Tests', () => {
  let client: BitgetWebSocketClient;
  let mockWs: any;
  
  beforeEach(() => {
    // WebSocketのモック
    mockWs = {
      send: jest.fn(),
      close: jest.fn()
    };
    
    // クライアントの作成
    client = new BitgetWebSocketClient();
    
    // プライベートプロパティにアクセス
    (client as any).ws = mockWs;
    (client as any).isConnected = true;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  test('sendPing should send ping message when connected', () => {
    // sendPingメソッドを呼び出す
    (client as any).sendPing();
    
    // pingメッセージが送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledWith('ping');
  });
  
  test('sendPing should not send ping message when not connected', () => {
    // 接続状態を変更
    (client as any).isConnected = false;
    
    // sendPingメソッドを呼び出す
    (client as any).sendPing();
    
    // pingメッセージが送信されないことを確認
    expect(mockWs.send).not.toHaveBeenCalled();
  });
  
  test('setupPingInterval should set interval for sending pings', () => {
    // タイマー関数をモック
    jest.useFakeTimers();
    
    // clearPingIntervalをモック
    (client as any).clearPingInterval = jest.fn();
    
    // setupPingIntervalメソッドを呼び出す
    (client as any).setupPingInterval();
    
    // clearPingIntervalが呼び出されたことを確認
    expect((client as any).clearPingInterval).toHaveBeenCalled();
    
    // pingIntervalが設定されたことを確認
    expect((client as any).pingInterval).not.toBeNull();
    
    // 30秒進める
    jest.advanceTimersByTime(30000);
    
    // pingメッセージが送信されたことを確認
    expect(mockWs.send).toHaveBeenCalledWith('ping');
  });
  
  test('clearPingInterval should clear the ping interval', () => {
    // タイマー関数をモック
    jest.useFakeTimers();
    
    // pingIntervalを設定
    const mockInterval = setInterval(() => {}, 1000);
    (client as any).pingInterval = mockInterval;
    
    // clearPingIntervalメソッドを呼び出す
    (client as any).clearPingInterval();
    
    // pingIntervalがクリアされたことを確認
    expect((client as any).pingInterval).toBeNull();
  });
  
  test('disconnect should clear ping interval and close connection', () => {
    // clearPingIntervalをモック
    (client as any).clearPingInterval = jest.fn();
    (client as any).clearReconnectTimeout = jest.fn();
    
    // disconnectメソッドを呼び出す
    client.disconnect();
    
    // clearPingIntervalが呼び出されたことを確認
    expect((client as any).clearPingInterval).toHaveBeenCalled();
    
    // clearReconnectTimeoutが呼び出されたことを確認
    expect((client as any).clearReconnectTimeout).toHaveBeenCalled();
    
    // WebSocket接続が閉じられたことを確認
    expect(mockWs.close).toHaveBeenCalled();
    
    // 接続状態がfalseになったことを確認
    expect((client as any).isConnected).toBe(false);
  });
  
  test('handleMessage should process pong messages', () => {
    // handleMessageメソッドを呼び出す
    (client as any).handleMessage('pong');
    
    // 特に例外が発生しないことを確認
    // Note: 実際の実装では、pongメッセージを受信したときの処理を追加できます
  });
});
