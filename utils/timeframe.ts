/**
 * utils/timeframe.ts
 * タイムフレーム変換ユーティリティ
 */

/**
 * 標準タイムフレーム形式とBitgetタイムフレーム形式の対応マップ
 */
const TIMEFRAME_MAP: Record<string, string> = {
  // 標準形式 => Bitget形式
  '1m': '1min',
  '3m': '3min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '12h': '12h',
  '1d': '1day',
  '3d': '3day',
  '1w': '1week',
  '1M': '1month'
};

/**
 * Bitgetタイムフレーム形式と標準タイムフレーム形式の対応マップ
 */
const REVERSE_TIMEFRAME_MAP: Record<string, string> = Object.entries(TIMEFRAME_MAP).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * 標準タイムフレーム形式をBitget形式に変換
 * 
 * @param timeframe 標準形式のタイムフレーム ('1m', '1h', '1d'など)
 * @returns Bitget形式のタイムフレーム、未定義の場合はデフォルト値'1day'
 */
export function toBitget(timeframe: string): string {
  return TIMEFRAME_MAP[timeframe] || '1day';
}

/**
 * Bitget形式のタイムフレームを標準形式に変換
 * 
 * @param bitgetTimeframe Bitget形式のタイムフレーム ('1min', '1h', '1day'など)
 * @returns 標準形式のタイムフレーム、未定義の場合はデフォルト値'1d'
 */
export function fromBitget(bitgetTimeframe: string): string {
  return REVERSE_TIMEFRAME_MAP[bitgetTimeframe] || '1d';
}

export default {
  toBitget,
  fromBitget
}; 