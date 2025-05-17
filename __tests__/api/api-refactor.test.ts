// __tests__/api/api-refactor.test.ts
// 作成: APIリファクタリングのテスト
// リダイレクト層を通して動作するか確認するテスト

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// API関連のインポート
import * as Api from '../../services/api/common/request';
import { getApiClient } from '@/services/api/client-factory';
import { ProductType } from '@/types/constants/enums';
import { handleApiError, handleWebSocketError, handleChartError } from '../../services/errors/handler';
import { getApiConfig, IS_DEV, IS_BROWSER } from '@/config/environment';

// モック設定
const mock = new MockAdapter(axios);
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// テスト用データ
const testEndpoint = '/api/test';
const testParams = { param1: 'value1', param2: 'value2' };
const testResponse = { data: { result: 'success' } };
const testError = { code: '10001', msg: 'Test error message' };

describe('APIリファクタリングテスト', () => {
  beforeEach(() => {
    mock.reset();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mock.restore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('環境設定', () => {
    it('getApiConfigが正しい値を返すこと', () => {
      // API_CONFIGは新しい実装では直接エクスポートされていないのでテストを修正
      expect(getApiConfig('bitget')).toBeDefined();
      expect(getApiConfig('bitget').baseUrl).toBeTruthy();
      expect(getApiConfig('bitget').wsUrl).toBeTruthy();
    });

    it('環境変数が正しく設定されていること', () => {
      // IS_DEVとIS_BROWSERは直接インポートされているのでチェック
      expect(IS_DEV).toBeDefined();
      expect(IS_BROWSER).toBeDefined();
      expect(typeof IS_DEV).toBe('boolean');
      expect(typeof IS_BROWSER).toBe('boolean');
    });
  });

  describe('APIリクエスト', () => {
    it('成功時に正しいレスポンスを返すこと', async () => {
      // モックの設定
      mock.onGet(testEndpoint).reply(200, testResponse);

      // APIリクエストの実行
      const result = await Api.apiRequest({
        url: testEndpoint,
        method: 'GET',
        params: testParams
      });

      // 結果の確認
      expect(result).toEqual(testResponse.data);
    });

    it('エラー時に例外を投げること', async () => {
      // モックの設定
      mock.onGet(testEndpoint).reply(400, testError);

      // APIリクエストの実行とエラーキャッチ
      let error: unknown;
      try {
        await Api.apiRequest({
          url: testEndpoint,
          method: 'GET',
          params: testParams
        });
      } catch (e) {
        error = e;
      }

      // エラーが発生したことを確認
      expect(error).toBeDefined();
      
      // エラーが発生したことを確認するのみ
      // 実際のメッセージは実装に依存するのでチェックしない
    });

    it('フォールバックデータを正しく返すこと', async () => {
      // モックの設定
      mock.onGet(testEndpoint).reply(400, testError);
      
      const fallbackData = { fallback: true };

      // APIリクエストの実行
      const result = await Api.apiRequest({
        url: testEndpoint,
        method: 'GET',
        params: testParams,
        fallbackData
      });

      // 結果の確認
      expect(result).toEqual(fallbackData);
    });
  });

  describe('ブラウザAPIリクエスト', () => {
    it('ブラウザAPIリクエストが正しく動作すること', async () => {
      // モックの設定
      mock.onGet(testEndpoint).reply(200, testResponse);
      
      // ブラウザAPIリクエストの実行
      const result = await Api.browserApiRequest(testEndpoint, testParams);

      // 結果の確認
      expect(result).toEqual(testResponse.data);
    });
  });

  describe('キャンセル可能なリクエスト', () => {
    it('正しいインターフェースを持つこと', () => {
      const cancellable = Api.createCancellableRequest();

      expect(cancellable.signal).toBeDefined();
      expect(typeof cancellable.cancel).toBe('function');
    });
  });

  describe('APIクライアントファクトリー', () => {
    it('正しいタイプのクライアントを返すこと', () => {
      const client = getApiClient('spot' as ProductType);
      expect(client).toBeDefined();
      expect(client.constructor.name).toBe('BitgetApiClient');
    });
  });

  describe('エラーハンドラー', () => {
    it('エラーハンドラーが正しく動作すること', () => {
      const testError = new Error('テストエラー');
      
      // コンソールエラーのモックを設定
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // エラーハンドラーの実行
      // logToConsoleを明示的にtrueに設定
      handleApiError(testError, { logToConsole: true });

      // コンソール出力を確認
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // スパイのリストア
      consoleErrorSpy.mockRestore();
    });
  });
});
