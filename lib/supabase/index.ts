/**
 * Supabase関連モジュールのインデックスファイル
 * 作成日: 2025/6/5 - 初期実装
 * 更新日: 2025/6/5 - 重複エクスポートを解消
 * 更新日: 2025/6/5 - 選択的エクスポートに変更して名前衝突を防止
 * 更新日: 2025/6/20 - SSRクライアントを統合
 * 更新日: 2025/6/21 - チャット機能と会話機能を移行
 * 更新日: 2025/6/21 - 重複エクスポートを解決
 * 更新日: 2025/6/21 - エントリー機能を移行
 * 更新日: 2025/6/21 - 残りのモジュールをすべて移行
 * 更新日: 2025/6/22 - 未参照の古いモジュールを削除（profile, api, backtest, cache）
 * 更新日: 2025/6/22 - チャット関連の直接エクスポートを削除
 * 更新日: 2025/6/22 - 会話関連の参照を更新
 * 更新日: 2025/6/22 - 認証モジュールの参照を一部更新
 */

// SSRクライアント
export { createClient } from './client';
export { createClient as createServerClient } from './server';
export { createMiddlewareClient } from './middlewareClient';
export { createRouteHandlerClient } from './routeHandlerClient';

// 従来のsupabaseクライアント（後方互換用）
// @deprecated 新しいcreateClient()を使用してください
export { supabase } from './supabase';

// 機能モジュール - 新しいSSR対応モジュール
export * from './features';

// 従来の機能モジュール - すべて移行済み
// 以下のモジュールは削除済み:
// - supabase-profile.ts -> features/profile.ts に移行完了
// - supabase-api.ts -> features/api.ts に移行完了
// - supabase-backtest.ts -> features/backtest.ts に移行完了
// - supabase-cache.ts -> features/cache.ts に移行完了
// - supabase-chat.ts -> features/chat.ts に移行完了（インデックスファイルからの参照も削除）
// - supabase-conversations.ts -> features/conversations.ts に移行完了

// 以下のモジュールは移行済みだが参照が残っているため、まだ削除できません
// @deprecated 認証関連の機能は features/auth.ts に移行済み
// Auth module is now exported from features/auth

// @deprecated エントリー関連の機能は features/entry.ts に移行しました
// Entry module is now exported from features/entry

// @deprecated メモリ関連の機能は features/memory.ts に移行しました
// Memory module is now exported from features/memory

// @deprecated ユーザー関係関連の機能は features/relations.ts に移行しました
// Relations module is now exported from features/relations

// @deprecated 設定関連の機能は features/settings.ts に移行しました
// Settings module is now exported from features/settings 