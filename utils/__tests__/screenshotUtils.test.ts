// utils/__tests__/screenshotUtils.test.ts
// 更新: Symbol.hasInstanceの型エラー修正
// スクリーンショットユーティリティのテスト

import { captureElementAsBase64, captureWithMultipleSelectors, captureChartAsBase64 } from '../screenshotUtils';

// html2canvasをモック
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue('mock-canvas-data-url')
    };
    return Promise.resolve(mockCanvas);
  })
}));

describe('スクリーンショットユーティリティ', () => {
  // オリジナルのwindowとdocumentを保持
  const originalWindow = global.window;
  const originalDocument = global.document;
  
  beforeEach(() => {
    // windowとdocumentのモック
    global.window = {
      devicePixelRatio: 2
    } as any;
    
    global.document = {
      body: {
        childNodes: []
      },
      querySelector: jest.fn(),
    } as any;
    
    // コンソールログのモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // グローバルをリセット
    global.window = originalWindow;
    global.document = originalDocument;
    jest.clearAllMocks();
  });
  
  describe('captureElementAsBase64', () => {
    it('ブラウザ環境以外ではエラーを返す', async () => {
      // windowをundefinedに設定
      global.window = undefined as any;
      
      await expect(captureElementAsBase64('#test')).rejects.toThrow('ブラウザ環境でのみ実行できます');
    });
    
    it('セレクタに一致する要素がない場合はnullを返す', async () => {
      // querySelector が null を返すよう設定
      (global.document.querySelector as jest.Mock).mockReturnValue(null);
      
      const result = await captureElementAsBase64('#non-existent');
      
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('要素が見つかりませんでした'));
    });
    
    it('Canvas要素がある場合は直接toDataURLを呼び出す', async () => {
      // Canvasモックを作成
      const mockCanvas = {
        toDataURL: jest.fn().mockReturnValue('mock-canvas-data')
      };
      
      // querySelectorがCanvasを返すように設定
      (global.document.querySelector as jest.Mock).mockReturnValue(mockCanvas);
      // Canvas判定のためのinstanceofをエミュレート
      (mockCanvas as any).constructor = {
        name: 'HTMLCanvasElement'
      };
      Object.setPrototypeOf(mockCanvas, {
        constructor: { name: 'HTMLCanvasElement' }
      });
      
      // instanceofをオーバーライド
      // 型安全のために適切な型アサーションを使用
      const originalInstanceOf = Object.getOwnPropertyDescriptor(Object.prototype, Symbol.hasInstance)?.value as Function;
      Object.defineProperty(Function.prototype, Symbol.hasInstance, {
        value: function(instance: any): boolean {
        if (this.name === 'HTMLCanvasElement' && instance === mockCanvas) {
          return true;
        }
          return originalInstanceOf.call(this, instance);
        },
        configurable: true
      });
      
      const result = await captureElementAsBase64('#canvas');
      
      expect(result).toBe('mock-canvas-data');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
      
      // 元に戻す
      // 型安全のために再度Object.definePropertyを使用
      Object.defineProperty(Function.prototype, Symbol.hasInstance, {
        value: originalInstanceOf,
        configurable: true
      });
    });
    
    it('HTML要素がある場合はhtml2canvasを使用する', async () => {
      // HTML要素モックを作成
      const mockElement = { id: 'test-element' };
      
      // querySelectorが要素を返すように設定
      (global.document.querySelector as jest.Mock).mockReturnValue(mockElement);
      
      const result = await captureElementAsBase64('#element');
      
      expect(result).toBe('mock-canvas-data-url');
      // html2canvasの実際の呼び出しをテストするのは難しいので、
      // Dynamic importを使用しているため、ここではモック確認は行わない
    });
  });
  
  describe('captureWithMultipleSelectors', () => {
    it('複数のセレクタを順番に試行し、最初に成功したものを返す', async () => {
      // モックの設定
      (global.document.querySelector as jest.Mock)
        .mockReturnValueOnce(null) // 最初のセレクタは要素なし
        .mockReturnValueOnce({ id: 'test-element' }); // 2番目のセレクタで要素あり
      
      // captureElementAsBase64をモック
      const originalCapture = captureElementAsBase64;
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: jest.fn().mockImplementation((selector) => {
          if (selector === '.second-selector') {
            return Promise.resolve('mock-element-capture');
          }
          return Promise.resolve(null);
        })
      });
      
      const result = await captureWithMultipleSelectors(['.first-selector', '.second-selector', '.third-selector']);
      
      expect(result).toBe('mock-element-capture');
      expect(global.document.querySelector).toHaveBeenCalledTimes(2); // 3番目は試行されない
      
      // 元に戻す
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: originalCapture
      });
    });
    
    it('すべてのセレクタでキャプチャに失敗した場合はnullを返す', async () => {
      // すべてのセレクタで要素は存在するが、キャプチャに失敗する場合
      (global.document.querySelector as jest.Mock).mockReturnValue({ id: 'test-element' });
      
      // captureElementAsBase64をモック（常にnullを返す）
      const originalCapture = captureElementAsBase64;
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: jest.fn().mockResolvedValue(null)
      });
      
      const result = await captureWithMultipleSelectors(['.first', '.second']);
      
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('すべてのセレクタでキャプチャに失敗しました');
      
      // 元に戻す
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: originalCapture
      });
    });
  });
  
  describe('captureChartAsBase64', () => {
    it('ブラウザ環境以外ではエラーを返す', async () => {
      // windowをundefinedに設定
      global.window = undefined as any;
      
      await expect(captureChartAsBase64()).rejects.toThrow('ブラウザ環境でのみ実行できます');
    });
    
    it('指定されたセレクタでキャプチャに成功した場合は結果を返す', async () => {
      // captureElementAsBase64をモック
      const originalCapture = captureElementAsBase64;
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: jest.fn().mockResolvedValue('mock-chart-data')
      });
      
      const result = await captureChartAsBase64('#custom-chart');
      
      expect(result).toBe('mock-chart-data');
      expect(require('../screenshotUtils').captureElementAsBase64).toHaveBeenCalledWith('#custom-chart');
      
      // 元に戻す
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: originalCapture
      });
    });
    
    it('指定セレクタで失敗した場合は一般的なセレクタを試す', async () => {
      // captureElementAsBase64をモック（最初は失敗）
      const originalCapture = captureElementAsBase64;
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: jest.fn().mockResolvedValue(null)
      });
      
      // captureWithMultipleSelectorsをモック
      const originalCapture2 = captureWithMultipleSelectors;
      Object.defineProperty(require('../screenshotUtils'), 'captureWithMultipleSelectors', {
        value: jest.fn().mockResolvedValue('mock-general-chart-data')
      });
      
      const result = await captureChartAsBase64('#custom-chart');
      
      expect(result).toBe('mock-general-chart-data');
      expect(require('../screenshotUtils').captureWithMultipleSelectors).toHaveBeenCalled();
      
      // 元に戻す
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: originalCapture
      });
      Object.defineProperty(require('../screenshotUtils'), 'captureWithMultipleSelectors', {
        value: originalCapture2
      });
    });
    
    it('すべてのセレクタで失敗した場合はbodyをキャプチャする', async () => {
      // captureElementAsBase64をモック（カスタムセレクタで失敗）
      const originalCapture = captureElementAsBase64;
      const captureElementMock = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(null))  // 最初の呼び出し（カスタムセレクタ）
        .mockImplementationOnce(() => Promise.resolve('mock-body-capture')); // 2回目の呼び出し（body）
        
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: captureElementMock
      });
      
      // captureWithMultipleSelectorsをモック（一般的なセレクタでも失敗）
      const originalCapture2 = captureWithMultipleSelectors;
      Object.defineProperty(require('../screenshotUtils'), 'captureWithMultipleSelectors', {
        value: jest.fn().mockResolvedValue(null)
      });
      
      const result = await captureChartAsBase64('#custom-chart');
      
      expect(result).toBe('mock-body-capture');
      expect(captureElementMock).toHaveBeenCalledWith('body');
      
      // 元に戻す
      Object.defineProperty(require('../screenshotUtils'), 'captureElementAsBase64', {
        value: originalCapture
      });
      Object.defineProperty(require('../screenshotUtils'), 'captureWithMultipleSelectors', {
        value: originalCapture2
      });
    });
  });
}); 