// utils/screenshotUtils.ts
// チャートキャプチャ機能の実装
// 修正: 価格情報を含むフルキャプチャを確実に取得するように改善

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
      
      // キャプチャオプション - 品質と範囲を改善
      const options = {
        allowTaint: true,        // CORS制限を無視（可能な場合）
        useCORS: true,           // CORS対応（可能な場合）
        logging: false,          // デバッグログを無効化
        scale: 2,                // 高解像度でキャプチャ
        backgroundColor: '#151924', // チャート背景色と一致させる
        windowWidth: window.innerWidth, // ウィンドウ幅を考慮
        windowHeight: window.innerHeight, // ウィンドウ高さを考慮
        scrollX: window.scrollX,  // スクロール位置を考慮
        scrollY: window.scrollY,  // スクロール位置を考慮
        width: element.scrollWidth, // 要素の実際の幅を使用
        height: element.scrollHeight, // 要素の実際の高さを使用
        imageTimeout: 10000,     // 画像読み込みタイムアウトを長めに設定
        removeContainer: true    // キャプチャ後に一時コンテナを削除
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
  console.log(`${selectors.length}個のセレクタでキャプチャを試行します`);
  
  for (const selector of selectors) {
    try {
      console.log(`セレクタ "${selector}" でキャプチャを試行中...`);
      const imageData = await captureElementAsBase64(selector);
      
      if (imageData) {
        console.log(`セレクタ "${selector}" でキャプチャ成功`);
        return imageData;
      }
    } catch (error) {
      console.warn(`セレクタ "${selector}" でのキャプチャ中にエラー:`, error);
      // エラーが発生しても次のセレクタを試す
      continue;
    }
  }
  
  console.warn('すべてのセレクタでキャプチャに失敗しました');
  return null;
};

/**
 * チャートコンテナ要素をキャプチャする - 価格情報を含むフルキャプチャを優先
 * @param chartSelector キャプチャするチャート要素のセレクタ
 * @returns Base64形式の画像データ
 */
export const captureChartAsBase64 = async (chartSelector: string = '#chart-container'): Promise<string | null> => {
  try {
    // ブラウザ環境のみで実行
    if (typeof window === 'undefined') {
      throw new Error("このユーティリティはブラウザ環境でのみ実行できます");
    }

    console.log('チャートキャプチャモード: 価格情報を含むフルキャプチャ優先');
    
    // まずチャートと価格情報を含む広いセレクタを試す
    const priceChartSelectors = [
      // 価格情報を含む広い範囲のセレクタ
      '.chart-section-with-price', // 価格情報を含むチャートセクション
      '.chart-and-price-container', // 価格とチャートのコンテナ
      '.chart-with-price-info', // 価格情報を含むコンテナ
      '.chart-with-indicators', // インジケーターを含むチャート
      '.trading-chart-container', // トレーディングチャートコンテナ
      '.price-chart-container', // 価格チャートコンテナ
      '.chart-container-parent', // 親要素とその周辺要素を含むセレクタ
      '.chart-price-combined', // チャートと価格の組み合わせ
      '.chart-section', // チャートセクション全体
      '.flex-col-full', // 全体コンテナ
      '#chart-section', // IDベースのセレクタ
      chartSelector, // 指定されたセレクタ
    ];
    
    console.log('価格情報を含むチャートセレクタを試行します');
    let imageData = await captureWithMultipleSelectors(priceChartSelectors);
    
    // 価格情報を含むセレクタで失敗した場合、一般的なセレクタを試す
    if (!imageData) {
      console.log('価格情報を含むセレクタでのキャプチャに失敗、一般的なセレクタを試行します');
      
      // 一般的なチャートのセレクタを試す
      const commonSelectors = [
        // TradingView Lightweight Charts用のセレクタ
        '.tv-lightweight-charts',
        '#radix-\:Rl3ql7\:-content-chart',
        // 価格情報を含む広い範囲のセレクタを優先
        '.chart-section-with-price', // 価格情報を含むチャートセクション
        '.chart-and-price-container', // 価格とチャートのコンテナ
        '.chart-with-indicators', // インジケーターを含むチャート
        '.trading-chart-container', // トレーディングチャートコンテナ
        '.price-chart-container', // 価格チャートコンテナ
        '.chart-section', // チャートセクション全体
        '.chart-container-wrapper', // チャートコンテナのラッパー
        '.flex-col-full', // 全体コンテナ
        '.chart-with-price-info', // 価格情報を含むコンテナ
        '#chart-section', // IDベースのセレクタ
        '.chart-container', // 標準的なチャートコンテナ
        '#chart-container',
        // 親要素とその周辺要素を含むセレクタ
        '.chart-container-parent',
        '.price-display-area',
        '.chart-price-combined',
        // 標準的なチャート要素
        '.tradingview-widget-container',
        '.trading-chart',
        '#trading-chart',
        '.trading-view-chart',
        'div[role="main"]',
        '.chart',
        // 価格情報要素
        '.price-axis-container',
        '.pane-legend-line',
        '.chart-status-wrapper',
        '.price-axis',
        '.chart-markup-table',
        // 最後に個別のcanvas要素を試す
        'canvas', 
        '.chart-canvas', 
        '.tradingview-wrapper canvas',
        '.tradingview-widget-container canvas',
        '.flex-col-full canvas'
      ];
      
      imageData = await captureWithMultipleSelectors(commonSelectors);
    }
    
    if (!imageData) {
      console.warn('チャート要素のキャプチャに完全に失敗しました');
      
      // 最後の手段としてフルページキャプチャを試す
      console.log('最後の手段としてフルページキャプチャを試行します');
      imageData = await captureElementAsBase64('body');
      
      if (imageData) {
        console.log('フルページキャプチャ成功');
      }
    } else {
      console.log('チャートキャプチャ成功');
    }
    
    return imageData;
  } catch (error) {
    console.error('チャートキャプチャエラー:', error);
    return null;
  }
};
