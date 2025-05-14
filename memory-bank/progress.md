# 進捗状況

## 完了した作業

### フックリファクタリングプロジェクト

- **H-0** (完了): hooks/coreディレクトリを作成し、汎用フック（useResizeObserver, useMobile, useToast）を移動しました。
- **H-1** (完了): hooks/chart内のフックをcanvas, init, toolbar, realtimeなどのサブディレクトリに整理しました。
- **H-2** (完了): hooks/chatディレクトリを整理し、useChatInteractionを適切に移動しました。
- **H-3** (完了): hooks/entryディレクトリを作成し、useEntriesフックを移動し、バレルファイルを更新しました。
- **H-4** (完了): チャート関連フックを整理しました。
  - useLayoutState.ts → hooks/chart/layout/
  - useTimeframe.ts → hooks/chart/config/
  - useChartConfig.ts → hooks/chart/config/
  - useRootChartStore.ts → hooks/chart/store/
  - useChartToolbar.ts → hooks/chart/toolbar/

- **H-5** (完了): hooks/debug/とhooks/symbol/ディレクトリ内のフックを整理しました。
  - hooks/debug/内のフックをstore, polling, logsサブディレクトリに整理
  - hooks/symbol/内のフックをfilter, selector, popularサブディレクトリに整理
  - 各サブディレクトリにバレルファイルを作成し、適切なエクスポート管理を実装
  - 型定義のインポートパスを修正し、コンパイルエラーを解決

- **H-6** (完了): 非推奨フックファイルの削除と古いインポートパスの修正を行いました。
  - コンポーネントの古いインポートパスを修正（sidebar.tsx, toaster.tsx）
  - 非推奨フックファイル（計10ファイル）を削除
  - 削除計画をドキュメント化（docs/deprecated-hooks-cleanup.md）

### types ディレクトリリファクタリングプロジェクト

- **T-0** (完了): ドメイン別フォルダー構成と後方互換用バレルファイルを作成しました。
  - 8つのドメインディレクトリを作成（chart, store, network, ui, chat, entry, symbol, common）
  - 各ドメインのバレルファイル（index.ts）を作成
  - リファクタリングの目的と構造を説明するREADME.mdを追加
  - 既存の型エクスポートを維持し後方互換性を確保

- **T-1** (完了): Chart ドメイン抽出を実施しました。
  - chart.ts / indicators.ts / market.ts から関連型をtypes/chart/に移動
  - 時間関連の型を`time.ts`、データ構造関連の型を`data.ts`に配置
  - インジケーター関連の型を`indicators.ts`に配置
  - オーダーブックと市場データ関連の型を`orderbook.ts`に配置
  - シンボル関連の型を`symbol.ts`に配置
  - バレルファイル（index.ts）を更新してすべての型をエクスポート
  - 型の再エクスポートにより後方互換性を維持

- **T-2** (完了): Store ドメイン抽出を実施しました。
  - store.ts の内容をstore/ディレクトリに移動・整理
  - 以下のファイル構成に整理:
    - app.ts: アプリケーション全体の状態型（AppState）
    - chart.ts: チャート関連のストア型（ChartDataState, IndicatorState など）
    - market.ts: マーケットデータ関連のストア型（MarketState）
    - ui.ts: UI関連のストア型（UIState, TabType）
  - バレルファイル（index.ts）を更新してすべての型をエクスポート
  - StoreState合成型の定義と型安全なインポート処理の実装
  - メインインデックスファイル（types/index.ts）を更新して新しいstoreディレクトリからの型をエクスポート

- **T-3** (完了): Network ドメイン抽出を実施しました。
  - api.ts, websocket.ts, external-libs.ts, supabase.ts を types/network/ に移動・整理
  - 以下のファイル構成に整理:
    - api.ts: API関連の型定義（APIリクエスト、レスポンス、エラーハンドリング型）
    - websocket.ts: WebSocketメッセージ、チャンネル購読型、バリデーション関数
    - external.ts: 外部ライブラリとの統合用の型（OpenAI, ReactDayPicker など）
    - supabase.ts: Supabaseデータベース関連の型定義
  - バレルファイル（network/index.ts）を更新してすべての型をエクスポート
  - 元のファイル（api.ts, websocket.ts, external-libs.ts, supabase.ts）を@deprecatedマークで再エクスポートに変更
  - メインのバレルファイル（types/index.ts）を更新して新しいnetworkドメインからの型をエクスポート
  - 後方互換性を確保しつつ移行を完了

- **T-4** (完了): UI / Chat / Entry / Symbol ドメイン抽出を実施しました。
  - それぞれのドメインディレクトリを更新:
    - ui.ts → types/ui/base.ts
    - chat.ts → types/chat/base.ts
    - entry.ts → types/entry/base.ts
    - symbol.ts → types/symbol/base.ts
  - 各ドメインのバレルファイル（index.ts）を更新してすべての型をエクスポート
  - 元のファイルを@deprecatedマークで再エクスポートに変更
  - メインのバレルファイル（types/index.ts）を更新してすべてのドメインからの型をエクスポート
  - 後方互換性を確保しつつ移行を完了

