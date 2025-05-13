/**
 * services/api/bitget/utils.ts
 * Bitget API関連のユーティリティ関数
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリングに伴うユーティリティ関数の抽出
 * 更新: 2025-05-12 - タイムフレーム変換関数を追加
 * 
 * このファイルは、Bitget API操作に関連するユーティリティ関数を提供します。
 * シンボル変換、WebSocket作成、データ変換などの共通機能を含みます。
 */

import { IS_BROWSER } from '../common/environment';
import { logger } from '../../../utils/logger';

/**
 * 先物取引で利用できない可能性が高い銘柄のパターン
 */
export const UNSUPPORTED_FUTURES_PATTERNS = [
  /USDC$/,  // USDC建ての通貨ペア
  /[^B]BTC$/  // BTC建ての通貨ペア（BTC自体は除く）
];

/**
 * 環境に応じたWebSocketの作成
 * @param url WebSocketのURL
 * @returns WebSocketインスタンス、または作成に失敗した場合はnull
 */
export function createWebSocket(url: string): WebSocket | null {
  if (IS_BROWSER) {
    // ブラウザ環境ではnativeのWebSocketを使用
    return new WebSocket(url);
  } else {
    // Node.js環境ではwsライブラリを使用（サーバーサイドのみ）
    try {
      const WebSocketImpl = require('ws');
      return new WebSocketImpl(url);
    } catch (e) {
      logger.error('Failed to create WebSocket in Node.js environment', e, {
        component: 'BitgetApi',
        action: 'createWebSocket'
      });
      return null;
    }
  }
}

/**
 * 先物取引で利用可能な銘柄かどうかをチェックする
 * @param symbol チェックするシンボル
 * @returns 利用可能な場合はtrue、そうでない場合はfalse
 */
export function isSupportedFuturesSymbol(symbol: string): boolean {
  // _UMCBL サフィックスを削除
  const cleanSymbol = symbol.replace(/_UMCBL$/i, '');
  
  // サポートされていないパターンにマッチするかチェック
  for (const pattern of UNSUPPORTED_FUTURES_PATTERNS) {
    if (pattern.test(cleanSymbol)) {
      logger.info(`先物取引でサポートされていない銘柄です: ${cleanSymbol}`, {
        component: 'BitgetApi',
        action: 'isSupportedFuturesSymbol',
        symbol: cleanSymbol
      });
      return false;
    }
  }
  
  return true;
}

/**
 * 先物取引用のシンボルを正規化する（_UMCBLサフィックスの削除のみ）
 * @param symbol 元のシンボル
 * @returns 正規化されたシンボル
 */
export function normalizeFuturesSymbol(symbol: string): string {
  // _UMCBL サフィックスを削除するのみ
  return symbol.replace(/_UMCBL$/i, '');
}

/**
 * シンボルを正しい形式に変換（スラッシュを削除）
 * @param symbol 元のシンボル（例: 'BTC/USDT'）
 * @returns フォーマットされたシンボル（例: 'BTCUSDT'）
 */
export function formatSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase();
}

/**
 * 取引タイプに応じてシンボルを正規化する
 * @param symbol 元のシンボル
 * @param exchangeType 取引タイプ
 * @returns 正規化されたシンボル
 */
export function normalizeSymbol(symbol: string, exchangeType: 'spot' | 'futures'): string {
  const formattedSymbol = formatSymbol(symbol);
  
  if (exchangeType === 'futures') {
    return normalizeFuturesSymbol(formattedSymbol);
  }
  
  return formattedSymbol;
}

/**
 * タイムフレームをBitget V2 API形式に変換
 * @param timeframe 標準的なタイムフレーム（例: '1m', '1h', '1d'）
 * @returns Bitget API V2形式のタイムフレーム
 */
export function convertTimeframeToBitgetV2Format(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1min',      // 1分足
    '3m': '3min',      // 3分足
    '5m': '5min',      // 5分足
    '15m': '15min',    // 15分足
    '30m': '30min',    // 30分足
    '1h': '1H',        // 1時間足
    '4h': '4H',        // 4時間足
    '6h': '6H',        // 6時間足
    '12h': '12H',      // 12時間足
    '1d': '1D',        // 日足
    '3d': '3D',        // 3日足
    '1w': '1W',        // 週足
    '1M': '1M',        // 月足
  };
  
  return mapping[timeframe] || '1D'; // デフォルトは日足
}

