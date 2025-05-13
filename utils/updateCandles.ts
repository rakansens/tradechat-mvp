import type { Candle } from "@/utils/normalizeCandles";

/**
 * WebSocket等から受信した新しいロウソク足データを既存配列に追加・更新するためのユーティリティ
 * - 同一時刻のデータは上書き更新
 * - 新しいデータは追加
 * - 古いデータ（配列末尾より古いタイムスタンプ）は無視
 */
export function upsertCandle(list: Candle[], incoming: Candle): Candle[] {
  // 必ずDateオブジェクトであることを保証
  const incomingTime = incoming.time instanceof Date 
    ? incoming.time 
    : new Date(incoming.time);
  
  // Dateオブジェクトを使って確実に比較
  const t = incomingTime.getTime();
  
  // 空配列の場合は単純に新しい要素を返す
  if (!list || list.length === 0) return [{ ...incoming, time: incomingTime }];
  
  const last = list[list.length - 1];
  
  // 最後の要素のtimeをDateオブジェクトとして扱う
  const lastTime = last.time instanceof Date
    ? last.time
    : new Date(last.time);
    
  const lastT = lastTime.getTime();

  if (t === lastT) {
    // 同一足を上書き
    const result = [...list];
    result[result.length - 1] = { ...incoming, time: incomingTime };
    return result;
  }

  if (t > lastT) {
    // 新足を追加
    return [...list, { ...incoming, time: incomingTime }];
  }

  // 古いデータは無視（履歴は REST が担保）
  console.debug('Ignoring older candle:', incoming);
  return [...list];
} 