- **T-5** (完了): 共通型の整理を実施しました。
  - 共通型ディレクトリ内に新たなファイルを作成:
    - common.ts → types/common/base.ts
    - common-interfaces.ts → types/common/interfaces.ts
  - バレルファイル（common/index.ts）を更新してすべての型をエクスポート
  - 元のファイル（common.ts, common-interfaces.ts）を@deprecatedマークで再エクスポートに変更
  - メインのバレルファイル（types/index.ts）を更新してcommonドメインからの型をエクスポート
  - ESLintに非推奨ファイルの直接インポートを警告するルール（no-restricted-imports）を追加
  - 後方互換性を確保しつつ移行を完了

### types ディレクトリリファクタリングプロジェクト（続き）

- **T-6** (完了): バレル排除
  - 検証の結果、コードベース内に `from "types/*.ts"` 形式のインポートはすでに存在しないことが確認されました
  - すべてのインポートが `@/types/chart` などのバレル経由でエイリアスを使用して行われています
  - 一部ファイル間の相対パスインポート（例: `"./time"`）で解決できない問題があり、適宜修正しました
  - 完了条件「grep 'from "types/.*\\.ts"' 0 件」はすでに達成されています
  - これにより、型定義リファクタリングプロジェクト（T-0〜T-6）のすべてのフェーズが完了しました

### マルチスレッドチャット実装プロジェクト

現在、マルチスレッドチャット機能を実装するプロジェクトを開始しました。この機能は、ユーザーが複数の会話を別々に管理できるようにするものです。各会話は固有のコンテキストとメモリを持ち、ChatGPTのようなUIでスレッドを切り替えることができます。

実装計画：

1. **データベース拡張（Supabase/Postgres）**:
   - conversations テーブルを作成
   - chat_messages テーブルに conversation_id カラムと外部キー制約を追加
   - 既存メッセージを初期会話に移行するためのバックフィルスクリプトを作成
   - RLS（Row Level Security）設定
   - 適切なインデックスの作成

2. **API実装（Next.js App Router）**:
   - `/api/conversations` エンドポイントの実装（GET: 会話一覧取得、POST: 新規会話作成）
   - `/api/messages/[conversationId]` エンドポイントの実装（GET: メッセージ取得、POST: メッセージ送信・AI応答取得）
   - askAgent ヘルパー関数の拡張（threadId = conversationId）

3. **フロントエンド実装**:
   - App Router ルーティング構造の実装（`/app/(chat)/layout.tsx`, `/app/(chat)/[id]/page.tsx`）
   - サイドバーコンポーネント（Sidebar.tsx）の実装
   - 新規スレッド作成モーダル（NewThreadModal.tsx）の実装
   - useChatInteraction フックの拡張（conversationId パラメータの追加）
   - Zustand ストアのネームスペース化（会話IDごとの状態管理）

4. **Mastra統合**:
   - agent.stream 呼び出しに threadId パラメータを追加（conversationId と紐付け）
   - system_prompt を instructions として渡すよう拡張
   - スレッドメモリとグローバルメモリの自動フォールバック機能の実装

### Supabase連携プロジェクト

データアクセスレイヤーのSupabase連携機能を整理し、テスト実装を行いました。各機能に対するAPIラッパーを作成し、データ連携を安定化させています。

1. **Supabase API実装**:
   - **認証機能 (supabase-auth.ts)**: ユーザー認証関連のAPIラッパー（signUp, signIn, signOut, プロフィール管理）
   - **エントリー機能 (supabase-entry.ts)**: トレードエントリー管理のAPIラッパー（作成、更新、削除、リスト取得、リアルタイム購読）
   - **チャット機能 (supabase-chat.ts)**: チャットメッセージ管理のAPIラッパー（作成、更新、削除、リスト取得、リアルタイム購読）
   - **会話機能 (supabase-conversations.ts)**: 会話スレッド管理のAPIラッパー（作成、更新、削除、リスト取得、リアルタイム購読）
   - **メモリ機能 (supabase-memory.ts)**: メモリ管理のAPIラッパー（作成、更新、削除、検索機能）
   - **設定機能 (supabase-settings.ts)**: ユーザー設定管理のAPIラッパー（テーマ、表示設定、トレード設定、通知設定）

2. **インポート構造改善**:
   - モジュール間の重複エクスポートを解消
   - index.tsでの選択的エクスポートによる名前衝突回避
   - supabase-api.tsをAPI診断機能に特化させる形に変更

