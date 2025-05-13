/**
 * components/market/orderbook/ui/ErrorCard.tsx
 * 作成: エラー表示用のUIコンポーネント
 */

import React, { memo } from 'react';

interface ErrorCardProps {
  // エラーメッセージ
  error: string | null;
}

/**
 * エラー表示用のカードコンポーネント
 * エラーがない場合は何も表示しない
 */
const ErrorCard = memo(function ErrorCard({
  error
}: ErrorCardProps) {
  if (!error) return null;
  
  return (
    <div className="p-4 text-red-500 bg-red-100 rounded">
      Error: {error}
    </div>
  );
});

export default ErrorCard; 