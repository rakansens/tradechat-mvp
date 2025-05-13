/**
 * components/market/orderbook/ui/Loader.tsx
 * 作成: オーダーブックのローディング表示UIコンポーネント
 */

import React, { memo } from 'react';

interface LoaderProps {
  // ローディング中かどうか
  isLoading: boolean;
}

/**
 * オーダーブックのローディング表示コンポーネント
 * 半透明オーバーレイとスピナーを表示
 */
const Loader = memo(function Loader({
  isLoading
}: LoaderProps) {
  if (!isLoading) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-b-2 border-[#2962FF]"></div>
    </div>
  );
});

export default Loader; 