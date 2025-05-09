// utils/socketClient.ts
// Socket.IOクライアントの初期化とイベントハンドリング
// 作成: 2023-09-01
// 更新: 2023-10-15 - チャートデータの取得機能を追加
// 更新: 2023-11-20 - 取引タイプ切り替え機能のサポートを追加
// 更新: 2024-01-10 - 接続ステータス監視と再接続機能の改善
// 更新: 2024-02-20 - ロギングを構造化形式にアップグレード
// 更新: 2024-03-15 - App Store用の直接変更イベントを追加 (元のCustomEventも維持)
// 更新: 2025-05-09 - CustomEvent発行を削除し、App Store後方互換レイヤーを完全に移行
// 更新: 2025-05-09 - ローカルストレージの保存を最小限に抑える

import { Socket, io } from 'socket.io-client';
import { captureChartAsBase64 } from './screenshotUtils';
import { logger } from './logger';
import * as socketActions from '../store/socketActions';
import { Timeframe } from '@/types/chart';
import { ExchangeType } from '@/types/api';

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
export function initializeSocketClient(forceReinitialize = false, namespace?: string): boolean {
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
    const options = {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'] // WebSocketとポーリングの両方を使用
    };
    
    // 名前空間の問題を回避するため、デフォルトの名前空間のみを使用
    const baseUrl = window.location.origin; // 現在のオリジンを使用
    socket = io(baseUrl, options);
    
    // 接続成功時の処理
    socket.on('connected', (data: { clientId: string }) => {
      console.log('Socket.IO接続成功:', data);
      clientId = data.clientId;
      isInitialized = true;
      // 2. setSocketConnected を呼び出す
      socketActions.setConnected(true, 'connect-event');
      socketActions.setSocketId(clientId, 'connect-event');
    });
    
    // 時間足変更イベントのリスナー
    socket.on('changeTimeframe', (data: { timeframe: Timeframe }) => {
      logger.info('時間足変更イベント受信:', {
        component: 'socketClient',
        action: 'changeTimeframe',
        data,
        socketConnected: socket?.connected,
        clientId
      });
      // AppStoreを直接更新 - 後方互換性のためのCustomEvent発行は削除済み
      socketActions.setTimeframe(data.timeframe, 'socket-changeTimeframe');
      
      // AppStoreがストレージを管理するので最低限のストレージのみ
      try {
        // 両方のキーを使用して互換性を確保
        localStorage.setItem('lastUsedTimeframe', data.timeframe); // 新しいキー
        localStorage.setItem('selectedTimeframe', data.timeframe); // 旧キー(互換性のため)
        
        logger.info('時間足を両方のキーで保存しました:', {
          component: 'socketClient',
          action: 'changeTimeframe',
          timeframe: data.timeframe
        });
      } catch (error) {
        logger.warn('ローカルストレージへの時間足保存に失敗しました:', {
          component: 'socketClient',
          action: 'changeTimeframe',
          error
        });
      }
    });
    
    // 銘柄変更イベントのリスナー
    socket.on('changeSymbol', (data: { symbol: string, exchangeType?: ExchangeType, timeframe?: Timeframe }) => {
      logger.info('銘柄変更イベント受信:', {
        component: 'socketClient',
        action: 'changeSymbol',
        data,
        socketConnected: socket?.connected,
        clientId
      });
      
      // 取引タイプが指定されている場合は先に設定
      if (data.exchangeType) {
        logger.info(`銘柄変更時に取引タイプも指定されています: ${data.exchangeType}`, {
          component: 'socketClient',
          action: 'changeSymbol',
          exchangeType: data.exchangeType,
          symbol: data.symbol
        });
        
        // 取引タイプを先に設定
        socketActions.setExchangeType(data.exchangeType, data.symbol, 'socket-changeSymbol');
        
        // 少し遅延させて銘柄を設定
        setTimeout(() => {
          socketActions.setSymbol(data.symbol, 'socket-changeSymbol-with-type');
        }, 100);
      } else {
        // 取引タイプが指定されていない場合は通常の処理
        socketActions.setSymbol(data.symbol, 'socket-changeSymbol');
        
        // timeframeプロパティがある場合のみ設定
        if (data.timeframe) {
          socketActions.setTimeframe(data.timeframe, 'socket-changeSymbol');
        }
      }
      
      // AppStoreがストレージを管理するので、ここでは最低限の保存のみを行う
      try {
        localStorage.setItem('lastUsedSymbol', data.symbol);
      } catch (error) {
        logger.warn('ローカルストレージへの銘柄保存に失敗しました:', {
          component: 'socketClient',
          action: 'changeSymbol',
          error
        });
      }
    });
    
    // 取引タイプ変更イベントのリスナー
    socket.on('instrument-type-change', (data: { type: ExchangeType, fromType?: ExchangeType, symbol?: string }) => {
      logger.info('取引タイプ変更イベント受信:', {
        component: 'socketClient',
        action: 'instrument-type-change',
        data,
        socketConnected: socket?.connected,
        clientId,
        timestamp: Date.now(),
        fromFuturesToSpot: data.type === 'spot' ? '先物→現物の切り替え検出' : '現物→先物の切り替え検出'
      });
      
      try {
        // 現在の銘柄を取得（APIから送られてきた銘柄またはローカルストレージから）
        const currentSymbol = data.symbol || localStorage.getItem('lastUsedSymbol') || 'BTCUSDT';
        
        // AppStoreを直接更新 - 全てのUIはここから状態を読み取る
        socketActions.setExchangeType(data.type, currentSymbol, 'socket-instrument-type-change');
        
        logger.info('取引タイプが更新されました:', {
          component: 'socketClient',
          action: 'setExchangeType',
          type: data.type,
          symbol: currentSymbol
        });
        
        // AppStoreがストレージを管理するので最低限の保存のみ
        try {
          // AppStoreが参照するキーのみ保存
          localStorage.setItem('lastUsedExchangeType', data.type);
          localStorage.setItem('lastUsedSymbol', currentSymbol);
          
          logger.info('ストレージに取引情報を保存しました:', {
            component: 'socketClient',
            action: 'saveToLocalStorage',
            type: data.type,
            symbol: currentSymbol
          });
        } catch (error) {
          logger.warn('ストレージへの保存に失敗しました:', {
            component: 'socketClient',
            action: 'saveToLocalStorage',
            error
          });
        }
      } catch (error) {
        logger.error('グローバルイベントの発行に失敗しました:', {
          component: 'socketClient',
          action: 'dispatchEvent',
          error
        });
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
    socket.on('disconnect', (reason) => {
      logger.warn('Socket.IO切断:', {
        component: 'socketClient',
        action: 'disconnect',
        socketConnected: socket?.connected, // 切断直前はtrueかもしれないが、イベント後はfalse扱い
        clientId
      });
      isInitialized = false;
      clientId = '';
      socketActions.setConnected(false, 'disconnect-event');
      isInitialized = false; // 切断時は初期化フラグもリセット
      // socket = null; // ソケットインスタンスをクリア (再接続ロジックに影響する可能性あり)

      // 接続エラーハンドリング: UIに通知するか、再接続を試みるかなど
      // 現時点ではログ出力のみ
      logger.warn('socketClient: WebSocket接続が失われました。アプリケーションの状態に影響する可能性があります。', {
        component: 'socketClient',
        function: 'handleDisconnect',
        disconnectReason: reason // Changed from shorthand 'reason' to 'disconnectReason: reason'
      });

      // TODO: 必要であれば再接続ロジックをここに追加
      // 例: setTimeout(() => initializeSocketClient(), 5000); // 5秒後に再接続試行

      // 関連する状態をリセット (例: 購読中のデータストリームなど)
      // socketStoreActions.resetSubscriptions(); // 仮の関数
    });

    // 再接続試行時の処理
    socket.on('reconnect_attempt', () => {
      logger.info('Socket.IO再接続試行:', {
        component: 'socketClient',
        action: 'reconnect_attempt',
        socketConnected: socket?.connected,
        clientId
      });
    });

    // 再接続成功時の処理
    socket.on('reconnect', () => {
      logger.info('Socket.IO再接続成功:', {
        component: 'socketClient',
        action: 'reconnect',
        socketConnected: socket?.connected,
        clientId
      });
      isInitialized = true;
      socketActions.setConnected(true, 'reconnect-event');
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
    initializeSocketClient(false);
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
