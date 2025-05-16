/**
 * WebSocketのモックファクトリ関数
 * テストで使用するWebSocketモックを型安全に生成します
 */

import { WebSocketReadyState } from './constants';

type WebSocketEventMap = {
  open: Event;
  message: MessageEvent;
  error: Event;
  close: CloseEvent;
};

export const createMockWebSocket = (): jest.Mocked<WebSocket> => {
  const mockListeners: Partial<Record<keyof WebSocketEventMap, EventListener[]>> = {
    open: [],
    message: [],
    error: [],
    close: []
  };

  const mockSocket = {
    // プロパティ
    url: 'ws://mock-websocket-url.com',
    readyState: WebSocketReadyState.CONNECTING,
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    binaryType: 'blob' as BinaryType,
    // 型安全な定数
    CONNECTING: WebSocketReadyState.CONNECTING,
    OPEN: WebSocketReadyState.OPEN,
    CLOSING: WebSocketReadyState.CLOSING,
    CLOSED: WebSocketReadyState.CLOSED,

    // メソッド
    send: jest.fn(),
    close: jest.fn(),

    // イベントリスナー管理
    addEventListener: jest.fn((type: keyof WebSocketEventMap, listener: EventListener) => {
      if (!mockListeners[type]) {
        mockListeners[type] = [];
      }
      mockListeners[type]?.push(listener);
    }),
    removeEventListener: jest.fn((type: keyof WebSocketEventMap, listener: EventListener) => {
      if (mockListeners[type]) {
        const index = mockListeners[type]?.indexOf(listener) ?? -1;
        if (index !== -1) {
          mockListeners[type]?.splice(index, 1);
        }
      }
    }),
    dispatchEvent: jest.fn((event: Event) => {
      const listeners = mockListeners[event.type as keyof WebSocketEventMap];
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
      return true;
    }),

    // シミュレーションヘルパー
    simulateOpen: () => {
      // 明示的なキャストで型エラーを回避
      (mockSocket as any).readyState = WebSocketReadyState.OPEN;
      mockSocket.dispatchEvent(new Event('open'));
    },
    simulateMessage: (data: string | ArrayBuffer | Blob) => {
      const event = new MessageEvent('message', { data });
      mockSocket.dispatchEvent(event);
    },
    simulateError: () => {
      mockSocket.dispatchEvent(new Event('error'));
    },
    simulateClose: (code = 1000, reason = '') => {
      // 明示的なキャストで型エラーを回避
      (mockSocket as any).readyState = WebSocketReadyState.CLOSED;
      const event = new CloseEvent('close', { code, reason, wasClean: true });
      mockSocket.dispatchEvent(event);
    }
  };

  return mockSocket as unknown as jest.Mocked<WebSocket>;
};

// SocketServiceのモックファクトリ
export const createMockSocketService = () => {
  const mockWebSocket = createMockWebSocket();
  
  return {
    socket: mockWebSocket,
    connect: jest.fn(() => Promise.resolve(mockWebSocket)),
    disconnect: jest.fn(),
    send: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    isConnected: jest.fn(() => (mockWebSocket as any).readyState === WebSocketReadyState.OPEN),
  };
}; 