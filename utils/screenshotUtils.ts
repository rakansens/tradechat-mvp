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
      console.warn(`Element with selector "${selector}" not found within ${timeoutMs}ms`);
      return null;
    }

    // Canvas要素の場合は直接データを取得
    if (element instanceof HTMLCanvasElement) {
      return element.toDataURL('image/png');
    }

    // HTML要素の場合はhtml2canvasを使用
    try {
      // 動的にhtml2canvasをインポート
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element as HTMLElement);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('html2canvas error:', error);
      return null;
    }
  } catch (error) {
    console.error('Capture error:', error);
    return null;
  }
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

    // ロードインジケータを表示する（オプション）
    // showLoadingIndicator();
    
    // チャート要素をキャプチャ
    const imageData = await captureElementAsBase64(chartSelector);
    
    // ロードインジケータを非表示にする（オプション）
    // hideLoadingIndicator();
    
    if (!imageData) {
      console.warn('チャート要素のキャプチャに失敗しました');
    }
    
    return imageData;
  } catch (error) {
    console.error('チャートキャプチャエラー:', error);
    return null;
  }
}; 