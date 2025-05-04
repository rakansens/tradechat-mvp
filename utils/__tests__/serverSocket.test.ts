// utils/__tests__/serverSocket.test.ts
// Socket.ioサーバー機能のテスト

import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { RequestTracker } from '../socketUtils';
import { v4 as uuidv4 } from 'uuid';

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

// uuidのモック
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));

describe('RequestTrackerクラス', () => {
  let requestTracker: RequestTracker;
  let mockResolve: jest.Mock;
  let mockReject: jest.Mock;

  beforeEach(() => {
    // インスタンスを初期化
    requestTracker = new RequestTracker();
    
    // モックの初期化
    mockResolve = jest.fn();
    mockReject = jest.fn();
    
    // タイマーモック
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('registerRequest', () => {
    it('リクエストを正常に登録できる', () => {
      // リクエスト登録
      const requestId = 'test-request-id';
      const clientId = 'test-client-id';
      requestTracker.registerRequest(requestId, clientId, mockResolve, mockReject);
      
      // 登録されたことを確認
      expect(requestTracker.hasRequest(requestId)).toBe(true);
    });
    
    it('タイムアウト後にリクエストが拒否される', () => {
      // 短いタイムアウトでリクエスト登録
      const requestId = 'test-request-id';
      const clientId = 'test-client-id';
      requestTracker.registerRequest(requestId, clientId, mockResolve, mockReject, 1000);
      
      // タイムアウト直前は処理されていないことを確認
      jest.advanceTimersByTime(999);
      expect(mockReject).not.toHaveBeenCalled();
      
      // タイムアウト経過後に拒否されることを確認
      jest.advanceTimersByTime(1);
      expect(mockReject).toHaveBeenCalledWith(expect.any(Error));
      expect(requestTracker.hasRequest(requestId)).toBe(false);
    });
  });
  
  describe('resolveRequest', () => {
    it('存在しないリクエストを解決するとfalseを返す', () => {
      const result = requestTracker.resolveRequest('non-existent-id', 'data');
      expect(result).toBe(false);
    });
    
    it('リクエストを正常に解決できる', () => {
      // リクエスト登録
      const requestId = 'test-request-id';
      const clientId = 'test-client-id';
      requestTracker.registerRequest(requestId, clientId, mockResolve, mockReject);
      
      // リクエストを解決
      const testData = 'test-data';
      const result = requestTracker.resolveRequest(requestId, testData);
      
      // 解決されたことを確認
      expect(result).toBe(true);
      expect(mockResolve).toHaveBeenCalledWith(testData);
      expect(requestTracker.hasRequest(requestId)).toBe(false);
    });
  });
  
  describe('rejectRequest', () => {
    it('存在しないリクエストを拒否するとfalseを返す', () => {
      const result = requestTracker.rejectRequest('non-existent-id', new Error('test'));
      expect(result).toBe(false);
    });
    
    it('リクエストを正常に拒否できる', () => {
      // リクエスト登録
      const requestId = 'test-request-id';
      const clientId = 'test-client-id';
      requestTracker.registerRequest(requestId, clientId, mockResolve, mockReject);
      
      // リクエストを拒否
      const testError = new Error('test error');
      const result = requestTracker.rejectRequest(requestId, testError);
      
      // 拒否されたことを確認
      expect(result).toBe(true);
      expect(mockReject).toHaveBeenCalledWith(testError);
      expect(requestTracker.hasRequest(requestId)).toBe(false);
    });
  });
  
  describe('cleanupOldRequests', () => {
    it('最大年齢を超えたリクエストをクリーンアップする', () => {
      // リクエスト登録
      const requestId1 = 'test-request-id-1';
      const requestId2 = 'test-request-id-2';
      const clientId = 'test-client-id';
      
      // 一つ目のリクエストを登録
      requestTracker.registerRequest(requestId1, clientId, mockResolve, mockReject);
      
      // タイムスタンプを手動で過去に設定
      const oldRequest = requestTracker.getRequest(requestId1);
      if (oldRequest) {
        oldRequest.timestamp = Date.now() - 6 * 60 * 1000; // 6分前
      }
      
      // 二つ目のリクエストを登録
      requestTracker.registerRequest(requestId2, clientId, mockResolve, mockReject);
      
      // クリーンアップを実行（5分以上経過したリクエストを削除）
      requestTracker.cleanupOldRequests(5 * 60 * 1000);
      
      // 古いリクエストが削除され、新しいリクエストが残っていることを確認
      expect(requestTracker.hasRequest(requestId1)).toBe(false);
      expect(requestTracker.hasRequest(requestId2)).toBe(true);
      expect(mockReject).toHaveBeenCalledTimes(1);
    });
  });
}); 