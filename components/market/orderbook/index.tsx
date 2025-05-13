/**
 * components/market/orderbook/index.tsx
 * 作成: オーダーブック（板情報）表示のメインコンポーネント
 * - 責務を分割し保守性を向上
 * - 機能別のフックとUIコンポーネントを利用
 * - 元のOrderBook.tsxと同等の機能を維持
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { orderBookPropsSchema, validateOrderBookProps } from '@/lib/validations/market';
import type { OrderBookPropsSchema } from '@/lib/validations/market';

// フック
import useOrderBookStores from './hooks/useOrderBookStores';
import useOrderBookFetcher from './hooks/useOrderBookFetcher';
import useOrderBookCalc from './hooks/useOrderBookCalc';

// UIコンポーネント
import Header from './ui/Header';
import Loader from './ui/Loader';
import ErrorCard from './ui/ErrorCard';
import AsksTable from './ui/AsksTable';
import BidsTable from './ui/BidsTable';
import SpreadBar from './ui/SpreadBar';

/**
 * リファクタリングされたOrderBookコンポーネント
 * Hooksとコンポーネントを使って責務を分割
 */
export const OrderBook: React.FC<OrderBookPropsSchema> = (props) => {
  // クライアントサイドでのみ表示するための状態
  const [mounted, setMounted] = useState(false);
  
  // クライアントサイドでのみ実行される処理
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Zodスキーマを使用してプロパティを検証
  const validationResult = validateOrderBookProps(props);
  
  // 検証に失敗した場合はデフォルト値を使用
  const {
    depth = 15,
    className,
    orderBookWidth = '33%'
  } = validationResult.success ? validationResult.data : props;
  
  // 複数ストアからのデータを取得
  const {
    orderBook,
    isLoadingOrderBook,
    orderBookError,
    currentSymbol,
    fetchOrderBook,
    wsStatus
  } = useOrderBookStores();
  
  // シンボル変更の監視とデータ取得
  const { refetch } = useOrderBookFetcher({
    currentSymbol,
    fetchOrderBook
  });
  
  // オーダーブックデータの計算処理
  const {
    spread,
    spreadPercent,
    processedAsks,
    processedBids,
    formatters
  } = useOrderBookCalc({
    orderBook,
    depth
  });
  
  // エラー発生時のUI
  if (orderBookError) {
    return <ErrorCard error={orderBookError} />;
  }
  
  return (
    <div className={cn("flex flex-col w-full h-full bg-[#131722] border border-[#2A2E39]", className)}>
      {/* ヘッダー部分 */}
      <Header 
        title="オーダーブック"
        currentSymbol={mounted ? currentSymbol : ''}
        wsStatus={wsStatus}
        mounted={mounted}
      />
      
      {/* テーブルヘッダー */}
      <div className="grid grid-cols-3 text-xs text-[#9CA3AF] p-1.5 bg-[#131722] border-b border-[#2A2E39]">
        <div className="text-left">価格</div>
        <div className="text-right">数量</div>
        <div className="text-right">合計</div>
      </div>
      
      {/* 売り注文（asks）テーブル */}
      <AsksTable 
        asks={processedAsks}
        formatPrice={formatters.formatPrice}
        formatAmount={formatters.formatAmount}
        formatTotal={formatters.formatTotal}
      />
      
      {/* スプレッド表示 */}
      <SpreadBar 
        spread={spread}
        spreadPercent={spreadPercent}
      />
      
      {/* 買い注文（bids）テーブル */}
      <BidsTable 
        bids={processedBids}
        formatPrice={formatters.formatPrice}
        formatAmount={formatters.formatAmount}
        formatTotal={formatters.formatTotal}
      />
      
      {/* ローディング表示 */}
      {isLoadingOrderBook && <Loader isLoading={isLoadingOrderBook} />}
    </div>
  );
};

export default OrderBook; 