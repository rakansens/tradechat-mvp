// services/socket/mediator.test.ts
// 作成: 2025-05-10 - socketメディエータのテスト
// 更新: 2025-05-10 - EventEmitterの型エラーを修正
// 更新: 2025-05-10 - unknown型の扱いを修正
// 更新: 2025-05-14 - 非同期処理に対応

import { EventEmitter } from 'events';
import { initSocketMediator } from './mediator';
import { storeEmit } from '@/store/socket/dispatcher';
import { logger } from '@/utils/common';

// モック
jest.mock('@/store/socket/dispatcher', () => ({
  storeEmit: jest.fn()
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('./index', () => ({
  getSocketService: jest.fn().mockReturnValue(null)
}));

// グローバルモック
const mockedStoreEmit = storeEmit as jest.MockedFunction<typeof storeEmit>;

describe('SocketMediator', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // モックを復元
    jest.restoreAllMocks();
  });
  
  it('初期化が成功し、ログが出力されること', async () => {
    // メディエータを初期化
    const mediator = await initSocketMediator();
    
    // 初期化時のログが出力されること
    expect(logger.info).toHaveBeenCalledWith(
      'SocketMediator: 初期化を開始',
      expect.objectContaining({
        component: 'SocketMediator',
        action: 'initialize'
      })
    );
    
    // 成功ログが出力されること
    expect(logger.info).toHaveBeenCalledWith(
      'SocketMediator: 初期化完了',
      expect.objectContaining({
        component: 'SocketMediator',
        action: 'initialize',
        success: true,
        usingRealService: false
      })
    );
    
    // メディエータオブジェクトがEventEmitterであること
    expect(mediator).toBeInstanceOf(EventEmitter);
  });
  
  it('connectedイベントを受信したらstoreEmitが呼ばれること', async () => {
    // メディエータを初期化
    const mediator = await initSocketMediator();
    expect(mediator).not.toBeNull();
    
    if (mediator) {
      // イベントを発行
      mediator.emit('connected', true);
      
      // storeEmitが正しく呼ばれることを確認
      expect(mockedStoreEmit).toHaveBeenCalledWith('connected', true);
    }
  });
  
  it('socketIdイベントを受信したらstoreEmitが呼ばれること', async () => {
    // メディエータを初期化
    const mediator = await initSocketMediator();
    expect(mediator).not.toBeNull();
    
    if (mediator) {
      // イベントを発行
      mediator.emit('socketId', 'socket-123');
      
      // storeEmitが正しく呼ばれることを確認
      expect(mockedStoreEmit).toHaveBeenCalledWith('socketId', 'socket-123');
    }
  });
  
  it('symbolイベントを受信したらstoreEmitが呼ばれること', async () => {
    // メディエータを初期化
    const mediator = await initSocketMediator();
    expect(mediator).not.toBeNull();
    
    if (mediator) {
      // イベントを発行
      mediator.emit('symbol', 'BTCUSDT');
      
      // storeEmitが正しく呼ばれることを確認
      expect(mockedStoreEmit).toHaveBeenCalledWith('symbol', 'BTCUSDT');
    }
  });
  
  it('exchangeTypeイベントを受信したらstoreEmitが呼ばれること', async () => {
    // メディエータを初期化
    const mediator = await initSocketMediator();
    expect(mediator).not.toBeNull();
    
    if (mediator) {
      // イベントを発行
      mediator.emit('exchangeType', 'futures');
      
      // storeEmitが正しく呼ばれることを確認
      expect(mockedStoreEmit).toHaveBeenCalledWith('exchangeType', 'futures');
    }
  });
}); 