/**
 * APIレスポンスからローソク足データに変換する
 * 時間足に応じた処理を行う
 */
function convertCandleData(responseData: any[], timeframe: string): any[] {
  if (!Array.isArray(responseData) || responseData.length === 0) {
    return [];
  }
  
  // データを昇順にソート（時間の古い順）
  const sortedData = [...responseData].sort((a, b) => {
    // 配列形式と想定
    if (Array.isArray(a) && Array.isArray(b)) {
      return parseInt(a[0]) - parseInt(b[0]);
    }
    // オブジェクト形式と想定
    if (a.timestamp && b.timestamp) {
      return parseInt(String(a.timestamp)) - parseInt(String(b.timestamp));
    }
    if (a.time && b.time) {
      return parseInt(String(a.time)) - parseInt(String(b.time));
    }
    // それ以外の場合はそのまま返す
    return 0;
  });
  
  return sortedData
    .map((candle: any) => {
      try {
        let result: any = {};
        
        // 配列形式かオブジェクト形式か判断
        if (Array.isArray(candle)) {
          // 必要なデータが存在するか確認（最低6要素必要）
          if (candle.length < 6) {
            return null;
          }
          
          // タイムスタンプを処理
          const timestamp = parseInt(candle[0]);
          if (isNaN(timestamp) || timestamp <= 0) {
            return null;
          }
          
          // 価格データを処理
          const parsedOpen = parseFloat(candle[1]);
          const parsedHigh = parseFloat(candle[2]);
          const parsedLow = parseFloat(candle[3]);
          const parsedClose = parseFloat(candle[4]);
          const parsedVolume = parseFloat(candle[5]);
          
          // 価格が有効か確認
          if (isNaN(parsedOpen) || isNaN(parsedHigh) || isNaN(parsedLow) || isNaN(parsedClose) || isNaN(parsedVolume)) {
            return null;
          }
          
          // 価格の異常値を修正（極端に高いまたは低い値）
          // 例：高値が安値より低い場合や始値・終値が範囲外の場合
          let adjustedHigh = parsedHigh;
          let adjustedLow = parsedLow;
          
          if (adjustedHigh < parsedOpen || adjustedHigh < parsedClose) {
            adjustedHigh = Math.max(parsedOpen, parsedClose);
          }
          
          if (adjustedLow > parsedOpen || adjustedLow > parsedClose) {
            adjustedLow = Math.min(parsedOpen, parsedClose);
          }
          
          // ミリ秒単位のタイムスタンプであることを確認
          let normalizedTimestamp = timestamp;
          if (timestamp < 10000000000) {
            normalizedTimestamp = timestamp * 1000; // 秒からミリ秒に変換
          }
          
          result = {
            time: normalizedTimestamp, // lightweight-chartsの要件に合わせてtimeとして設定
            open: parsedOpen,
            high: adjustedHigh,
            low: adjustedLow,
            close: parsedClose,
            volume: parsedVolume
          };
        } else {
          // オブジェクト形式の場合
          // 必要なデータが存在するか確認
          if (!candle.open || !candle.high || !candle.low || !candle.close) {
            return null;
          }
          
          // タイムスタンプの取得と検証
          const timestamp = parseInt(String(candle.timestamp || candle.ts || candle.time || Date.now()));
          if (isNaN(timestamp) || timestamp <= 0) {
            // タイムスタンプが無効な場合は現在時刻を使用
            result = {
              time: Date.now(),
              open: parseFloat(String(candle.open)),
              high: parseFloat(String(candle.high)),
              low: parseFloat(String(candle.low)),
              close: parseFloat(String(candle.close)),
              volume: parseFloat(String(candle.volume || candle.vol || '0'))
            };
          } else {
            // ミリ秒単位のタイムスタンプであることを確認
            let normalizedTimestamp = timestamp;
            if (timestamp < 10000000000) {
              normalizedTimestamp = timestamp * 1000; // 秒からミリ秒に変換
          }
          
          result = {
              time: normalizedTimestamp,
            open: parseFloat(String(candle.open)),
            high: parseFloat(String(candle.high)),
            low: parseFloat(String(candle.low)),
            close: parseFloat(String(candle.close)),
            volume: parseFloat(String(candle.volume || candle.vol || '0'))
          };
          }
        }
        
        // 全ての値が有効か確認
        if (isNaN(result.open) || isNaN(result.high) || isNaN(result.low) || isNaN(result.close)) {
          return null;
        }
        
        return result;
      } catch (err) {
        return null;
      }
    })
    .filter((candle: any) => candle !== null) // nullを除外
    .sort((a: any, b: any) => a.time - b.time); // 時間順にソート
}

