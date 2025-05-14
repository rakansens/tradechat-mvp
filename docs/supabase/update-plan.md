# Supabase連携更新計画と進捗管理

## 概要

このドキュメントは、既存のSupabaseデータアクセス層を最新の型定義とスキーマに合わせて更新し、フロントエンドと効果的に連携させるための計画と進捗を管理します。

## プロジェクト情報

- **作業ブランチ**: `feature/supabase`
- **開始日**: 2025年5月14日
- **目標完了日**: 2025年5月31日
- **担当者**: Claude

## 実装アプローチ

1. **機能領域ごとに集中的に実装**：各Supabaseモジュールは特定の機能領域に対応しているため、一つの機能領域ごとに完全に連携させる
2. **依存関係の整理**：基本的なモジュールから始め、それに依存する他のモジュールへと進む
3. **調査→実装→テスト**のサイクルを各機能領域で繰り返す

## 更新計画と進捗状況

### フェーズ1: 基盤コンポーネントの更新（完了）

| タスク | 優先度 | 状態 | 完了日 | 備考 |
|-------|------|------|------|------|
| 型定義ファイル `types/network/supabase.ts` の更新 | 高 | ✅完了 | 2025/5/14 | 最新のSupabaseスキーマから生成 |
| `supabase.ts` - クライアント初期化の更新 | 高 | ✅完了 | 2025/5/14 | 型参照を`@/types/network/supabase`に変更 |
| `supabase-auth.ts` - 認証関連機能の更新 | 高 | ✅完了 | 2025/5/14 | 型参照とプロフィール操作関数を更新 |

### フェーズ2: データアクセス層の更新（完了）

| タスク | 優先度 | 状態 | 完了日 | 備考 |
|-------|------|------|------|------|
| `supabase-entry.ts` - エントリー機能の更新 | 中 | ✅完了 | 2025/5/14 | 型参照を更新し、より型安全に修正 |
| `supabase-chat.ts` - チャット機能の更新 | 中 | ✅完了 | 2025/5/14 | 型参照を更新し、戻り値型を明確化 |
| `supabase-settings.ts` - 設定機能の更新 | 中 | ✅完了 | 2025/5/14 | 型参照とJSON型を修正 |

### フェーズ3: ソーシャル・キャッシュ機能の更新（完了）

| タスク | 優先度 | 状態 | 完了日 | 備考 |
|-------|------|------|------|------|
| `supabase-relations.ts` - ソーシャル機能の更新 | 低 | ✅完了 | 2025/5/31 | 型参照更新と型安全性強化 |
| `supabase-cache.ts` - キャッシュ機能の更新 | 低 | ✅完了 | 2025/5/31 | 型参照更新とJson型対応 |
| `supabase-api.ts` - API連携機能の更新 | 低 | ✅完了 | 2025/5/31 | インポート修正 |
| `supabase-backtest.ts` - バックテスト機能の更新 | 低 | ✅完了 | 2025/5/31 | 型参照を更新 |
| `supabase-memory.ts` - メモリ管理機能の追加 | 高 | ✅完了 | 2025/5/31 | Mem0APIとSupabase連携機能 |

### フェーズ4: 統合とテスト（進行中）

| タスク | 優先度 | 状態 | 完了日 | 備考 |
|-------|------|------|------|------|
| マイグレーションファイル追加 | 高 | ✅完了 | 2025/5/31 | memoriesテーブルとvector関数追加 |
| Mem0統合実装 | 高 | ✅完了 | 2025/5/31 | SupabaseMem0Integrationクラス |
| APIエンドポイント追加 | 中 | ✅完了 | 2025/5/31 | メモリAPI実装 |
| フロントエンドUI実装 | 高 | ✅完了 | 2025/5/31 | メモリ管理UIコンポーネント追加 |
| ユニットテスト追加 | 中 | ✅完了 | 2025/5/31 | モック使用のテスト実装 |
| E2Eテスト追加 | 低 | ✅完了 | 2025/5/31 | Playwright使用のテスト実装 |
| フロントエンド連携確認 | 高 | ⏳進行中 | - | 実際のアプリケーションでの動作確認 |
| メモリ検索最適化 | 低 | 🔜予定 | - | パフォーマンス改善 |

### フェーズ5: フロントエンド連携の強化（新規）

