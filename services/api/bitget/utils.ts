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
 * ローソク足データを標準形式に変換
 * @param responseData APIレスポンスデータ
 * @param timeframe タイムフレーム
 * @returns 標準化されたローソク足データ
 */
export function convertCandleData(responseData: any[], timeframe: string): any[] {
  if (!Array.isArray(responseData) || responseData.length === 0) {
    return [];
  }
  
  return responseData
    .map((candle: any) => {
      try {
        let result;
        // Bitget V2 APIのレスポンス形式に合わせて処理
        // [タイムスタンプ, 始値, 高値, 安値, 終値, 出来高, 出来安]
        if (Array.isArray(candle)) {
          // 必要なデータが存在するか確認
          if (!candle[0] || !candle[1] || !candle[2] || !candle[3] || !candle[4]) {
            return null;
          }
          
          const timestamp = parseInt(String(candle[0]));
          if (isNaN(timestamp) || timestamp <= 0) {
            return null;
          }
          
          // 各値を個別に変換
          const parsedOpen = parseFloat(String(candle[1]).trim());
          const parsedHigh = parseFloat(String(candle[2]).trim());
          const parsedLow = parseFloat(String(candle[3]).trim());
          const parsedClose = parseFloat(String(candle[4]).trim());
          const parsedVolume = parseFloat(String(candle[5] || candle[6] || '0').trim());
          
          // 値が同一の場合（APIの問題）、微小な差を付ける
          let adjustedHigh = parsedHigh;
          let adjustedLow = parsedLow;
          
          if (parsedOpen === parsedHigh && parsedHigh === parsedLow && parsedLow === parsedClose) {
            // すべての値が同じ場合、人工的に高値と安値を調整
            const variation = parsedOpen * 0.0005; // 0.05%の変動
            adjustedHigh = parsedOpen + variation;
            adjustedLow = Math.max(parsedOpen - variation, 0); // 0未満にならないように
          }
          
          result = {
            time: timestamp, // lightweight-chartsの要件に合わせてtimeとして設定
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
          
          const timestamp = parseInt(String(candle.timestamp || candle.ts || candle.time || Date.now()));
          if (isNaN(timestamp) || timestamp <= 0) {
            return null;
          }
          
          result = {
            time: timestamp, // lightweight-chartsの要件に合わせてtimeとして設定
            open: parseFloat(String(candle.open)),
            high: parseFloat(String(candle.high)),
            low: parseFloat(String(candle.low)),
            close: parseFloat(String(candle.close)),
            volume: parseFloat(String(candle.volume || candle.vol || '0'))
          };
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
