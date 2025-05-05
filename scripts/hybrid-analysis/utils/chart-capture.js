// scripts/hybrid-analysis/utils/chart-capture.js
// チャートキャプチャ機能を提供するユーティリティモジュール

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 単一のブラウザインスタンスを保持するためのキャッシュ
let sharedBrowser = null;

/**
 * 共有ブラウザインスタンスを取得または作成する
 * @param {Object} options Puppeteerのオプション
 * @returns {Promise<Browser>} Puppeteerブラウザインスタンス
 */
async function getSharedBrowser(options = {}) {
  if (!sharedBrowser) {
    console.log('新しいブラウザインスタンスを作成中...');
    const defaultOptions = {
      headless: false,
      defaultViewport: { width: 1280, height: 800 }
    };
    
    sharedBrowser = await puppeteer.launch({
      ...defaultOptions,
      ...options
    });
    
    // プロセス終了時にブラウザを確実に閉じる
    process.on('exit', () => {
      if (sharedBrowser) {
        try {
          sharedBrowser.close();
        } catch (e) {
          console.error('ブラウザクローズ中にエラー:', e);
        }
      }
    });
  }
  
  return sharedBrowser;
}

/**
 * ブラウザインスタンスを閉じる
 */
async function closeSharedBrowser() {
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
      sharedBrowser = null;
      console.log('共有ブラウザインスタンスを閉じました');
    } catch (e) {
      console.error('ブラウザクローズ中にエラー:', e);
    }
  }
}

/**
 * フロントエンドのチャートをキャプチャする最適化版関数
 * @param {string} symbol 通貨ペア
 * @param {string} timeframe タイムフレーム
 * @param {Object} options オプション
 * @returns {Promise<{chartImage: string, chartData: Object}>} キャプチャ結果
 */
async function captureChart(symbol, timeframe, options = {}) {
  console.log(`${timeframe} タイムフレームのチャートをキャプチャ中...`);
  
  const {
    url = 'http://localhost:3000',
    viewportWidth = 1280,
    viewportHeight = 800,
    browserOptions = {}
  } = options;
  
  // 共有ブラウザインスタンスを取得
  const browser = await getSharedBrowser(browserOptions);
  
  // 新しいページを作成
  const page = await browser.newPage();
  await page.setViewport({ width: viewportWidth, height: viewportHeight });
  
  try {
    // アプリケーションのURLにアクセス
    console.log(`${timeframe}: URLにアクセス: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`${timeframe}: ページをロード完了`);
    
    // ページが完全に読み込まれるまで少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 最適化されたセレクタリスト - フロントUIに存在する可能性が高いもののみを使用
    const selectors = [
      // 全体的なチャートセクションをキャプチャするセレクタを優先
      '.main-container',
      '.chart-area',
      '#app',
      
      // 一般的なコンテナ
      'main > div',
      'main',
      'section',
      
      // 具体的なチャート要素
      'div[class*="Chart"]',
      '[class*="chart"]',
      'div[id*="chart"]',
      'canvas',  // 個別キャンバスではなく、上位の要素を使用する
      
      // 最終手段
      'body'  // どのセレクタも見つからない場合はページ全体をキャプチャ
    ];
    
    // 各セレクタを試して、最初に見つかった要素を使用
    let chartElement = null;
    
    for (const selector of selectors) {
      try {
        console.log(`${timeframe}: セレクタを試行中: ${selector}`);
        await page.waitForSelector(selector, { timeout: 3000, visible: true });
        chartElement = await page.$(selector);
        if (chartElement) {
          console.log(`${timeframe}: セレクタ ${selector} でチャート要素を見つけました`);
          break;
        }
      } catch (e) {
        // 特定のセレクタが見つからない場合は次のセレクタを試す
      }
    }
    
    // チャート要素が見つからない場合は全画面をキャプチャ
    if (!chartElement) {
      console.log(`${timeframe}: 特定のチャート要素が見つからないため、全画面をキャプチャします`);
      chartElement = await page.$('body');
    }
    
    // スクリーンショットを取得
    const chartImage = await chartElement.screenshot({ 
      encoding: 'base64',
      fullPage: chartElement.toString().includes('body') // bodyの場合はフルページキャプチャ
    });
    console.log(`${timeframe}: チャートのスクリーンショットを取得しました`);
    
    // チャートデータをブラウザから取得
    let chartData = { candles: [], indicators: {} };
    try {
      chartData = await page.evaluate((symbol, timeframe) => {
        // グローバル変数からチャートデータを取得する試み
        if (window.chartComponent) {
          return {
            candles: window.chartComponent.getData?.() || [],
            indicators: {
              rsi: window.chartComponent.getIndicatorData?.('rsi') || [],
              macd: window.chartComponent.getIndicatorData?.('macd') || [],
              bollingerBands: window.chartComponent.getIndicatorData?.('bb') || []
            },
            symbol: window.chartComponent.getSymbol?.() || symbol,
            timeframe: window.chartComponent.getTimeframe?.() || timeframe
          };
        }
        
        // Zustand/Reduxのストア変数を探す
        if (window.__STORE_DATA__ || window.__REDUX_STATE__) {
          const storeData = window.__STORE_DATA__ || window.__REDUX_STATE__;
          return {
            candles: storeData?.chartData?.data || [],
            indicators: storeData?.indicators || {},
            symbol: storeData?.chartData?.currentSymbol || symbol,
            timeframe: storeData?.chartData?.currentTimeFrame || timeframe
          };
        }
        
        // DOM要素から情報を取得する試み
        const chartDataElement = document.querySelector('[data-chart-data]');
        if (chartDataElement) {
          try {
            return JSON.parse(chartDataElement.getAttribute('data-chart-data'));
          } catch (e) {
            console.error('DOM要素のデータ解析に失敗:', e);
          }
        }
        
        // 何も見つからない場合は空のデータを返す
        return {
          candles: [],
          indicators: {},
          symbol,
          timeframe
        };
      }, symbol, timeframe);
      
      console.log(`${timeframe}: チャートデータを取得: キャンドル数=${chartData.candles.length}`);
    } catch (error) {
      console.error(`${timeframe}: ブラウザからのデータ取得に失敗:`, error);
    }
    
    // ページを閉じる（ブラウザは共有なので閉じない）
    await page.close();
    
    return { chartImage, chartData };
  } catch (error) {
    console.error(`${timeframe}: チャートキャプチャ中にエラー:`, error);
    
    // エラー時でもページを確実に閉じる
    try {
      await page.close();
    } catch (e) {
      console.error(`${timeframe}: ページクローズ中にエラー:`, e);
    }
    
    throw error;
  }
}

module.exports = {
  captureChart,
  getSharedBrowser,
  closeSharedBrowser
};
