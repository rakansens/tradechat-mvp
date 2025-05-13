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
  - 一部ファイル間の相互パスインポート（例: `"./time"`）で解決できない問題があり、適宜修正しました
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

## 進行中の作業

- マルチスレッドチャット実装プロジェクト
  - データベース拡張（Supabase migrations）
  - API実装（conversations, messages）
  - フロントエンド実装（サイドバー、モーダル、ルーティング）
  - Mastra統合（スレッドID、メモリ）

## 今後の作業

- テストカバレッジの強化
- パフォーマンスの最適化
- ドキュメントの更新

## 既知の問題

- Next.jsの内部エラー：ビルド時にサーバーコンポーネントのエラーが発生することがありますが、フックのリファクタリング自体には問題ありません。
- API呼び出し時のENOENTエラー：ルートの問題であり、フックコードには関係ありません。
- T-1フェーズのいくつかのリンターエラー：モジュールインポートパスの問題が発生しています。T-5フェーズでこれらを修正予定です。 