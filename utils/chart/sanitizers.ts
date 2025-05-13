/**
 * utils/chart/sanitizers.ts
 * チャートデータのサニタイズと検証機能
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 */

import { OHLCData } from "@/types/chart";
import { logger } from '@/utils/common';
import { normalizeTimeValue, ensureMilliseconds } from './transformers';

/**
 * データが時間順に並んでいるか検証
 * @param data フォーマット済みのデータ配列
 * @returns データが有効かどうか
 */
export function validateTimeOrder<T extends { time: number }>(data: T[]): boolean {
  if (!data || data.length < 2) return true;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i].time <= data[i-1].time) {
      logger.error('データが時間順になっていません', {
        component: 'chartUtils',
        action: 'validateTimeOrder',
        prevTime: data[i-1].time,
        currentTime: data[i].time,
        index: i
      });
      return false;
    }
  }
  
  return true;
}

/**
 * OHLC データの検証と正規化
 * @param data 生のチャートデータ
 * @returns 検証・正規化されたデータ
 */
export function sanitizeOHLCData(data: OHLCData[]): OHLCData[] {
  if (!data || data.length === 0) return [];
  
  // 無効なデータを除外
  const validData = data.filter(item => {
    // nullやundefinedの項目を除外
    if (item == null || typeof item !== 'object') return false;
    
    // 時間値が有効であることを確認
    if (isNaN(item.time) || item.time <= 0) {
      logger.warn('無効な時間値が見つかりました', {
        component: 'chartUtils',
        action: 'sanitizeOHLCData',
        time: item.time
      });
      return false;
    }
    
    // 価格データが有効であることを確認
    if (isNaN(Number(item.open)) || isNaN(Number(item.high)) || 
        isNaN(Number(item.low)) || isNaN(Number(item.close))) {
      logger.warn('無効な価格データが見つかりました', {
        component: 'chartUtils',
        action: 'sanitizeOHLCData',
        time: item.time,
        data: item
      });
      return false;
    }
    
    return true;
  });
  
  // 時間値を正規化
  return validData.map(item => ({
    ...item,
    time: ensureMilliseconds(normalizeTimeValue(item.time)),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
    volume: item.volume !== undefined ? Number(item.volume) : undefined
  }));
}

/**
 * デフォルトのチャートデータを生成
 * データがない場合や無効なデータしかない場合にダミーデータを生成
 */
export function generateDefaultChartData(): OHLCData[] {
  const now = Date.now();
  const data: OHLCData[] = [];
  
  // 現在から過去24時間分のデータを1時間ごとに生成
  for (let i = 24; i >= 0; i--) {
    const time = now - i * 3600 * 1000; // 1時間 = 3600秒 = 3600000ミリ秒
    const basePrice = 100 + Math.random() * 10; // 基本価格（ランダム要素あり）
    
    data.push({
      time,
      open: basePrice - 2 + Math.random() * 4,
      high: basePrice + 1 + Math.random() * 2,
      low: basePrice - 1 - Math.random() * 2,
      close: basePrice - 2 + Math.random() * 4,
    });
  }
  
  return data;
} 