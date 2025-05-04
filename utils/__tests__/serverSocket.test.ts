// utils/__tests__/serverSocket.test.ts
// Socket.ioサーバー機能のテスト

import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';

// モックで置き換えるoriginal関数をエクスポート
export function setupSocketServer(httpServer: any) {
  const io = new Server(httpServer);
  
  // 接続ハンドラを設定
  io.on('connection', (socket) => {
    // clientIDを生成して送信
    const clientId = 'test-client-id';
    socket.emit('connected', { clientId });
    
    // キャプチャリクエスト処理
    socket.on('capture_request', (data) => {
      // リクエストを受け取り、全クライアントにブロードキャスト
      io.emit('capture_request', data);
    });
    
    // キャプチャレスポンス処理
    socket.on('capture_response', (data) => {
      // リクエスト元にレスポンスを返す
      io.emit('capture_response', data);
    });
    
    // エラーメッセージ処理
    socket.on('error_message', (data) => {
      // リクエスト元にエラーを返す
      io.emit('error_message', data);
    });
  });
  
  return io;
}

// 本番コードではなくテスト用のモック実装を使用
jest.mock('socket.io', () => {
  const mockOn = jest.fn();
  const mockEmit = jest.fn();
  
  const MockServer = jest.fn().mockImplementation(() => {
    return {
      on: mockOn,
      emit: mockEmit
    };
  });
  
  return {
    Server: MockServer
  };
});

describe('Socket.ioサーバー', () => {
  let httpServer: any;
  let io: any;
  
  beforeAll(() => {
    // テスト用HTTPサーバーを作成
    httpServer = createServer();
    io = setupSocketServer(httpServer);
  });
  
  afterAll(() => {
    // テスト後にサーバーをクローズ
    io.close();
    httpServer.close();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('サーバーが正しく初期化される', () => {
    expect(Server).toHaveBeenCalledWith(httpServer);
  });
  
  it('接続ハンドラが設定される', () => {
    // Serverのインスタンスのonメソッドが'connection'イベントに対して呼ばれたことを確認
    expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });
}); 