3. **UIとの統合**:
   - メモリ機能はチャットUIに統合されたメモリパネル（`components/chat/ui/MemoryPanel.tsx`）として実装
   - 設定機能はサイドバーからモーダルで開く形で実装（`components/ui/SettingsModal.tsx`）
   - 認証状態と連動した表示制御を実装

4. **認証関連機能の強化**:
   - `hooks/auth/useAuth.ts` フックを実装し、認証状態、セッション、ユーザープロフィール管理を統合
   - `components/profile/ProfileModal.tsx` プロフィール管理モーダルコンポーネントを実装
   - `app/signin/page.tsx` サインインページを実装
   - `app/signup/page.tsx` サインアップページを実装
   - `app/forgot-password/page.tsx` パスワードリセット要求ページを実装
   - `app/reset-password/page.tsx` パスワードリセット実行ページを実装
   - バックテストとユーザー関係機能をプレースホルダーとして整理
   - すべての認証関連フックとページに対するテストを実装（テスト成功）

5. **設定管理機能の強化**:
   - `SettingsModal` コンポーネントをAPIエンドポイント経由からSupabase直接連携に修正
   - `store/settings/actions.ts` のSupabase直接連携を実装
   - 設定ストアの型を修正してSupabase型と互換性のある形に変更
   - ユーザーの現在のセッションを取得し、適切なIDを使った設定保存を実装

6. **テスト実装**:
   - 各Supabaseモジュールに対するユニットテスト実装
   - モックによるテストで実際のDB接続なしでの検証が可能
   - 関数の呼び出し方と戻り値処理の検証
   - 認証関連コンポーネントのテスト実装と実行

## 進行中の作業

- マルチスレッドチャット実装プロジェクト
  - データベース拡張（Supabase migrations）
  - API実装（conversations, messages）
  - フロントエンド実装（サイドバー、モーダル、ルーティング）
  - Mastra統合（スレッドID、メモリ）
- Supabaseデータアクセスレイヤーの統合
  - エントリー機能とチャット機能のフロントエンド連携完了
  - メモリ機能と設定機能のAPIエンドポイント実装完了
  - フロントエンド統合の完了
  - 統合テストの計画
- ユーザー認証関連のフックの整理
- アプリケーション設定関連のフックの整理
- 関数コンポーネントの最適化
- **未使用型の整理と削除作業**
  - 型チェックで判明した問題点の改善
  - 最も修正が必要な未使用型からの対応（validationsドメイン、68件）
  - 削除作業のドキュメント化（docs/validations-cleanup.md, docs/unused-types-cleanup.md）
- **strictNullChecks強化計画**
  - tsconfig.jsonにstrictNullChecksを明示的に追加済み
  - エラー箇所の調査と修正計画の策定（docs/strictnull-checks-impl.md）
  - 段階的な厳格化オプションの導入計画作成

## 今後の作業

1. **Supabase連携の完了**
   - 型の不一致の解決
   - 統合テストの実装
   - E2Eテストでの検証

2. **未使用型の整理**
   - ts-pruneで検出された未使用型の精査と削除
   - 優先順: validations > chart > network > store

3. **TypeScriptの型厳格化**
   - 厳格モードを段階的に有効化
   - null/undefinedの厳格なチェック対応

4. **CI/CDパイプラインの強化**
   - GitHub Actionsに型チェックを追加
   - PR時の自動レビュー依頼の設定

5. **コードベースの最適化**
   - バレルファイルの効率化
   - インポートパスの標準化

## 既知の問題

- Next.jsの内部エラー：ビルド時にサーバーコンポーネントのエラーが発生することがありますが、フックのリファクタリング自体には問題ありません。
- Supabase連携のリンターエラー：エクスポートの重複と型の一部不一致が発生しています。機能自体は動作していますが、型の厳格化が必要です。
- API呼び出し時のENOENTエラー：ルートの問題であり、フックコードには関係ありません。 
- テスト実行時のJSXエラー：JSXのトランスパイルに関連するエラーが一部のテストで発生します。useAuthとページコンポーネントのテストは成功します。 

## 認証システム

### 完了済み

- ✅ Supabaseによる認証基盤
- ✅ サインイン機能
- ✅ サインアップ機能
- ✅ パスワードリセット機能
- ✅ ユーザー設定のSupabase直接連携
- ✅ 認証関連テストの実装と成功確認
- ✅ サーバーサイド認証（SSR認証）の実装
  - ✅ Supabase SSRクライアント実装
  - ✅ ミドルウェアによる認証状態確認
  - ✅ サインアウト処理のサーバーサイド実装
  - ✅ 認証コールバック処理の実装
  - ✅ 認証コンテキストプロバイダーの実装
  - ✅ Reactプロバイダー構成の整理（認証、React Query、モーダル、ソケット）

### 今後の課題

- ⬜ ユーザープロフィール管理機能 