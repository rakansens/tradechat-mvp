// utils/socketClient.ts
// Socket.ioクライアント接続の管理
// 更新: 2025-05-07 - ソケット初期化ロジックの信頼性を向上し、Mastraツールからの利用を改善
// 変更内容: 初期化状態のチェックを強化、エラーハンドリングの向上

import { Socket, io } from 'socket.io-client';
import { captureChartAsBase64 } from './screenshotUtils';

// シングルトンソケットインスタンス
let socket: Socket | null = null;

// ソケット初期化状態と接続試行回数
let isInitialized = false;
let clientId = '';
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

/**
 * Socket.ioクライアントを初期化
 * チャートキャプチャのイベントハンドラを設定
 */
export function initializeSocketClient(forceReinitialize = false): boolean {
  // 既に初期化済みで、強制再初期化フラグがない場合は早期リターン
  if (isInitialized && !forceReinitialize) {
    console.log('Socket.IOは既に初期化済みです');
    return true;
  }
  
  // 初期化試行回数が上限を超えている場合
  if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS && !forceReinitialize) {
    console.warn(`Socket.IO初期化が${MAX_INITIALIZATION_ATTEMPTS}回失敗しました。forceReinitializeフラグを使用してください`);
    return false;
  }
  
  // ブラウザ環境かどうかを確認
  if (typeof window === 'undefined') {
    console.warn('socketClientはブラウザ環境でのみ初期化できます');
    return false;
  }
  
  // 既存のソケットインスタンスがある場合は切断
  if (socket) {
    try {
      socket.disconnect();
      socket = null;
    } catch (e) {
      console.warn('既存のSocket.IO接続の切断に失敗しました:', e);
    }
  }
  
  // 初期化カウンタをインクリメント
  initializationAttempts++;
  
  try {
    // Socket.io接続を初期化 - 接続設定を改善
    socket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'] // WebSocketとポーリングの両方を使用
    });
    
    // 接続成功時の処理
    socket.on('connected', (data: { clientId: string }) => {
      console.log('Socket.IO接続成功:', data);
      clientId = data.clientId;
      isInitialized = true;
    });
    
    // 時間足変更イベントのリスナー
    socket.on('changeTimeframe', (data: { timeframe: string }) => {
      console.log('時間足変更イベント受信:', data);
      
      // グローバルイベントを発行して、チャートコンポーネントに通知
      const event = new CustomEvent('timeframeChanged', { detail: data });
      window.dispatchEvent(event);
      
      // ローカルストレージに最新の時間足を保存
      try {
        localStorage.setItem('selectedTimeframe', data.timeframe);
      } catch (error) {
        console.warn('ローカルストレージへの時間足保存に失敗しました:', error);
      }
    });
    
    // 銘柄変更イベントのリスナー
    socket.on('changeSymbol', (data: { symbol: string }) => {
      console.log('銘柄変更イベント受信:', data);
      
      // グローバルイベントを発行して、チャートコンポーネントに通知
      const event = new CustomEvent('symbolChanged', { detail: data });
      window.dispatchEvent(event);
      
      // ローカルストレージに最新の銘柄を保存
      try {
        localStorage.setItem('selectedSymbol', data.symbol);
      } catch (error) {
        console.warn('ローカルストレージへの銘柄保存に失敗しました:', error);
      }
    });
    
    // タイムアウト後のレスポンス処理
    socket.on('delayed_capture_success', (data: { requestId: string, imageId: string, message: string }) => {
      console.log('タイムアウト後のキャプチャ成功通知受信:', data);
      // ここでUIに通知を表示するなどの処理を追加できます
    });
    
    // キャプチャリクエスト受信時の処理
    socket.on('capture_request', async (data: { requestId: string }) => {
      try {
        // 重複リクエストを防ぐためのマップ
        const processedRequests = new Map<string, number>();
        
        // 既に処理中のリクエストか確認
        if (processedRequests.has(data.requestId)) {
          const timestamp = processedRequests.get(data.requestId);
          // 5秒以内の重複リクエストは無視
          if (timestamp && Date.now() - timestamp < 5000) {
            console.log(`重複リクエストを無視: ${data.requestId}`);
            return;
          }
        }
        
        // リクエストを処理中として記録
        processedRequests.set(data.requestId, Date.now());
        
        console.log('キャプチャリクエスト受信:', data);
        console.log('現在のSocket状態 - 接続済み:', socket?.connected, 'クライアントID:', clientId);
        
        // デバッグ用：ドキュメント要素の確認
        if (typeof document !== 'undefined') {
          console.log('ドキュメント要素確認 - body存在:', !!document.body);
          console.log('canvas要素数:', document.querySelectorAll('canvas').length);
          console.log('.chart-container要素数:', document.querySelectorAll('.chart-container').length);
          
          // チャート要素の分析を行い、ログに出力
          const chartElements = document.querySelectorAll('canvas, .chart-container, [id*="chart"], [class*="chart"]');
          console.log(`チャート関連要素数: ${chartElements.length}`);
          
          // chart-elements-analysis.jsonの分析結果を元に、最適なセレクタを使用
          const chartElementsAnalysis: {selector: string, tagName: string, id: string, className: string, rect: {x: number, y: number, width: number, height: number}}[] = [];
          
          // チャート要素の分析情報を収集
          chartElements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            chartElementsAnalysis.push({
              selector: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className.replace(/\s+/g, '.')}` : ''}:nth-of-type(${index + 1})`,
              tagName: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className,
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              }
            });
          });
          
          // 分析情報をログに出力
          console.log('チャート要素分析:', JSON.stringify(chartElementsAnalysis, null, 2));
        }
        
        // チャート要素をキャプチャ - まず直接フルページを試す
        console.log('フルページキャプチャを試行');
        let imageData: string | null = null;
        
        try {
          // まずフルページをキャプチャ
          imageData = await captureChartAsBase64('body');
          if (imageData) {
            console.log('フルページキャプチャ成功');
          } else {
            console.log('フルページキャプチャ失敗、個別要素を試行します');
            
            // chart-elements-analysis.jsonの分析結果を元に、セレクタを生成
            const possibleSelectors = [
              // TradingViewのチャートセレクタ
              '#radix-\:Rl3ql7\:-content-chart',
              '#radix-:Rl3ql7:-content-chart',
              '[id^="radix-"][id$="-content-chart"]',
              '.tv-lightweight-charts',
              
              // 価格情報を含む広い範囲のセレクタ
              '.chart-section-with-price',
              '.chart-and-price-container',
              '.chart-with-price-info',
              '.chart-with-indicators',
              '.trading-chart-container',
              '.price-chart-container',
              '.chart-section',
              '.flex-col-full',
              '#chart-section',
              
              // 標準的なチャートコンテナ
              '.chart-container',
              '#chart-container',
              '[class*="chart"]',
              '[id*="chart"]',
              
              // 個別のcanvas要素
              'canvas', 
              '.chart-canvas', 
              '.tradingview-wrapper canvas',
              'canvas:nth-of-type(1)',
              'canvas:nth-of-type(2)',
              'canvas:nth-of-type(3)',
              'canvas:nth-of-type(4)',
              'canvas:nth-of-type(5)',
              'canvas:nth-of-type(6)'
            ];
            
            // セレクタを順番に試す
            for (const selector of possibleSelectors) {
              console.log(`セレクタを試行: ${selector}`);
              try {
                imageData = await captureChartAsBase64(selector);
                if (imageData) {
                  console.log(`キャプチャ成功: ${selector}`);
                  break;
                }
              } catch (e) {
                console.warn(`セレクタでの失敗: ${selector}`, e);
              }
            }
          }
        } catch (e) {
          console.error('フルページキャプチャ中のエラー:', e);
        }
        
        // 処理完了後にマップから削除
        setTimeout(() => {
          processedRequests.delete(data.requestId);
        }, 10000); // 10秒後に削除
        
        if (imageData) {
          console.log(`キャプチャ成功、データ送信 - ID: ${data.requestId}`);
          // 成功時はレスポンスを送信
          socket?.emit('capture_response', {
            requestId: data.requestId,
            imageData
          });
        } else {
          console.warn(`チャート要素が見つかりません - ID: ${data.requestId}`);
          // キャプチャ失敗時
          socket?.emit('error_message', {
            requestId: data.requestId,
            error: 'チャート要素を見つけられませんでした'
          });
        }
      } catch (error) {
        console.error('キャプチャエラー:', error);
        
        // エラー時のレスポンス
        socket?.emit('error_message', {
          requestId: data.requestId,
          error: `キャプチャ処理中にエラーが発生しました: ${error}`
        });
      }
    });
    
    // 切断時の処理
    socket.on('disconnect', () => {
      console.log('Socket.IO切断');
      isInitialized = false;
    });
    
    // エラー発生時の処理
    socket.on('connect_error', (error) => {
      console.error('Socket.IO接続エラー:', error);
      isInitialized = false;
    });
    
    console.log('Socket.IO初期化完了');
  } catch (error) {
    console.error('Socket.IO初期化エラー:', error);
    isInitialized = false;
    return false;
  }
  
  return isInitialized;
}

