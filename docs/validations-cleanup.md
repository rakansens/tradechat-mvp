# Validationsディレクトリ型削除計画

## 分析結果

ts-pruneの結果から、validationsディレクトリには68の未使用型が検出されました。主に以下のパターンのものです：

1. Schema定義（例: ohlcDataSchema）
2. Schema型（例: OHLCDataSchema）
3. 検証関数（例: validateOHLCData）

## 削除の方針

1. 実際に使用されていないZodスキーマを特定
2. スキーマが未使用の場合、関連する検証関数と型も削除
3. 削除前に依存関係を確認（バレルファイル経由で使用されている可能性）

## domain/validations/chart.ts の削除候補

```typescript
// 未使用と思われるスキーマ
export const ohlcDataSchema = z.object({...})
export const timeframeSchema = z.enum([...])
export const chartDataStateSchema = z.object({...})
export const chartDataActionsSchema = z.object({...})

// 未使用と思われる型
export type OHLCDataSchema = z.infer<typeof ohlcDataSchema>
export type TimeframeSchema = z.infer<typeof timeframeSchema>
export type ChartDataStateSchema = z.infer<typeof chartDataStateSchema>

// 未使用と思われる検証関数
export function validateOHLCData(data: unknown) {...}
export function validateTimeframe(timeframe: unknown) {...}
export function validateChartDataState(state: unknown) {...}
```

## domain/validations/chat.ts の削除候補

```typescript
// 未使用と思われるスキーマ
export const messageSchema = z.object({...})
export const chatInputSchema = z.object({...})
export const quickCommandSchema = z.object({...})

// 未使用と思われる検証関数
export function validateMessage(message: unknown) {...}
export function validateChatInput(input: unknown) {...}
export function validateQuickCommand(command: unknown) {...}
```

## domain/validations/entry.ts の削除候補

```typescript
// 未使用と思われるスキーマ
export const entrySchema = z.object({...})
export const createEntrySchema = z.object({...})
export const updateEntrySchema = z.object({...})
export const entryProposalSchema = z.object({...})

// 未使用と思われる検証関数
export function validateEntry(entry: unknown) {...}
export function validateCreateEntry(entry: unknown) {...}
export function validateUpdateEntry(entry: unknown) {...}
```

## domain/validations/market.ts, price.ts, symbol.ts の削除候補

同様のパターンで、未使用のスキーマ、型、検証関数を特定して削除します。

## 削除手順

1. 各ファイルごとに使用状況を詳細に確認
   ```bash
   grep -r "importスキーマ名" --include="*.ts" --include="*.tsx" .
   ```

2. 確実に未使用のものだけを削除するため、一度に1つのドメインずつ対応

3. 削除後、型チェックとビルドで問題がないか確認
   ```bash
   npx tsc --noEmit
   pnpm build
   ```

4. 各削除ごとにコミット

## 注意事項

- Zodスキーマは直接インポートせず、lib/validationsを経由して使用されている可能性がある
- 一部のスキーマはruntime validationに使用されているケースがあるため、実行時のエラーに注意
- バレルファイル（index.ts）の再エクスポートも適宜更新する必要がある 