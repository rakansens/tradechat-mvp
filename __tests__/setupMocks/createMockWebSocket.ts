/**
 * __tests__/setupMocks/createMockWebSocket.ts
 * WebSocketのモックファクトリ関数を提供します
 */

// WebSocketの接続状態を表す定数
export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const;

type WebSocketState = typeof WebSocketStates[keyof typeof WebSocketStates];

/**
 * WebSocketのモックインスタンスを作成する
 * @returns モック化されたWebSocketインスタンス
 */
export const createMockWebSocket = (): jest.Mocked<WebSocket> => {
  const listeners: Record<string, EventListener[]> = {
    open: [],
    message: [],
    error: [],
    close: []
  };
  
  const mockSocket = {
    // プロパティ
    url: 'ws://mock-websocket-url.com',
    readyState: WebSocketStates.CONNECTING as WebSocketState,
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    binaryType: 'blob' as BinaryType,
    // 定数
    CONNECTING: WebSocketStates.CONNECTING,
    OPEN: WebSocketStates.OPEN,
    CLOSING: WebSocketStates.CLOSING,
    CLOSED: WebSocketStates.CLOSED,
    
    // メソッド
    send: jest.fn(),
    close: jest.fn(),
    
    // イベントリスナー
    addEventListener: jest.fn((type: string, listener: EventListener) => {
      if (!listeners[type]) {
        listeners[type] = [];
      }
      listeners[type].push(listener);
    }),
    
    removeEventListener: jest.fn((type: string, listener: EventListener) => {
      if (listeners[type]) {
        const index = listeners[type].indexOf(listener);
        if (index !== -1) {
          listeners[type].splice(index, 1);
        }
      }
    }),
    
    dispatchEvent: jest.fn((event: Event) => {
      if (listeners[event.type]) {
        listeners[event.type].forEach(listener => listener(event));
      }
      return true;
    }),
    
    // テスト用ヘルパー
    _open() {
      (mockSocket as any).readyState = WebSocketStates.OPEN;
      mockSocket.dispatchEvent(new Event('open'));
    },
    
    _send(data: string) {
      mockSocket.dispatchEvent(new MessageEvent('message', { data }));
    },
    
    _error() {
      mockSocket.dispatchEvent(new Event('error'));
    },
    
    _close(code = 1000, reason = '') {
      (mockSocket as any).readyState = WebSocketStates.CLOSED;
      mockSocket.dispatchEvent(new CloseEvent('close', { 
        code, 
        reason, 
        wasClean: true 
      }));
    }
  };
  
  return mockSocket as unknown as jest.Mocked<WebSocket>;
};

/**
 * グローバルWebSocketオブジェクトをモック化する
 * jest.mock('ws')の後で呼び出す
 */
export const mockGlobalWebSocket = () => {
  global.WebSocket = jest.fn(() => createMockWebSocket()) as unknown as typeof WebSocket;
  return global.WebSocket;
}; 