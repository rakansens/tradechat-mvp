/**
 * チャート用のロウソク足データを表す型
 */
export type Candle = {
  time: Date | number | string; // 日時（Date, Unix timestamp in ms, ISOString）
  open: number;   // 始値
  high: number;   // 高値
  low: number;    // 安値
  close: number;  // 終値
  volume: number; // 出来高
};

/**
 * 受信したロウソク足データを正規化し、重複を排除、昇順にソートする
 * REST API経由で取得した履歴データの前処理に使用
 */
export function normalizeCandles(candles: Candle[]): Candle[] {
  if (!candles || candles.length === 0) return [];

  // 時間でユニークにするためのMap
  const uniqueMap = new Map<number, Candle>();

  // すべてのキャンドルを処理
  candles.forEach(candle => {
    // 時間を常にDateオブジェクトとして処理し、ミリ秒単位のタイムスタンプに変換
    const time = candle.time instanceof Date 
      ? candle.time 
      : new Date(typeof candle.time === 'string' ? candle.time : Number(candle.time));
    
    const timestamp = time.getTime();
    
    // 重複があれば上書き（最後に受信したデータが優先）
    uniqueMap.set(timestamp, { 
      ...candle,
      time, // Dateオブジェクトで統一
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume || 0),
    });
  });

  // タイムスタンプでソートし、キャンドル配列を返す
  return Array.from(uniqueMap.values())
    .sort((a, b) => {
      const aTime = a.time instanceof Date ? a.time.getTime() : Number(a.time);
      const bTime = b.time instanceof Date ? b.time.getTime() : Number(b.time);
      return aTime - bTime;
    });
} 