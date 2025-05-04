// utils/screenshotUtils.ts
// チャートキャプチャ機能の実装

/**
 * 指定されたセレクタの要素をキャプチャしてBase64文字列として返す
 * @param selector キャプチャする要素のCSSセレクタ
 * @returns Base64形式の画像データ
 */
export const captureElementAsBase64 = async (selector: string): Promise<string> => {
  try {
    // ブラウザ環境かどうかを確認
    if (typeof window === 'undefined') {
      throw new Error("このユーティリティはブラウザ環境でのみ実行できます");
    }

    // 要素の取得
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
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
      throw new Error('HTML要素のキャプチャに失敗しました。html2canvasライブラリがインストールされているか確認してください。');
    }
  } catch (error) {
    console.error('Error capturing element:', error);
    throw error;
  }
};

/**
 * チャートコンテナ要素をキャプチャする
 * @returns Base64形式の画像データ
 */
export const captureChartAsBase64 = async (): Promise<string> => {
  try {
    // チャートのキャンバス要素のセレクタ
    // 実際のチャートコンポーネントのセレクタに合わせて調整
    const chartCanvasSelector = '.chart-canvas canvas';
    
    // 要素があるか確認
    const element = document.querySelector(chartCanvasSelector);
    if (!element) {
      // フォールバックとしてチャートコンテナ全体を試す
      const chartContainerSelector = '.chart-container';
      const containerElement = document.querySelector(chartContainerSelector);
      
      if (!containerElement) {
        throw new Error('チャート要素が見つかりません。セレクタを確認してください。');
      }
      
      return captureElementAsBase64(chartContainerSelector);
    }
    
    return captureElementAsBase64(chartCanvasSelector);
  } catch (error) {
    console.error('Error capturing chart:', error);
    throw error;
  }
}; 