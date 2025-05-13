/**
 * utils/chart/transformers.ts
 * チャートデータの変換・整形に関するユーティリティ関数
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 */

import { OHLCData } from "@/types/chart";
import { logger } from '@/utils/logger';

/**
 * HSL CSS変数の文字列をRGBA形式に変換
 * クライアントサイドでのみ動作
 */
export const hslCssVarToRgba = (hslVarValue: string, fallbackColor: string): string => {
  if (typeof document === 'undefined' || !hslVarValue) {
    return fallbackColor; // Return fallback if not in browser or value is empty
  }
  try {
    const el = document.createElement('div');
    // IMPORTANT: Set style directly to hsl() format CSS expects
    el.style.color = `hsl(${hslVarValue})`;
    document.body.appendChild(el); // Needs to be in the DOM to compute style
    const rgbaColor = window.getComputedStyle(el).color;
    document.body.removeChild(el);

    // lightweight-charts accepts rgb/rgba strings
    if (rgbaColor && rgbaColor.startsWith('rgb')) {
      return rgbaColor;
    }
    logger.warn(`Failed to convert HSL value 'hsl(${hslVarValue})' to RGBA/RGB. Computed value: ${rgbaColor}. Using fallback: ${fallbackColor}`, {
      component: 'chartUtils',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor;
  } catch (error) {
    logger.error(`Error converting HSL value 'hsl(${hslVarValue})'`, error, {
      component: 'chartUtils',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor; // Return fallback on error
  }
};

/**
 * 時間値を正規化する関数
 * 無効な時間値を処理し、一貫した数値形式に変換
 */
export function normalizeTimeValue(time: any): number {
  if (time === undefined || time === null) {
    logger.warn('時間値が未定義です。現在時刻を使用します', {
      component: 'chartUtils',
      action: 'normalizeTimeValue',
      data: { time: undefined }
    });
    return Date.now(); // 現在時刻をデフォルト値として使用
  }

  // 数値でない場合は変換を試みる
  if (typeof time !== 'number') {
    try {
      // 日付文字列の場合はDateオブジェクトに変換
      if (typeof time === 'string') {
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
      
      // その他の場合は数値に変換を試みる
      const numericTime = Number(time);
      if (!isNaN(numericTime) && numericTime > 0) {
        return numericTime;
      }
      
      // 数値変換に成功したが不正な値（0以下）の場合
      if (!isNaN(numericTime) && numericTime <= 0) {
        logger.warn('不正な時間値が検出されました。現在時刻を使用します', {
          component: 'chartUtils',
          action: 'normalizeTimeValue',
          time
        });
        return Date.now();
      }
    } catch (error) {
      logger.error('時間値の変換に失敗しました', {
        component: 'chartUtils',
        action: 'normalizeTimeValue',
        time,
        error
      });
    }
    
    // 変換に失敗した場合は現在時刻を使用
    return Date.now();
  }
  
  // 数値だが不正な値（0以下）の場合
  if (time <= 0) {
    logger.warn('不正な時間値が検出されました。現在時刻を使用します', {
      component: 'chartUtils',
      action: 'normalizeTimeValue',
      time
    });
    return Date.now();
  }
  
  // すでに数値の場合はそのまま返す
  return time;
}

/**
 * ミリ秒単位の時間値を確保する関数
 * Unix秒の場合はミリ秒に変換
 */
export function ensureMilliseconds(time: number): number {
  // タイムスタンプが未定義または無効な場合
  if (time === undefined || time === null || isNaN(time) || time <= 0) {
    logger.warn('タイムスタンプが未定義または無効です', {
      component: 'chartUtils',
      action: 'ensureMilliseconds',
      time
    });
    return Date.now(); // 現在時刻を返す
  }
  
  // Unix秒の場合（桁数が少ない場合）はミリ秒に変換
  if (time < 10000000000) {
    return time * 1000;
  }
  return time;
}

/**
 * 重複する時間のデータを除去する関数
 * 時間値を正規化し、同一時間のデータは最新のもので上書き
 */
export function removeDuplicateTimeEntries(data: OHLCData[]): OHLCData[] {
  // 無効なデータを除外
  const validData = data.filter(item => {
    if (item == null || typeof item !== 'object') return false;
    
    // 時間値を標準化
    item.time = normalizeTimeValue(item.time);
    
    // ミリ秒単位であることを確保
    item.time = ensureMilliseconds(item.time);
    
    return true;
  });

  const timeMap = new Map<number, OHLCData>();
  
  // 各データポイントを時間でマップに格納（後のデータで上書き）
  validData.forEach(item => {
    timeMap.set(item.time, item);
  });
  
  // マップの値を配列に変換して返す
  return Array.from(timeMap.values());
}

/**
 * ResizeObserver用のdebounce関数
 * 連続して発生するイベントを間引く
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
} 