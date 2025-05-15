/**
 * Supabaseのエントリーデータと型変換関連の定義
 * 
 * このファイルはSupabaseから取得したデータをフロントエンドで使用する
 * 型に変換するためのマッピング関数を提供します。
 */

import { Tables } from '@/types/network/supabase';
import { TradeSide, EntryStatus, Entry, OpenEntry, ClosedEntry, CanceledEntry } from './base';

/**
 * Supabaseのエントリー型（データベース形式）
 */
export type SupabaseEntry = Tables<'entries'>;

/**
 * Supabaseのエントリーデータをフロントエンド用の型に変換
 */
export function fromSupabaseEntry(entry: SupabaseEntry): Entry {
  const base = {
    id: entry.id,
    userId: entry.user_id,
    side: entry.side as TradeSide,
    symbol: entry.symbol,
    price: entry.price,
    time: entry.time,
    takeProfit: entry.take_profit || undefined,
    stopLoss: entry.stop_loss || undefined,
    isPublic: entry.is_public || false,
    createdAt: entry.created_at || undefined,
    updatedAt: entry.updated_at || undefined,
    status: entry.status as EntryStatus,
  };

  if (entry.status === 'closed' && entry.exit_price && entry.exit_time) {
    return {
      ...base,
      status: 'closed',
      exitPrice: entry.exit_price,
      exitTime: entry.exit_time,
      profit: entry.profit || 0,
    } as ClosedEntry;
  } else if (entry.status === 'canceled') {
    return {
      ...base,
      status: 'canceled',
    } as CanceledEntry;
  } else {
    return {
      ...base,
      status: 'open',
    } as OpenEntry;
  }
}

/**
 * ユーザーIDプロパティを持つかどうかを型ガードで確認
 */
function hasUserId(entry: any): entry is { userId: string } {
  return entry && typeof entry === 'object' && 'userId' in entry;
}

/**
 * 公開フラグプロパティを持つかどうかを型ガードで確認
 */
function hasIsPublic(entry: any): entry is { isPublic: boolean } {
  return entry && typeof entry === 'object' && 'isPublic' in entry;
}

/**
 * フロントエンド用のエントリーデータをSupabase用の形式に変換
 */
export function toSupabaseEntry(entry: Entry): Partial<SupabaseEntry> {
  const base: Partial<SupabaseEntry> = {
    id: entry.id,
    side: entry.side,
    symbol: entry.symbol,
    price: entry.price,
    time: entry.time,
    take_profit: entry.takeProfit,
    stop_loss: entry.stopLoss,
    status: entry.status,
  };
  
  // オプションフィールドは存在する場合のみ追加
  if (hasUserId(entry)) {
    base.user_id = entry.userId;
  }
  
  if (hasIsPublic(entry)) {
    base.is_public = entry.isPublic;
  }

  if (entry.status === 'closed' && 'exitPrice' in entry && 'exitTime' in entry) {
    const closedEntry = entry as ClosedEntry;
    return {
      ...base,
      exit_price: closedEntry.exitPrice,
      exit_time: closedEntry.exitTime,
      profit: closedEntry.profit,
    };
  }

  return base;
} 