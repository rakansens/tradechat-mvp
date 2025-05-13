# アクティブコンテキスト

## 現在の作業フォーカス

現在、フックファイルのリファクタリングプロジェクトを進行中です。このプロジェクトは複数のフェーズ（H-0〜H-6）に分けて実行されています。また、新たに types ディレクトリのリファクタリングプロジェクトも開始しました。

### 完了したフェーズ

- **H-0**: hooks/coreディレクトリを作成し、汎用フック（useResizeObserver, useMobile, useToast）を移動しました。
- **H-1**: hooks/chart内のフックをcanvas, init, toolbar, realtimeなどのサブディレクトリに整理しました。
- **H-2**: hooks/chatディレクトリを整理し、useChatInteractionを適切に移動しました。
- **H-3**: hooks/entryディレクトリを作成し、useEntriesフックを移動し、バレルファイルを更新しました。
- **H-4**: 以下のチャート関連フックを整理しました：
  - useLayoutState.ts → hooks/chart/layout/
  - useTimeframe.ts → hooks/chart/config/
  - useChartConfig.ts → hooks/chart/config/
  - useRootChartStore.ts → hooks/chart/store/
  - useChartToolbar.ts → hooks/chart/toolbar/
  
  また、新しいフックの追加（useToolbarEvents, useToolbarStores, usePriceMetrics）や名前の衝突解決（usePriceMetrics → useRealtimePriceMetrics）も行いました。

- **H-5**: hooks/debugとhooks/symbolディレクトリのリファクタリングを完了しました:
   - hooks/debug/内のフックをstore, polling, logsサブディレクトリに整理
   - hooks/symbol/内のフックをfilter, selector, popularサブディレクトリに整理
   - 各サブディレクトリにバレルファイル（index.ts）を作成してエクスポート管理

- **H-6**: 非推奨フックファイルの削除と古いインポートパスの修正:
   - コンポーネントのインポートパスを修正（sidebar.tsx, toaster.tsx）
   - 以下の非推奨フックファイルを削除:
     - hooks/use-mobile.tsx
     - hooks/use-toast.ts
     - hooks/useResizeObserver.ts
     - hooks/useLayoutState.ts
     - hooks/useTimeframe.ts
     - hooks/useChartConfig.ts
     - hooks/useRootChartStore.ts
     - hooks/useChartToolbar.ts
     - hooks/useChatInteraction.ts
     - hooks/useEntries.ts

### types ディレクトリリファクタリングプロジェクト

- **T-0** (完了): ドメイン別フォルダー構成と後方互換用バレルファイルの作成:
   - 8つのドメインディレクトリを作成（chart, store, network, ui, chat, entry, symbol, common）
   - 各ドメインのバレルファイル（index.ts）を作成し、将来のエクスポート構造を準備
   - リファクタリングの目的と構造を説明するREADME.mdを追加
   - 既存の型エクスポートを維持し後方互換性を確保
   - 現行プロジェクトのビルドを壊さないよう慎重に実装

- **T-1** (完了): Chart ドメイン抽出:
   - chart.ts / indicators.ts / market.ts から関連型をtypes/chart/に移動
   - 以下のファイル構成に整理:
     - time.ts: 時間関連の型（Timeframe, Time, UTCTimestamp など）
     - data.ts: データ構造関連の型（OHLCData, ChartMarker など）
     - indicators.ts: インジケーター関連の型
     - orderbook.ts: オーダーブックと市場データ関連の型
     - symbol.ts: シンボル関連の型
   - バレルファイル（index.ts）を更新してすべての型をエクスポート
   - 後方互換性のための型再エクスポートを実装

- **T-2** (完了): Store ドメイン抽出:
   - store.ts の内容をstore/ディレクトリに移動・整理
   - 以下のファイル構成に整理:
     - app.ts: アプリケーション全体の状態型（AppState）
     - chart.ts: チャート関連のストア型（ChartDataState, IndicatorState など）
     - market.ts: マーケットデータ関連のストア型（MarketState）
     - ui.ts: UI関連のストア型（UIState, TabType）
   - バレルファイル（index.ts）を更新してすべての型をエクスポート
   - StoreState合成型の定義と型安全なインポート処理の実装

