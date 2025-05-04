// utils/screenshotUtils.ts
// チャートキャプチャ機能の実装

/**
 * 指定されたセレクタの要素をキャプチャしてBase64文字列として返す
 * @param selector キャプチャする要素のCSSセレクタ
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @returns Base64形式の画像データ
 */
export const captureElementAsBase64 = async (
  selector: string,
  timeoutMs: number = 5000
): Promise<string | null> => {
  try {
    // ブラウザ環境かどうかを確認
    if (typeof window === 'undefined') {
      throw new Error("このユーティリティはブラウザ環境でのみ実行できます");
    }

    // 要素が見つかるまで待機するプロミス
    const waitForElement = (selector: string, maxWaitMs: number): Promise<Element | null> => {
      return new Promise((resolve) => {
        // 要素が既に存在するか確認
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }

        // タイムアウト処理
        const timeout = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, maxWaitMs);

        // DOM変更の監視を開始
        const observer = new MutationObserver((mutations, observer) => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            clearTimeout(timeout);
            resolve(element);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    };

    // 要素を待機して取得
    const element = await waitForElement(selector, timeoutMs);
    if (!element) {
      console.warn(`セレクタ "${selector}" の要素が ${timeoutMs}ms 以内に見つかりませんでした`);
      return null;
    }

    // Canvas要素の場合は直接データを取得
    if (element instanceof HTMLCanvasElement) {
      try {
        return element.toDataURL('image/png');
      } catch (err) {
        // CORS制限に引っかかった場合など
        console.warn('Canvas直接キャプチャに失敗:', err);
      }
    }

    // HTML要素の場合はhtml2canvasを使用
    try {
      // 動的にhtml2canvasをインポート
      const html2canvas = (await import('html2canvas')).default;
      
      // キャプチャオプション
      const options = {
        allowTaint: true,        // CORS制限を無視（可能な場合）
        useCORS: true,           // CORS対応（可能な場合）
        logging: false,          // デバッグログを無効化
        scale: window.devicePixelRatio || 1, // Retinaディスプレイ対応
        backgroundColor: null    // 背景を透明に
      };
      
      const canvas = await html2canvas(element as HTMLElement, options);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('html2canvas エラー:', error);
      return null;
    }
  } catch (error) {
    console.error('キャプチャエラー:', error);
    return null;
  }
};

/**
 * 複数のセレクタを順番に試して最初に成功したものをキャプチャ
 * @param selectors 試すセレクタの配列
 * @returns Base64形式の画像データ
 */
export const captureWithMultipleSelectors = async (
  selectors: string[]
): Promise<string | null> => {
  for (const selector of selectors) {
    try {
      console.log(`セレクタでキャプチャ試行: ${selector}`);
      // 要素の存在確認
      const element = document.querySelector(selector);
      if (!element) {
        console.log(`セレクタに一致する要素なし: ${selector}`);
        continue;
      }
      
      // セレクタが有効な場合、キャプチャを試行
      const imageData = await captureElementAsBase64(selector);
      if (imageData) {
        console.log(`キャプチャ成功: ${selector}`);
        return imageData;
      }
    } catch (e) {
      console.warn(`セレクタでの失敗: ${selector}`, e);
    }
  }
  
  console.warn('すべてのセレクタでキャプチャに失敗しました');
  return null;
};

/**
 * チャートコンテナ要素をキャプチャする
 * @returns Base64形式の画像データ
 */
export const captureChartAsBase64 = async (chartSelector: string = '#chart-container'): Promise<string | null> => {
  try {
    // ブラウザ環境のみで実行
    if (typeof window === 'undefined') {
      throw new Error("このユーティリティはブラウザ環境でのみ実行できます");
    }

    // 指定されたセレクタをまず試す
    let imageData = await captureElementAsBase64(chartSelector);
    
    // 指定セレクタで失敗した場合、一般的なセレクタを試す
    if (!imageData) {
      console.log('指定セレクタでのキャプチャに失敗、一般的なセレクタを試行します');
      
      // 一般的なチャートのセレクタを試す
      const commonSelectors = [
        'canvas', 
        '.chart-canvas', 
        '.tradingview-wrapper canvas', 
        '.chart-container',
        '#chart-container',
        '.tradingview-widget-container canvas',
        '.trading-chart',
        '#trading-chart',
        '.trading-view-chart',
        'div[role="main"] canvas',
        '.chart',
        '.flex-col-full canvas'
      ];
      
      imageData = await captureWithMultipleSelectors(commonSelectors);
    }
    
    // それでも失敗した場合、最終手段として画面全体をキャプチャ
    if (!imageData) {
      console.log('最終手段: 画面全体をキャプチャします');
      imageData = await captureElementAsBase64('body');
    }
    
    if (!imageData) {
      console.warn('チャート要素のキャプチャに完全に失敗しました');
    }
    
    return imageData;
  } catch (error) {
    console.error('チャートキャプチャエラー:', error);
    return null;
  }
}; 