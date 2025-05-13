# 非推奨フック削除計画（H-6フェーズ）

## 概要

H-0〜H-5フェーズで実施したフックのリファクタリングに続いて、H-6フェーズでは非推奨となった古いフックファイルの削除を行います。

## 削除対象ファイル

### コアフック
- [x] `hooks/use-mobile.tsx` → `hooks/core/useMobile.tsx`
- [x] `hooks/use-toast.ts` → `hooks/core/useToast.ts`
- [x] `hooks/useResizeObserver.ts` → `hooks/core/useResizeObserver.ts`

### チャート関連フック
- [x] `hooks/useLayoutState.ts` → `hooks/chart/layout/useLayoutState.ts`
- [x] `hooks/useTimeframe.ts` → `hooks/chart/config/useTimeframe.ts`
- [x] `hooks/useChartConfig.ts` → `hooks/chart/config/useChartConfig.ts`
- [x] `hooks/useRootChartStore.ts` → `hooks/chart/store/useRootChartStore.ts`
- [x] `hooks/useChartToolbar.ts` → `hooks/chart/toolbar/useChartToolbar.ts`

### チャット関連フック
- [x] `hooks/useChatInteraction.ts` → `hooks/chat/useChatInteraction.ts`

### エントリー関連フック
- [x] `hooks/useEntries.ts` → `hooks/entry/useEntries.ts`

## インポートパス修正済みファイル
- [x] `components/ui/sidebar.tsx`: `@/hooks/use-mobile` → `@/hooks/core/useMobile`
- [x] `components/ui/toaster.tsx`: `@/hooks/use-toast` → `@/hooks/core/useToast`

## 検証項目

1. すべての非推奨フックが新しい場所に適切に移行されていることを確認
2. すべてのコンポーネントが新しいフックパスを使用していることを確認
3. アプリケーションが問題なく動作することを確認

## 完了時にバージョン管理システムに反映

```bash
git add .
git commit -m "✨ refactor(hooks): 非推奨フックファイルの削除（H-6フェーズ）"
git push
``` 