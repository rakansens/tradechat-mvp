# アクティブコンテキスト

## 現在の作業フォーカス

現在、フックファイルのリファクタリングプロジェクトを進行中です。このプロジェクトは複数のフェーズ（H-0〜H-5）に分けて実行されています。

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

### 現在のフェーズ (H-5)

**hooks/debug/とhooks/symbol/ディレクトリのリファクタリング**

1. **hooks/debug/** - デバッグ関連のフックを整理:
   - `hooks/debug/store/useDebugStores.ts` - デバッグ関連のストア参照を集約するフック
   - `hooks/debug/polling/useDebugPolling.ts` - デバッグ情報のポーリング管理フック
   - `hooks/debug/logs/useLogs.ts` - ログ表示と管理に関するフック
   - 各サブディレクトリにindex.tsファイルを作成してエクスポート管理

2. **hooks/symbol/** - シンボル関連のフックを整理:
   - `hooks/symbol/filter/useFilterState.ts` - シンボルセレクタのフィルター状態を管理
   - `hooks/symbol/selector/useSelectorStores.ts` - シンボルセレクタで使用するストアデータとアクション集約
   - `hooks/symbol/popular/usePopularSymbols.ts` - 人気銘柄リストを管理
   - 各サブディレクトリにindex.tsファイルを作成してエクスポート管理

### 次のステップ

1. hooks/debug/ディレクトリの構造を更新
2. hooks/symbol/ディレクトリの構造を更新
3. 各フックファイルを新しい場所に移動
4. バレルファイル（index.ts）を更新して、適切なエクスポートを確保
5. インポートパスの修正が必要な場合は対応

### 検討事項

- 新ディレクトリ構造が明確な責任分離を実現するか検証
- 適切なファイル名と場所の選択で、開発者がフックを見つけやすくする
- バレルファイルの完全性を確保し、インポートの破損を防止する

## 最近の変更

H-0からH-4までのフェーズが完了し、フックのファイル構造が整理されています。リファクタリングによりコードの整理と保守性が向上しました。

## アクティブな決定と考慮事項

- フックの命名と構造の一貫性を維持します
- ディレクトリ階層は機能ドメイン別に整理します
- バレルファイル（index.ts）を各ディレクトリに配置し、エクスポートを管理します 