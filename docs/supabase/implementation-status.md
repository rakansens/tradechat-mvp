# Supabaseデータアクセスレイヤー実装状況

## 概要

このドキュメントでは、Supabaseデータアクセスレイヤーと各フロントエンド機能の連携状態を詳細に記録します。各機能領域ごとに実装状況、連携状況、今後の課題を記載しています。

## 実装進捗トラッカー

### エントリー機能連携
- [x] ストアアクションのAPI連携実装
  - [x] getUserEntriesアクション追加
  - [x] createEntryアクション更新
  - [x] closePositionアクション更新
  - [x] cancelPositionアクション更新
- [x] リアルタイム購読機能実装
  - [x] subscribeToEntriesストア実装
  - [x] リアルタイム更新時の状態管理
- [x] 追加APIエンドポイント実装
  - [x] PATCH /api/entries/:idエンドポイント
  - [x] DELETE /api/entries/:idエンドポイント

### メモリ機能強化
- [x] OpenAI API連携
  - [x] 環境変数設定
  - [x] embedding生成関数実装
- [x] チャットUIへのメモリ統合
  - [x] メモリパネルコンポーネント強化
  - [x] チャットUI内でのメモリ検索機能
  - [x] メモリ保存機能

### チャット機能改善
- [x] リアルタイム更新安定化
  - [x] エラーハンドリング強化
  - [x] 再接続機能
  - [x] 状態管理の改善
- [x] システムプロンプト管理
  - [x] UIの改善（SystemPromptEditorコンポーネント）
  - [x] 保存機能の最適化

### 設定機能連携
- [x] APIエンドポイント実装
  - [x] GET /api/settings - 設定取得
  - [x] PATCH /api/settings - 設定更新
  - [x] POST /api/settings - 設定作成
- [x] ストア連携実装
  - [x] SettingsStoreの作成
  - [x] CRUD操作の実装
  - [x] エラーハンドリングの強化

## エントリー機能 (`supabase-entry.ts`)

### データベース構造
- **テーブル**: `entries`
- **主要フィールド**: id, user_id, side, symbol, price, time, status, take_profit, stop_loss, exit_price, exit_time, profit
- **関連マイグレーション**: `01_tables.sql`

### データアクセスレイヤーの実装状況
- **完了した機能**:
  - エントリー一覧取得 (`getEntries`, `getUserEntries`)
  - シンボル/ステータス別検索 (`getEntriesBySymbol`, `getEntriesByStatus`)
  - エントリー作成 (`createEntry`)
  - エントリー更新/削除 (`updateEntry`, `deleteEntry`)
  - エントリークローズ/キャンセル (`closeEntry`, `cancelPosition`)
  - リアルタイム購読 (`subscribeToEntries`)

### フロントエンド連携状況
- **APIエンドポイント**: `app/api/entries/route.ts`, `app/api/entries/[id]/route.ts`
- **ストア**: `store/entry/*`
- **実装状況**:
  - ✅ APIエンドポイント実装済み (GET/POST/PATCH/DELETE)
  - ✅ ストアアクションとAPIエンドポイントの連携実装済み
  - ✅ リアルタイム購読機能実装済み
  - ⚠️ 残課題: ストアの型エラーの解決

### 今後の課題
- 型エラーの解決
- コンポーネントとの連携テスト
- エラーハンドリングの強化

## メモリ機能 (`supabase-memory.ts`)

### データベース構造
- **テーブル**: `memories`
- **主要フィールド**: id, user_id, content, embedding, metadata, external_id, is_synced
- **関連マイグレーション**: `10_memories.sql`, `11_vector_function.sql`

### データアクセスレイヤーの実装状況
- **完了した機能**:
  - メモリの作成/更新/削除 (`createMemory`, `updateMemory`, `deleteMemory`)
  - テキスト検索 (`searchMemoriesByText`)
  - ベクトル類似度検索 (`searchMemoriesBySimilarity`)
  - Mem0 APIとの連携 (`getMemoryByExternalId`, `updateSyncStatus`, `getUnsyncedMemories`)
  - OpenAI APIによるembedding生成

### フロントエンド連携状況
- **APIエンドポイント**: 
  - `app/api/memories/route.ts` - 基本的なCRUD操作
  - `app/api/memories/similarity/route.ts` - ベクトル類似度検索
- **コンポーネント**: 
  - `components/chat/ui/MemoryPanel.tsx` - メモリ管理UI
  - `components/chat/ui/MemoryToggle.tsx` - メモリトグルボタン