- **T-3** (完了): Network ドメイン抽出:
   - api.ts, websocket.ts, external-libs.ts, supabase.ts を types/network/ に移動・整理
   - 以下のファイル構成に整理:
     - api.ts: API関連の型定義（APIリクエスト、レスポンス、エラーハンドリング型）
     - websocket.ts: WebSocketメッセージ、チャンネル購読型、バリデーション関数
     - external.ts: 外部ライブラリとの統合用の型（OpenAI, ReactDayPicker など）
     - supabase.ts: Supabaseデータベース関連の型定義
   - バレルファイル（index.ts）を更新してすべての型をエクスポート
   - 後方互換性のための旧ファイルには @deprecated マークを付け、再エクスポート実装
   - メインのバレルファイル（types/index.ts）も更新して新しいnetworkドメインを反映

- **T-4** (完了): UI / Chat / Entry / Symbol ドメイン抽出:
   - 4つのドメインディレクトリを更新:
     - ui.ts → types/ui/base.ts
     - chat.ts → types/chat/base.ts
     - entry.ts → types/entry/base.ts
     - symbol.ts → types/symbol/base.ts
   - 各ドメインのバレルファイル（index.ts）を更新してすべての型をエクスポート
   - 後方互換性のための旧ファイルには @deprecated マークを付け、再エクスポート実装
   - メインのバレルファイル（types/index.ts）も更新して新しいドメインを反映

- **T-5** (完了): 共通型の整理:
   - 共通型をcommonディレクトリに移動・整理:
     - common.ts → types/common/base.ts
     - common-interfaces.ts → types/common/interfaces.ts
   - バレルファイル（common/index.ts）を更新してすべての型をエクスポート
   - 後方互換性のための旧ファイルには @deprecated マークを付け、再エクスポート実装
   - メインのバレルファイル（types/index.ts）も更新してcommonドメインを反映
   - ESLintに非推奨ファイルへの直接インポートを禁止するルールを追加

現在、types ディレクトリのリファクタリングを継続しています。このプロジェクトは以下のフェーズ（T-0〜T-6）のうち、T-0〜T-5が完了し、次はT-6（バレルファイルの最適化）を実施予定です：

- **T-6** (計画中): バレルをサブフォルダー再エクスポートのみに変更し、全コードの参照を修正（任意）。

### 次のステップ

1. types ディレクトリリファクタリングの T-6 フェーズを開始（バレルファイルの最適化）
2. ユーザー認証関連のフックの整理
3. アプリケーション設定関連のフックの整理
4. 関数コンポーネントの最適化（useMemo, useCallback）
5. テストカバレッジの強化
6. ドキュメントの更新

### 検討事項

- 新ディレクトリ構造が明確な責任分離を実現するか検証
- 適切なファイル名と場所の選択で、開発者がフックや型定義を見つけやすくする
- バレルファイルの完全性を確保し、インポートの破損を防止する
- ドメイン境界の適切な設定と型定義の越境防止（eslint-plugin-boundaries と no-restricted-imports）

## 最近の変更

H-0からH-6までのフェーズが完了し、フックのファイル構造が整理され、非推奨フックファイルの削除も完了しました。これにより、コードの整理と保守性が向上し、不要なファイルが削除されることでコードベースがクリーンになりました。

また、types ディレクトリリファクタリングプロジェクトの T-0〜T-5 フェーズが完了しました。これにより：

- T-0: 新しいドメイン別のディレクトリ構造を作成し、将来の型定義移行の準備が整いました
- T-1: チャート関連の型定義がtime.ts, data.ts, indicators.ts, orderbook.ts, symbol.tsなどに適切に整理されました
- T-2: ストア関連の型定義がapp.ts, chart.ts, market.ts, ui.tsに分割され、整理されました
- T-3: ネットワーク関連の型定義がapi.ts, websocket.ts, external.ts, supabase.tsに整理され、後方互換性も確保されました
- T-4: UI、チャット、エントリー、シンボル関連の型定義がそれぞれのドメインディレクトリに移動され、整理されました
- T-5: 共通型がcommon/ディレクトリに整理され、ESLintルールで非推奨ファイルへの直接参照を禁止しました

このリファクタリングにより、型定義がドメイン別に整理され、コードベースの保守性と可読性が向上しています。また、メインバレルファイル（types/index.ts）も適切に更新され、新しいドメイン構造が反映されています。

## アクティブな決定と考慮事項

- フックの命名と構造の一貫性を維持します
- ディレクトリ階層は機能ドメイン別に整理します
- バレルファイル（index.ts）を各ディレクトリに配置し、エクスポートを管理します
- 型定義ファイルはドメイン境界に従って整理し、越境を防止します
- 後方互換性を維持しながら段階的にリファクタリングを進めます 