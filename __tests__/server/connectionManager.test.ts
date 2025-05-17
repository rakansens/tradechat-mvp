import ConnectionManager, { ConnectionState } from '../../server/connectionManager';
import WebSocket from 'ws';
import { logger } from '../../utils/common';

jest.mock('ws');
jest.mock('../../utils/common', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ConnectionManager', () => {
  let manager: ConnectionManager;
  let mockWs: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
      readyState: WebSocket.OPEN,
      pong: jest.fn()
    };
    (WebSocket as jest.Mock).mockImplementation(() => mockWs);
    manager = new ConnectionManager({ wsUrl: 'wss://test.example.com' });
  });

  it('WebSocket接続を初期化できること', () => {
    manager.connect();
    expect(WebSocket).toHaveBeenCalledWith('wss://test.example.com');
    expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('接続中にデータを送信できること', () => {
    manager.connect();
    manager.send('test');
    expect(mockWs.send).toHaveBeenCalledWith('test');
  });

  it('切断できること', () => {
    (manager as any).ws = mockWs;
    manager.disconnect();
    expect(mockWs.terminate).toHaveBeenCalled();
    expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
  });
});
