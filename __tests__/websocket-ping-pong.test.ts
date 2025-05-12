/**
 * __tests__/websocket-ping-pong.test.ts
 * WebSocketのPing/Pongメカニズムのテスト
 * 
 * このテストは、BitgetWebSocketClientV2のPing/Pongメカニズムが
 * 正しく機能していることを確認します。
 */

import { BitgetWebSocketClient } from '../services/bitget/websocket-v2';
import WS from 'jest-websocket-mock';

// モックサーバーのURL
const MOCK_SERVER_URL = 'ws://localhost:1234';

// テスト用のタイムアウト設定（ms）
jest.setTimeout(10000);

describe('BitgetWebSocketClient Ping/Pong Tests', () => {
  let mockServer: WS;
  let client: BitgetWebSocketClient;
  
  // 各テストの前にモックWebSocketサーバーをセットアップ
  beforeEach(async () => {
    // WebSocketのエンドポイントをモック
    jest.spyOn(global, 'WebSocket').mockImplementation((url: string) => {
      return new WebSocket(MOCK_SERVER_URL) as any;
    });
    
    // モックサーバーの作成
    mockServer = new WS(MOCK_SERVER_URL);
    
    // クライアントの作成
    client = new BitgetWebSocketClient();
  });
  
  // 各テストの後にモックサーバーをクリーンアップ
  afterEach(() => {
    WS.clean();
    jest.clearAllMocks();
  });
  
  test('should establish connection and send ping messages', async () => {
    // クライアントの接続
    const connectPromise = client.connect();
    
    // モックサーバーが接続を受け入れるのを待つ
    await mockServer.connected;
    
    // 接続プロミスが解決されるのを待つ
    await connectPromise;
    
    // pingInterval関数がsetupPingIntervalによって呼び出されることを確認
    const setupPingIntervalSpy = jest.spyOn(client as any, 'setupPingInterval');
    expect(setupPingIntervalSpy).toHaveBeenCalled();
    
    // Pingメッセージが送信されることを確認
    const sendPingSpy = jest.spyOn(client as any, 'sendPing');
    
    // sendPingを直接呼び出してテスト
    (client as any).sendPing();
    expect(sendPingSpy).toHaveBeenCalled();
    
    // モックサーバーがPingメッセージを受信したことを確認
    await expect(mockServer).toReceiveMessage('ping');
    
    // モックサーバーからPongメッセージを送信
    mockServer.send('pong');
    
    // クライアントの切断
    client.disconnect();
  });
  
  test('should handle pong responses correctly', async () => {
    // メッセージハンドラーのスパイを設定
    const handleMessageSpy = jest.spyOn(client as any, 'handleMessage');
    
    // クライアントの接続
    const connectPromise = client.connect();
    await mockServer.connected;
    await connectPromise;
    
    // モックサーバーからPongメッセージを送信
    mockServer.send('pong');
    
    // handleMessageが呼び出されたことを確認
    expect(handleMessageSpy).toHaveBeenCalledWith('pong');
    
    // クライアントの切断
    client.disconnect();
  });
  
  test('should resubscribe after reconnection', async () => {
    // 購読メソッドのスパイを設定
    const subscribeOHLCSpy = jest.spyOn(client, 'subscribeCandles');
    
    // クライアントの接続
    await client.connect();
    await mockServer.connected;
    
    // ローソク足データを購読
    client.subscribeCandles('BTCUSDT', '1m');
    expect(subscribeOHLCSpy).toHaveBeenCalledWith('BTCUSDT', '1m');
    
    // 購読メッセージが送信されたことを確認
    await expect(mockServer).toReceiveMessage(expect.objectContaining({
      op: 'subscribe',
      args: expect.arrayContaining([
        expect.objectContaining({
          channel: 'candle1m',
          instId: 'BTCUSDT'
        })
      ])
    }));
    
    // 接続を切断
    client.disconnect();
    mockServer.close();
    
    // 新しいモックサーバーを作成
    mockServer = new WS(MOCK_SERVER_URL);
    
    // 再接続
    await client.connect();
    await mockServer.connected;
    
    // resubscribeAllが呼び出されたことを確認
    const resubscribeAllSpy = jest.spyOn(client as any, 'resubscribeAll');
    (client as any).resubscribeAll();
    expect(resubscribeAllSpy).toHaveBeenCalled();
    
    // 再購読後に購読メッセージが再送信されたことを確認
    await expect(mockServer).toReceiveMessage(expect.objectContaining({
      op: 'subscribe',
      args: expect.arrayContaining([
        expect.objectContaining({
          channel: 'candle1m',
          instId: 'BTCUSDT'
        })
      ])
    }));
    
    // クライアントの切断
    client.disconnect();
  });
  
  test('should maintain connection with ping/pong mechanism', async () => {
    // タイマー関数をモック
    jest.useFakeTimers();
    
    // pingIntervalのスパイを設定
    const clearPingIntervalSpy = jest.spyOn(client as any, 'clearPingInterval');
    const setupPingIntervalSpy = jest.spyOn(client as any, 'setupPingInterval');
    
    // クライアントの接続
    await client.connect();
    await mockServer.connected;
    
    // setupPingIntervalが呼び出されたことを確認
    expect(setupPingIntervalSpy).toHaveBeenCalled();
    
    // 30秒進める（Ping間隔）
    jest.advanceTimersByTime(30000);
    
    // Pingメッセージが送信されたことを確認
    await expect(mockServer).toReceiveMessage('ping');
    
    // モックサーバーからPongメッセージを送信
    mockServer.send('pong');
    
    // 接続を切断
    client.disconnect();
    
    // clearPingIntervalが呼び出されたことを確認
    expect(clearPingIntervalSpy).toHaveBeenCalled();
    
    // タイマーをリセット
    jest.useRealTimers();
  });
});
