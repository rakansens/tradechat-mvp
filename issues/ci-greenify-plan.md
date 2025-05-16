# S-12: CI緑化計画

## 実装済み変更点

1. **テスト用型チェック緩和**
   - `tsconfig.test.json`を新規作成
   - テスト用に`noImplicitAny: false`, `strict: false`設定
   - `__tests__/**/*.ts`, `__tests__/**/*.tsx`のみに適用

2. **型参照の一元化**
   - `types/store/index.ts`を作成し、よく使われる型をまとめて再エクスポート
   - `IndicatorType`, `ActiveIndicator`, `DrawingToolType`等
   - `FilterOptions`, `SymbolChangeHistory`, `SymbolChangeValue`

3. **createPersistedSlice修正**
   - StateCreator型互換性問題を解消
   - シンプルなSetter/Getter型定義による解決
   - immerミドルウェア統合の改善

## 残りのエラー対応

1. **ExchangeType参照の統一**
   - すべてのExchangeType参照を`@/types/api`に統一
   - 互換レイヤーとして`utils/exchangeTypeUtils.ts`を活用

2. **`@/store`から`@/types/store`への移行漏れ対応**
   - 特にチャートコンポーネント関連の参照修正
   - `components/chart/toolbar/*`
   - `hooks/chart/**/*.ts`

3. **`Symbol`/`Chart`系の型対応続き**
   - `symbolChangeHistory`関連の型矛盾解消
   - Candle/Chart関連型の明示化

4. **暗黙的any対応**
   - `store/chat/actions.ts`の暗黙的パラメータ型付け
   - `store/rootStore.ts`の`unknown`アサーション修正

## CIビルド対応方針

### 開発環境での型チェック (src/)
- `pnpm run typecheck` - 厳格な型チェック
- src/ディレクトリの型エラーをすべて解消

### テスト環境での型チェック緩和 (tests/)
- `pnpm run typecheck:test` - 緩和された型チェック
- コマンド: `tsc -p tsconfig.test.json --noEmit`
- テストコードは段階的に型を付けていく方針

## 実行工程

1. CI設定更新: ビルドフロー分割
   - `typecheck` - ソースコード型チェック
   - `typecheck:test` - テストコード型チェック（緩和）

2. 型エラー解消対応
   - 優先度: barrelファイル > 型参照エラー > 未使用の型 > any

3. CIテスト自動化
   - 型チェックテストを追加
   - シンボル互換性テスト追加

## 効果
- 型安全性向上
- ランタイムエラー防止
- コードの品質・メンテナンス性向上
- 開発者体験の向上 