/**
 * クライアント側からキャプチャをリクエスト（テスト用）
 * @returns キャプチャしたBase64画像データ
 */
export function requestCaptureFromClient(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!socket || !isInitialized) {
      reject(new Error('Socket.IO接続が初期化されていません'));
      return;
    }
    
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // タイムアウト設定
    const timeout = setTimeout(() => {
      socket?.off('capture_response', responseHandler);
      socket?.off('error_message', errorHandler);
      reject(new Error('キャプチャリクエストがタイムアウトしました'));
    }, 10000);
    
    // レスポンスハンドラ
    const responseHandler = (data: { requestId: string, imageData: string }) => {
      if (data.requestId === requestId) {
        clearTimeout(timeout);
        resolve(data.imageData);
        socket?.off('capture_response', responseHandler);
        socket?.off('error_message', errorHandler);
      }
    };
    
    // エラーハンドラ
    const errorHandler = (data: { requestId: string, error: string }) => {
      if (data.requestId === requestId) {
        clearTimeout(timeout);
        reject(new Error(data.error));
        socket?.off('capture_response', responseHandler);
        socket?.off('error_message', errorHandler);
      }
    };
    
    // ハンドラを登録
    socket.on('capture_response', responseHandler);
    socket.on('error_message', errorHandler);
    
    // リクエスト送信
    socket.emit('capture_request', { requestId });
  });
}

/**
 * ソケット接続を取得し、必要に応じて初期化を試みる
 * @param attemptInitialize 接続がない場合に初期化を試みるかどうか
 * @returns ソケットインスタンス
 */
export function getSocket(attemptInitialize = false): Socket | null {
  if (!socket && attemptInitialize) {
    initializeSocketClient();
  }
  return socket;
}

/**
 * クライアントIDを取得
 * @returns クライアントID
 */
export function getClientId(): string {
  return clientId;
}

/**
 * ソケットイベントを発行
 * @param eventName イベント名
 * @param data 送信データ
 * @param callback コールバック関数
 * @returns 成功した場合はtrue、失敗した場合はfalse
 */
export function emitEvent(eventName: string, data: any, callback?: (response: any) => void): boolean {
  if (!socket || !isInitialized) {
    console.warn(`Socket.IO接続が初期化されていません。イベント ${eventName} を発行できません。`);
    return false;
  }

  try {
    if (callback) {
      socket.emit(eventName, data, callback);
    } else {
      socket.emit(eventName, data);
    }
    return true;
  } catch (error) {
    console.error(`イベント ${eventName} の発行中にエラーが発生しました:`, error);
    return false;
  }
}