- **実装状況**:
  - ✅ メモリ管理UIは既存コンポーネントを強化
  - ✅ APIエンドポイントとの連携が実装済み
  - ✅ ベクトル検索機能が実装済み（OpenAI embedding）
  - ✅ チャットコンテキストとの連携機能実装済み
  - ✅ チャットコンテキストのメモリ保存機能追加

### 今後の課題
- メモリ検索結果の精度改善
- 会話履歴とメモリの統合強化
- 複数モダリティ対応（画像など）
- パフォーマンスの最適化（大量データ時）

## チャット機能 (`supabase-chat.ts` & `supabase-conversations.ts`)

### データベース構造
- **テーブル**: `chat_messages`, `chat_images`, `conversations`
- **主要フィールド**: id, user_id, role, content, is_proposal, conversation_id
- **関連マイグレーション**: `01_tables.sql`, `05_conversations.sql`

### データアクセスレイヤーの実装状況
- **完了した機能**:
  - チャットメッセージ取得/作成/更新/削除
  - 会話管理 (作成/取得/更新/削除)
  - 画像アップロード
  - リアルタイム購読（再接続機能付き）

### フロントエンド連携状況
- **APIエンドポイント**: `app/api/messages/`, `app/api/conversations/`
- **ストア**: `store/chat/*`
- **実装状況**:
  - ✅ チャットストアのアクションは実装済み
  - ✅ MASTRAとの連携が実装済み
  - ✅ リアルタイム購読の安定化と再接続機能を実装（エラーハンドリング、再試行機能）
  - ✅ SystemPromptEditorコンポーネントの実装
  - ⚠️ 残課題: 型の互換性問題

### 今後の課題
- 型エラーの解決
- 接続状態のUI表示の改善
- エラー発生時のユーザーアクション提案

## 設定機能 (`supabase-settings.ts`)

### データベース構造
- **テーブル**: `symbol_settings`, `chart_settings`, `indicator_settings`, `users`(settings)
- **関連マイグレーション**: `01_tables.sql`

### データアクセスレイヤーの実装状況
- **完了した機能**:
  - シンボル設定の取得/作成/更新/削除
  - チャート設定の取得/作成/更新/削除
  - インジケーター設定の取得/作成/更新/削除
  - ユーザー設定の取得/更新

### フロントエンド連携状況
- **APIエンドポイント**: `app/api/settings/route.ts`
- **ストア**: `store/settings/index.ts`
- **実装状況**:
  - ✅ APIエンドポイント実装済み (GET/POST/PATCH)
  - ✅ 設定ストアの実装
  - ✅ CRUD操作のサポート
  - ✅ エラーハンドリングと通知機能
  - ⚠️ 残課題: 型エラーの解決

### 今後の課題
- 設定UIの改善
- プリセット機能の追加
- 設定の同期機能

## ユーザー関係機能 (`supabase-relations.ts`)

### データベース構造
- **テーブル**: `user_relations`, `profiles`
- **主要フィールド**: id, follower_id, following_id
- **関連マイグレーション**: `01_tables.sql`

### データアクセスレイヤーの実装状況
- **完了した機能**:
  - フォロー/アンフォロー操作
  - フォロー/フォロワー一覧取得
  - フォロー/フォロワー数取得
  - 相互フォロー一覧取得
  - リアルタイム購読

### フロントエンド連携状況
- **APIエンドポイント**: 未実装
- **実装状況**:
  - ❌ APIエンドポイントの実装が必要
  - ❌ フロントエンドでの使用状況も確認が必要

### 今後の課題
- APIエンドポイントの実装
- ユーザープロフィールUIへの統合
- リアルタイム更新機能の実装

## 共通課題と今後の方針

### 技術的課題
1. **型安全性の強化**
   - `any` や `unknown` 型の削減
   - 一貫した型定義の使用

2. **エラーハンドリング**
   - エラー通知UIの標準化
   - オフライン時の動作改善

3. **パフォーマンス最適化**
   - クエリパフォーマンスの測定と改善
   - キャッシュ戦略の最適化

### 次のアクション
1. **現在進行中**
   - ✅ チャット機能のリアルタイム更新安定化
   - ✅ 設定機能のAPIエンドポイントとストア連携実装
   - ⏳ 型エラーの解決と改善

2. **次のフェーズ**
   - ユーザー関係機能の連携実装
   - テスト強化（単体テスト、E2Eテスト）
   - ドキュメント整備 