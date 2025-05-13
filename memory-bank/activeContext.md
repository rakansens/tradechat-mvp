# アクティブコンテキスト

## 現在の作業フォーカス

現在、フックファイルのリファクタリングプロジェクトを進行中です。このプロジェクトは複数のフェーズ（H-0〜H-6）に分けて実行されています。

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

### 次のステップ

1. ユーザー認証関連のフックの整理
2. アプリケーション設定関連のフックの整理
3. 関数コンポーネントの最適化（useMemo, useCallback）
4. テストカバレッジの強化
5. ドキュメントの更新

### 検討事項

- 新ディレクトリ構造が明確な責任分離を実現するか検証
- 適切なファイル名と場所の選択で、開発者がフックを見つけやすくする
- バレルファイルの完全性を確保し、インポートの破損を防止する

## 最近の変更

H-0からH-6までのフェーズが完了し、フックのファイル構造が整理され、非推奨フックファイルの削除も完了しました。これにより、コードの整理と保守性が向上し、不要なファイルが削除されることでコードベースがクリーンになりました。

## アクティブな決定と考慮事項

- フックの命名と構造の一貫性を維持します
- ディレクトリ階層は機能ドメイン別に整理します
- バレルファイル（index.ts）を各ディレクトリに配置し、エクスポートを管理します 