/**
 * WebSocket送信キューマネージャー
 * WebSocketが接続されていない場合はメッセージをキューに追加し、
 * 接続が確立されたらキューから送信する
 */
export class WebSocketSendQueue {
  private queue: string[] = [];
  private ws: WebSocket | null = null;
  private queueProcessorTimer: NodeJS.Timeout | null = null;
  private lastWarnTime = 0;
  private readonly WARN_THROTTLE = 10000; // 10秒
  
  /**
   * コンストラクタ
   */
  constructor() {
    // キュー処理を定期的に実行
    this.startQueueProcessor();
  }
  
  /**
   * WebSocketを設定
   * @param ws WebSocketインスタンス
   */
  setWebSocket(ws: WebSocket | null): void {
    this.ws = ws;
    
    // 接続が確立されていれば即座にキューを処理
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.processQueue();
    }
    
    // WebSocketが接続状態になったらキューを処理
    if (ws) {
      ws.addEventListener('open', () => {
        logger.info('WebSocketが接続されました。キューを処理します', {
          component: 'WebSocketSendQueue',
          action: 'setWebSocket',
          queueSize: this.queue.length
        });
        this.processQueue();
      });
    }
  }
  
  /**
   * メッセージを送信またはキューに追加
   * @param message 送信メッセージ
   */
  send(message: any): void {
    const stringMessage = typeof message === 'string' ? message : JSON.stringify(message);
    
    // WebSocketが接続済みであれば直接送信
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(stringMessage);
        return;
      } catch (error) {
        logger.error('WebSocketメッセージの送信に失敗しました', {
          component: 'WebSocketSendQueue',
          action: 'send',
          error
        });
        // 送信失敗時はキューに追加
        this.queue.push(stringMessage);
      }
    } else {
      // WebSocketが接続されていなければキューに追加
      this.queue.push(stringMessage);
      
      // 警告のスロットリング
      const now = Date.now();
      if (now - this.lastWarnTime > this.WARN_THROTTLE) {
        this.lastWarnTime = now;
        logger.warn('WebSocketが接続されていないため、メッセージをキューに追加します', {
          component: 'WebSocketSendQueue',
          action: 'send',
          queueSize: this.queue.length,
          wsState: this.ws ? this.getReadyStateString(this.ws.readyState) : 'null'
        });
      }
    }
  }
  
  /**
   * キューを処理
   */
  private processQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // キューが空の場合は何もしない
    if (this.queue.length === 0) {
      return;
    }
    
    logger.info(`キューからメッセージを処理します (${this.queue.length}件)`, {
      component: 'WebSocketSendQueue',
      action: 'processQueue'
    });
    
    // キューからメッセージを取り出して送信
    while (this.queue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      const message = this.queue.shift();
      if (message) {
        try {
          this.ws.send(message);
        } catch (error) {
          logger.error('キューからのメッセージ送信に失敗しました', {
            component: 'WebSocketSendQueue',
            action: 'processQueue',
            error
          });
          // 送信に失敗したメッセージは再度キューに追加（先頭に）
          this.queue.unshift(message);
          break;
        }
      }
    }
  }
  
  /**
   * キュー処理を定期的に実行
   */
  private startQueueProcessor(): void {
    // 既存のタイマーをクリア
    if (this.queueProcessorTimer) {
      clearInterval(this.queueProcessorTimer);
    }
    
    // 1秒ごとにキューを処理
    this.queueProcessorTimer = setInterval(() => {
      this.processQueue();
    }, 1000);
  }
  
  /**
   * キュー処理を停止
   */
  stopQueueProcessor(): void {
    if (this.queueProcessorTimer) {
      clearInterval(this.queueProcessorTimer);
      this.queueProcessorTimer = null;
    }
  }
  
  /**
   * キューをクリア
   */
  clearQueue(): void {
    this.queue = [];
  }
  
  /**
   * キューのサイズを取得
   */
  getQueueSize(): number {
    return this.queue.length;
  }
  
  /**
   * ReadyStateの文字列表現を取得
   */
  private getReadyStateString(state: number): string {
    switch (state) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return `UNKNOWN(${state})`;
    }
  }
}
