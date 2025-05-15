# Supabase移行完了後の型エラー一覧

Supabase関連の移行作業は完了しましたが、以下の型エラーが残っています。これらは移行作業とは直接関係ありませんが、今後修正すべき項目として記録しておきます。

## エラータイプ別分類

### 1. モジュール参照問題
- store関連のimport問題（`useSymbolStore`など）
- ファイルパス参照の問題

### 2. 型の不一致
- `components/chart/container/index.tsx` の `IndicatorType[]` と `ActiveIndicator[]` の不一致
- 各種Mockオブジェクトの型問題

### 3. 重複エクスポート警告
- バレルファイルによる重複エクスポート問題（`utils/chart/index.ts`など）

## 全エラーリスト

```
__tests__/chart/useChartCore.test.ts(103,21): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SeriesDefinition<keyof SeriesOptionsMap>'.
__tests__/chart/useChartCore.test.ts(118,36): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SeriesDefinition<keyof SeriesOptionsMap>'.
__tests__/chart/useChartSectionInit.test.ts(11,32): error TS2307: Cannot find module '@/store/useSymbolStore' or its corresponding type declarations.
__tests__/chart/useChartSectionInit.test.ts(12,10): error TS2305: Module '"@/store/chart"' has no exported member 'useChartDataStore'.
...
```

## 解決方針

1. モジュール参照問題：
   - 存在しないモジュールへの参照を修正
   - 正しいパスへの更新

2. 型の不一致：
   - 適切な型キャストまたは型定義の修正
   - モックオブジェクトの型定義改善

3. 重複エクスポート：
   - バレルファイルの整理
   - 明示的な再エクスポート

## 優先度

- 高：アプリケーション動作に影響するエラー
- 中：テスト実行に影響するエラー
- 低：警告レベルの問題（重複エクスポートなど）

このイシューは参照用として保存し、今後の修正計画に役立てます。 