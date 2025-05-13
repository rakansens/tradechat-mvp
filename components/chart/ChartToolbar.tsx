"use client"

// components/chart/ChartToolbar.tsx
// 更新: リファクタリングされたコンポーネントを使用するレガシーラッパー
// 変更内容:
// 1. 古いコードはborderから削除し、新しいツールバーコンポーネントに置き換え
// 2. 後方互換性のためにpropsを転送

// 警告: このファイルは下位互換性のために維持されており、将来的に削除される予定です。
// 代わりに `components/chart/toolbar` コンポーネントを直接使用してください。

import React, { memo } from 'react';
import ChartToolbarNew from './toolbar';

interface ChartToolbarProps {
  // タブ関連のprops（親コンポーネントから渡される）
  activeTab?: string
  onTabChange?: (tab: string) => void
}

// @deprecated このコンポーネントは下位互換性のために維持されています。
// 代わりに `components/chart/toolbar` を使用してください。
const ChartToolbarComponent = memo(function ChartToolbar({
  activeTab,
  onTabChange
}: ChartToolbarProps) {
  return (
    <ChartToolbarNew
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
});

// デフォルトエクスポート
export default ChartToolbarComponent;
