// socketActions.test.ts
// socketActionsのユニットテスト
// 更新: useAppStoreからドメイン別ストアへ移行

import { logger } from '../../../utils/logger';

// 各ドメインストアをモック化
const mockSetCurrentSymbol = jest.fn();
const mockSetExchangeType = jest.fn();
const mockUpdateTimeFrame = jest.fn();

// useSymbolStoreのモック
jest.mock('../../../store/useSymbolStore', () => ({
  useSymbolStore: {
    getState: jest.fn().mockReturnValue({
      setCurrentSymbol: mockSetCurrentSymbol,
      setExchangeType: mockSetExchangeType,
      currentSymbol: 'BTCUSDT',
      exchangeType: 'spot',
    }),
  },
}));

// useChartDataStoreのモック
jest.mock('../../../store/chart', () => ({
  useChartDataStore: {
    getState: jest.fn().mockReturnValue({
      updateTimeFrame: mockUpdateTimeFrame,
      currentTimeFrame: '1d',
    }),
  },
}));

// loggerをモック化
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// グローバルイベントをモック化
global.CustomEvent = jest.fn().mockImplementation((event, options) => ({
  type: event,
  detail: options?.detail,
}));

global.dispatchEvent = jest.fn();

// モック化した後にsocketActionsの個別関数をインポート
import * as socketActions from '../../../store/socketActions';

describe('socketStoreActions', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('setSymbol', () => {
    it('正常に銘柄を更新できること', () => {
      // テスト実行
      socketActions.setSymbol('ETHUSDT', 'test-source');
      
      // AppStore.setCurrentSymbol が正しく呼ばれたか検証
      expect(mockSetCurrentSymbol).toHaveBeenCalledWith(
        'ETHUSDT',
        'test-source'
      );
      
      // ログが出力されたか検証
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('銘柄をETHUSDTに更新します'),
        expect.objectContaining({
          symbol: 'ETHUSDT',
          source: 'test-source',
        })
      );
      
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('銘柄をETHUSDTに更新しました'),
        expect.objectContaining({
          success: true,
          symbol: 'ETHUSDT',
        })
      );
    });

    it('エラー時に適切にログを出力すること', () => {
      // setCurrentSymbol でエラーが発生するようにモック
      const error = new Error('テストエラー');
      mockSetCurrentSymbol.mockImplementation(() => {
        throw error;
      });
      
      // テスト実行
      socketActions.setSymbol('ETHUSDT', 'test-source');
      
      // エラーログが出力されたか検証
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('銘柄更新エラー'),
        expect.objectContaining({
          component: 'socketActions',
          action: 'setSymbol',
          errorMessage: expect.any(String),
          errorStack: expect.any(String),
          symbol: 'ETHUSDT',
        })
      );
    });
  });

  describe('setExchangeType', () => {
    it('正常に取引タイプを更新できること', () => {
      // テスト実行
      socketActions.setExchangeType('futures', 'BTCUSDT', 'test-source');
      
      // AppStore.setExchangeType が正しく呼ばれたか検証
      expect(mockSetExchangeType).toHaveBeenCalledWith(
        'futures'
      );
      
      // ログが出力されたか検証
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('取引タイプをspotからfuturesに更新します'),
        expect.objectContaining({
          fromType: 'spot',
          toType: 'futures',
          symbol: 'BTCUSDT',
          source: 'test-source',
        })
      );
    });

    it('エラー時に適切にログを出力すること', () => {
      // setExchangeType でエラーが発生するようにモック
      const error = new Error('テストエラー');
      mockSetExchangeType.mockImplementation(() => {
        throw error;
      });
      
      // テスト実行
      socketActions.setExchangeType('futures', 'BTCUSDT', 'test-source');
      
      // エラーログが出力されたか検証
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('取引タイプ更新エラー'),
        expect.objectContaining({
          component: 'socketActions',
          action: 'setExchangeType',
          errorMessage: expect.any(String),
          errorStack: expect.any(String),
          type: 'futures',
          symbol: 'BTCUSDT',
        })
      );
    });
  });

  describe('setTimeframe', () => {
    it('正常に時間足を更新できること', () => {
      // テスト実行
      socketActions.setTimeframe('4h', 'test-source');
      
      // AppStore.updateTimeFrame が正しく呼ばれたか検証
      expect(mockUpdateTimeFrame).toHaveBeenCalledWith(
        '4h'
      );
      
      // ログが出力されたか検証
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('時間足を4hに更新します'),
        expect.objectContaining({
          timeframe: '4h',
          source: 'test-source',
        })
      );
      
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('時間足を4hに更新しました'),
        expect.objectContaining({
          success: true,
          timeframe: '4h',
        })
      );
    });

    it('エラー時に適切にログを出力すること', () => {
      // updateTimeFrame でエラーが発生するようにモック
      const error = new Error('テストエラー');
      mockUpdateTimeFrame.mockImplementation(() => {
        throw error;
      });
      
      // テスト実行
      socketActions.setTimeframe('4h', 'test-source');
      
      // エラーログが出力されたか検証
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('時間足更新エラー'),
        expect.objectContaining({
          component: 'socketActions',
          action: 'setTimeframe',
          errorMessage: expect.any(String),
          errorStack: expect.any(String),
          timeframe: '4h',
        })
      );
    });
  });
});
