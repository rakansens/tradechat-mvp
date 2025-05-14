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
- [ ] リアルタイム更新安定化
  - [ ] エラーハンドリング強化
  - [ ] 再接続機能
- [ ] システムプロンプト管理
  - [ ] UIの改善
  - [ ] 保存機能の最適化

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
- **ページ**: `app/memories/page.tsx`
- **実装状況**:
  - ✅ メモリ管理UIは既存コンポーネントを強化
  - ✅ APIエンドポイントとの連携が実装済み
  - ✅ ベクトル検索機能が実装済み（OpenAI embedding）
  - ✅ チャットコンテキストとの連携機能実装済み
  - ✅ チャットコンテキストのメモリ保存機能追加

### 主要な機能改善
1. **OpenAI API 連携**:
   - OpenAI API クライアントユーティリティの作成 (`lib/openai/index.ts`)
   - テキストからembeddingを生成する機能
   - コサイン類似度計算関数
   
2. **ベクトル検索の強化**:
   - `match_memories` RPC関数を使用したベクトル類似度検索
   - ベクトル検索用の専用APIエンドポイント (`app/api/memories/similarity/route.ts`)
   - エラー時のテキスト検索へのフォールバック機能
   
3. **チャットコンテキスト統合**:
   - 現在の会話コンテキストを抽出する機能
   - コンテキストに基づく関連メモリの自動検索
   - チャットコンテキストをメモリとして保存する機能

### 今後の課題
- メモリ検索結果の精度改善
- 会話履歴とメモリの統合強化
- 複数モダリティ対応（画像など）
- パフォーマンスの最適化（大量データ時）
- プライバシー設定の実装

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
  - リアルタイム購読

### フロントエンド連携状況
- **APIエンドポイント**: `app/api/messages/`, `app/api/conversations/`
- **ストア**: `store/chat/*`
- **実装状況**:
  - チャットストアのアクションは実装済み
  - MASTRAとの連携が実装済み
  - リアルタイム購読機能が部分的に実装

### 今後の課題
- リアルタイム更新の安定性強化
- システムプロンプトの保存と使用の最適化
- 画像処理の拡張

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
- **APIエンドポイント**: `app/api/settings/`
- **実装状況**:
  - APIエンドポイントの詳細実装状況は不明
  - ストアとの連携状況も確認が必要

### 今後の課題
- APIエンドポイントの完全実装
- ストア連携の実装または改善
- 設定UIの改善

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
- **APIエンドポイント**: `app/api/social/`
- **実装状況**:
  - APIエンドポイントの詳細実装状況は不明
  - フロントエンドでの使用状況も確認が必要

### 今後の課題
- APIエンドポイントの完全実装
- ユーザープロフィールUIへの統合
- リアルタイム更新機能の実装

## 共通課題と今後の方針

### 技術的課題
1. **型安全性の強化**
   - `any` や `unknown` 型の削減
   - 一貫した型定義の使用

2. **エラーハンドリング**
   - 一貫したエラー処理パターンの確立
   - フロントエンドへのエラー表示の改善

3. **パフォーマンス最適化**
   - クエリパフォーマンスの測定と改善
   - キャッシュ戦略の最適化

### 次のアクション
1. **エントリー機能の完全な連携実装**
   - ✅ ストアアクションとAPIエンドポイントの連携 
   - ✅ リアルタイム更新機能の組み込み
   - ⏳ 型エラーの解決と実際の動作確認

2. **メモリ機能の強化**
   - ✅ OpenAI APIによるembedding生成機能の実装
   - ✅ チャットUIへの統合

3. **チャット機能のさらなる改善**
   - ⏳ Mem0メモリとの統合
   - ⏳ リアルタイム更新の安定性強化

4. **テスト強化**
   - ⏳ ユニットテストの追加
   - ⏳ E2Eテストの追加 