| タスク | 優先度 | 状態 | 予定日 | 備考 |
|-------|------|------|------|------|
| **エントリー機能連携** | 高 | 🔜予定 | 2025/6/1 | |
| コンポーネント調査 | 高 | 🔜予定 | 2025/6/1 | `app/trade/page.tsx`, `components/entry/*` |
| データフロー設計 | 高 | 🔜予定 | 2025/6/1 | Zustandストア連携 |
| 状態管理実装 | 高 | 🔜予定 | 2025/6/2 | エントリー作成・更新・取得 |
| UIコンポーネント連携 | 高 | 🔜予定 | 2025/6/2 | フォームとリスト表示 |
| テストとデバッグ | 高 | 🔜予定 | 2025/6/3 | エラーハンドリング強化 |
| **チャット機能連携** | 中 | 🔜予定 | 2025/6/4 | |
| コンポーネント調査 | 中 | 🔜予定 | 2025/6/4 | `components/chat/*`, `app/chat/page.tsx` |
| データフロー設計 | 中 | 🔜予定 | 2025/6/4 | リアルタイム購読設計 |
| 状態管理実装 | 中 | 🔜予定 | 2025/6/5 | メッセージ送受信 |
| UIコンポーネント連携 | 中 | 🔜予定 | 2025/6/5 | チャット表示と入力 |
| テストとデバッグ | 中 | 🔜予定 | 2025/6/6 | 購読エラー対応 |
| **メモリ機能連携** | 高 | 🔜予定 | 2025/6/7 | |
| コンポーネント調査 | 高 | 🔜予定 | 2025/6/7 | `components/memory/*`, `app/memories/page.tsx` |
| データフロー設計 | 高 | 🔜予定 | 2025/6/7 | Mem0 APIとの連携 |
| 状態管理実装 | 高 | 🔜予定 | 2025/6/8 | メモリ作成・検索・削除 |
| UIコンポーネント連携 | 高 | 🔜予定 | 2025/6/8 | メモリ表示と操作 |
| テストとデバッグ | 高 | 🔜予定 | 2025/6/9 | ベクトル検索テスト |
| **設定機能連携** | 中 | 🔜予定 | 2025/6/10 | |
| コンポーネント調査 | 中 | 🔜予定 | 2025/6/10 | `components/settings/*`, `app/settings/page.tsx` |
| データフロー設計 | 中 | 🔜予定 | 2025/6/10 | ユーザー設定管理 |
| 状態管理実装 | 中 | 🔜予定 | 2025/6/11 | 設定保存と読み込み |
| UIコンポーネント連携 | 中 | 🔜予定 | 2025/6/11 | 設定フォーム |
| テストとデバッグ | 中 | 🔜予定 | 2025/6/12 | 設定反映確認 |
| **ユーザー関係連携** | 低 | 🔜予定 | 2025/6/13 | |
| コンポーネント調査 | 低 | 🔜予定 | 2025/6/13 | `components/profile/*`, `app/profile/page.tsx` |
| データフロー設計 | 低 | 🔜予定 | 2025/6/13 | フォロー関係管理 |
| 状態管理実装 | 低 | 🔜予定 | 2025/6/14 | フォロー・フォロワー処理 |
| UIコンポーネント連携 | 低 | 🔜予定 | 2025/6/14 | ユーザー一覧表示 |
| テストとデバッグ | 低 | 🔜予定 | 2025/6/15 | 相互フォロー機能確認 |

### フェーズ6: 最適化と監視（新規）

| タスク | 優先度 | 状態 | 開始予定日 | 備考 |
|-------|------|------|----------|------|
| パフォーマンス最適化 | 中 | 🔜予定 | 2025/6/16 | クエリパフォーマンス計測と改善 |
| キャッシュ戦略実装 | 中 | 🔜予定 | 2025/6/17 | 頻繁に使われるデータのキャッシュ |
| エラー監視の実装 | 高 | 🔜予定 | 2025/6/18 | Sentry統合とエラー追跡 |
| パフォーマンスモニタリング | 中 | 🔜予定 | 2025/6/19 | 実行時間とリソース使用状況の監視 |
| バッチ処理の最適化 | 低 | 🔜予定 | 2025/6/20 | バックグラウンドジョブ設計 |
| ドキュメント作成 | 高 | 🔜予定 | 2025/6/21 | API利用ガイド |

## 各機能領域の対象コンポーネントとワークフロー

### エントリー機能 (`supabase-entry.ts`)

**対象フロントエンドコンポーネント:**
- `app/trade/page.tsx` - トレードページ
- `components/entry/EntryForm.tsx` - エントリー作成フォーム
- `components/entry/EntryList.tsx` - エントリー一覧表示
- `components/entry/EntryDetail.tsx` - エントリー詳細表示
- `stores/entryStore.ts` - エントリー状態管理

