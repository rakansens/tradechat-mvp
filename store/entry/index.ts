// store/entry/index.ts
// エントリーストアのエントリーポイント
// 更新: 2025/6/1 - リアルタイム購読ミドルウェアを追加
// 更新: T-7.5フェーズ - userIdフィールドをエントリー型に追加

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createEntryActions } from './actions'
import { EntrySliceState, initialEntryState } from './state'
import { subscribeToEntries } from '@/lib/supabase/features/entry'
import { Tables } from '@/types/network/supabase'
import { Entry as FrontendEntry, OpenEntry, ClosedEntry, CanceledEntry } from '@/types/entry'

// アクションの型をインポート
import type { EntrySliceActions } from './actions';

// SupabaseのEntry型
type SupabaseEntry = Tables<'entries'>;

// Supabaseエントリー型からフロントエンド型への変換
const convertToFrontendEntry = (dbEntry: SupabaseEntry): FrontendEntry => {
  // 基本のエントリーデータ
  const baseEntry = {
    id: dbEntry.id,
    userId: dbEntry.user_id,  // userIdフィールドを追加
    side: dbEntry.side as 'buy' | 'sell',
    symbol: dbEntry.symbol,
    price: dbEntry.price,
    time: dbEntry.time,
    takeProfit: dbEntry.take_profit || undefined,
    stopLoss: dbEntry.stop_loss || undefined,
  };

  // ステータスに基づいて適切な型に変換
  if (dbEntry.status === 'closed' && dbEntry.exit_price !== null && dbEntry.exit_time !== null) {
    const closedEntry: ClosedEntry = {
      ...baseEntry,
      status: 'closed',
      exitPrice: dbEntry.exit_price,
      exitTime: dbEntry.exit_time,
      profit: dbEntry.profit || 0,
    };
    return closedEntry;
  } else if (dbEntry.status === 'canceled') {
    const canceledEntry: CanceledEntry = {
      ...baseEntry,
      status: 'canceled',
    };
    return canceledEntry;
  } else {
    // デフォルトはオープン状態として扱う
    const openEntry: OpenEntry = {
      ...baseEntry,
      status: 'open',
    };
    return openEntry;
  }
};

// リアルタイム購読ミドルウェア
const subscribeMiddleware = (config: any) => (set: any, get: any, api: any) => {
  let unsubscribe: (() => void) | null = null;
  
  // ストアが作成された時に自動的に購読を開始
  const newApi = {
    ...api,
    // ストアのリセット時にリアルタイム購読も解除する
    reset: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      api.reset();
    },
    // マウント時に呼び出されるメソッド
    subscribe: () => {
      // 既に購読中の場合は何もしない
      if (unsubscribe) return;
      
      // リアルタイム購読を開始
      unsubscribe = subscribeToEntries((supabaseEntry) => {
        const state = get() as EntrySliceState;
        const { entries } = state;
        
        // payloadがnullの場合（削除イベント）は対応しない
        if (!supabaseEntry) return;
        
        // イベントのタイプを識別
        // Supabase側でレコードが削除されると、ここは呼ばれないため実際には処理不要
        // 代わりに、削除は専用のAPIコールによって処理される
        
        // エントリーをフロントエンド型に変換
        const convertedEntry = convertToFrontendEntry(supabaseEntry);
        const existingEntryIndex = entries.findIndex(entry => entry.id === supabaseEntry.id);
        
        if (existingEntryIndex >= 0) {
          // 既存のエントリーを更新
          set((state: EntrySliceState) => {
            state.entries[existingEntryIndex] = convertedEntry;
          });
        } else {
          // 新しいエントリーを追加
          set((state: EntrySliceState) => {
            state.entries = [convertedEntry, ...state.entries];
          });
        }
      });
      
      // 初期データを取得
      const actionMethods = get() as ReturnType<typeof createEntryActions>;
      actionMethods.fetchUserEntries();
      
      return unsubscribe;
    },
    // アンマウント時に呼び出されるメソッド
    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  };
  
  const store = config(set, get, newApi);
  return store;
};

// エントリーストア作成
export const useEntryStore = create<EntrySlice>()(
  subscribeMiddleware(
    immer((set, get, api) => ({
      ...initialEntryState,
      ...createEntryActions(set as SetState, get as GetState),
    }))
  )
);

// エントリースライスの完全な型
type EntrySlice = EntrySliceState & EntrySliceActions

// エントリースライスの作成関数
type SetState = (fn: (state: EntrySliceState) => void) => void
type GetState = () => EntrySliceState

export const createEntrySlice = (
  set: SetState,
  get: GetState
): EntrySlice => {
  const actions = createEntryActions(set, get);
  return {
    ...initialEntryState,
    ...actions
  };
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 