**データフロー:**
1. ユーザーがEntryFormからエントリー情報を入力
2. entryStoreがsupabase-entryのcreateEntry関数を呼び出し
3. Supabaseへデータ保存
4. リアルタイム購読でEntryListに表示を更新

### チャット機能 (`supabase-chat.ts` & `supabase-conversations.ts`)

**対象フロントエンドコンポーネント:**
- `app/chat/page.tsx` - チャットページ
- `components/chat/ChatInput.tsx` - メッセージ入力
- `components/chat/ChatList.tsx` - メッセージ一覧表示
- `components/chat/ConversationList.tsx` - 会話一覧
- `stores/chatStore.ts` - チャット状態管理

**データフロー:**
1. ユーザーがChatInputからメッセージを送信
2. chatStoreがsupabase-chatのcreateChatMessage関数を呼び出し
3. Supabaseへデータ保存
4. リアルタイム購読でChatListに表示を更新

### メモリ機能 (`supabase-memory.ts`)

**対象フロントエンドコンポーネント:**
- `app/memories/page.tsx` - メモリページ
- `components/memory/MemoryManager.tsx` - メモリ管理UI
- `components/memory/MemorySearch.tsx` - メモリ検索
- `components/memory/MemoryList.tsx` - メモリ一覧表示
- `stores/memoryStore.ts` - メモリ状態管理

**データフロー:**
1. ユーザーがMemoryManagerから操作
2. memoryStoreがsupabase-memoryの関数を呼び出し
3. Mem0 APIとSupabaseの両方にデータ保存
4. ベクトル検索を使用した類似メモリ検索

### 設定機能 (`supabase-settings.ts`)

**対象フロントエンドコンポーネント:**
- `app/settings/page.tsx` - 設定ページ
- `components/settings/SymbolSettings.tsx` - シンボル設定
- `components/settings/ChartSettings.tsx` - チャート設定
- `components/settings/UserSettings.tsx` - ユーザー設定
- `stores/settingsStore.ts` - 設定状態管理

**データフロー:**
1. ユーザーが各設定フォームから設定を変更
2. settingsStoreがsupabase-settingsの関数を呼び出し
3. Supabaseへデータ保存
4. アプリケーション全体に設定を反映

### ユーザー関係機能 (`supabase-relations.ts`)

**対象フロントエンドコンポーネント:**
- `app/profile/[userId]/page.tsx` - プロフィールページ
- `components/profile/FollowButton.tsx` - フォローボタン
- `components/profile/FollowerList.tsx` - フォロワー一覧
- `components/profile/FollowingList.tsx` - フォロー中一覧
- `stores/userStore.ts` - ユーザー状態管理

**データフロー:**
1. ユーザーがFollowButtonからフォロー操作
2. userStoreがsupabase-relationsの関数を呼び出し
3. Supabaseへデータ保存
4. リアルタイム購読でフォロー状態を更新

## 今後の課題

- フロントエンドでのエラーハンドリング強化
- リアルタイム購読の最適化
- 大規模データセットでのパフォーマンス改善
- オフライン対応とデータ同期
- サーバーサイドレンダリングとの連携強化

## 実装の詳細

### メモリ関連機能の追加（完了）

#### 作成済みファイル

- `supabase/migrations/10_memories.sql` - メモリ保存用テーブル
- `supabase/migrations/11_vector_function.sql` - ベクトル検索関数
- `lib/supabase/supabase-memory.ts` - メモリ操作ユーティリティ
- `src/mastra/integrations/mem0-supabase.ts` - Mem0/Supabase統合
- `app/api/memories/route.ts` - メモリAPI
- `components/memory/MemoryManager.tsx` - メモリ管理UI
- `components/ui/LoadingSpinner.tsx` - UIコンポーネント
- `components/ui/Empty.tsx` - UIコンポーネント
- `app/memories/page.tsx` - メモリ管理ページ
- `lib/supabase/__tests__/supabase-memory.test.ts` - ユニットテスト
- `tests/e2e/memories.test.ts` - E2Eテスト

#### 次のステップ

1. **フロントエンド連携のレビュー**:
   - 各コンポーネントがデータアクセスレイヤーを適切に使用しているか確認
   - 状態管理との連携が効率的に行われているか検証
   - エラーハンドリングが適切に実装されているか確認

2. **パフォーマンス最適化**:
   - クエリの実行時間とリソース使用状況を測定
   - インデックス最適化やキャッシュ戦略を検討
   - バッチ処理の効率化 