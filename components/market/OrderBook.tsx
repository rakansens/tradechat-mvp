// components/market/OrderBook.tsx
// オーダーブック（板情報）表示コンポーネント

'use client';

import { useEffect, useState } from 'react';
import { useMarketStore } from '../../store';
import { OrderBookEntry } from '../../types/market';
import { cn } from '../../lib/utils';

// 価格を表示するためのフォーマット関数
const formatPrice = (price: number): string => {
  // 小数点以下8桁まで表示（末尾の0は削除）
  return price.toFixed(8).replace(/\.?0+$/, '');
};

// 数量を表示するためのフォーマット関数
const formatAmount = (amount: number): string => {
  // 小数点以下4桁まで表示（末尾の0は削除）
  return amount.toFixed(4).replace(/\.?0+$/, '');
};

// 合計を表示するためのフォーマット関数
const formatTotal = (total: number): string => {
  // 小数点以下4桁まで表示（末尾の0は削除）
  return total.toFixed(4).replace(/\.?0+$/, '');
};

interface OrderBookProps {
  depth?: number; // 表示する深さ
  className?: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  depth = 15, // デフォルトは15レベル
  className,
}) => {
  // マーケットストアからデータを取得
  const {
    orderBook,
    isLoadingOrderBook,
    orderBookError,
    currentSymbol,
    fetchOrderBook,
  } = useMarketStore();

  // スプレッド計算用
  const [spread, setSpread] = useState<{value: number, percent: number}>({value: 0, percent: 0});

  // データのローカル加工
  const [processedBids, setProcessedBids] = useState<OrderBookEntry[]>([]);
  const [processedAsks, setProcessedAsks] = useState<OrderBookEntry[]>([]);

  // オーダーブックデータを加工する関数
  const processOrderBookData = () => {
    if (!orderBook) return;

    // 累積数量計算用の一時変数
    let bidTotal = 0;
    let askTotal = 0;

    // 売り注文（asks）を処理 - 上から表示するため、最初から深さ分だけを取得
    const asks = [...orderBook.asks]
      .slice(0, depth)
      .map(entry => {
        askTotal += entry.amount;
        return {
          ...entry,
          total: askTotal
        };
      });

    // 買い注文（bids）を処理 - 上から表示するため、最初から深さ分だけを取得
    const bids = [...orderBook.bids]
      .slice(0, depth)
      .map(entry => {
        bidTotal += entry.amount;
        return {
          ...entry,
          total: bidTotal
        };
      });

    // スプレッド計算（最良売り注文と最良買い注文の差）
    if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
      const bestAsk = orderBook.asks[0].price;
      const bestBid = orderBook.bids[0].price;
      const spreadValue = bestAsk - bestBid;
      const spreadPercent = (spreadValue / bestBid) * 100;
      
      setSpread({
        value: spreadValue,
        percent: spreadPercent
      });
    }

    setProcessedAsks(asks);
    setProcessedBids(bids);
  };

  // コンポーネントマウント時とシンボル変更時にデータ取得
  useEffect(() => {
    fetchOrderBook();
    
    // 定期的にデータを更新（3秒ごと）
    const intervalId = setInterval(() => {
      fetchOrderBook();
    }, 3000);
    
    // クリーンアップ
    return () => clearInterval(intervalId);
  }, [currentSymbol, fetchOrderBook]);

  // オーダーブックデータが変更されたら加工
  useEffect(() => {
    processOrderBookData();
  }, [orderBook]);

  // エラー表示
  if (orderBookError) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded">
        Error: {orderBookError}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full h-full rounded border border-gray-200 dark:border-gray-800", className)}>
      <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium">オーダーブック</h3>
        <span className="text-xs text-gray-500">{currentSymbol}</span>
      </div>
      
      {/* ヘッダー */}
      <div className="grid grid-cols-3 text-xs text-gray-500 p-2 bg-gray-50 dark:bg-gray-850">
        <div className="text-left">価格</div>
        <div className="text-right">数量</div>
        <div className="text-right">合計</div>
      </div>
      
      {/* 売り注文（asks） - 高い価格から低い価格へ */}
      <div className="overflow-y-auto max-h-[200px] scrollbar-thin">
        {processedAsks.map((ask, index) => (
          <div 
            key={`ask-${index}`} 
            className="grid grid-cols-3 text-xs p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{
              background: `linear-gradient(to left, rgba(255, 0, 0, 0.05) ${Math.min(ask.total || 0, 20) * 5}%, transparent 0%)`
            }}
          >
            <div className="text-left text-red-500">{formatPrice(ask.price)}</div>
            <div className="text-right">{formatAmount(ask.amount)}</div>
            <div className="text-right">{formatTotal(ask.total || 0)}</div>
          </div>
        ))}
      </div>
      
      {/* スプレッド */}
      <div className="p-1 text-xs text-center bg-gray-100 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
        スプレッド: {spread.value.toFixed(2)} ({spread.percent.toFixed(2)}%)
      </div>
      
      {/* 買い注文（bids） - 高い価格から低い価格へ */}
      <div className="overflow-y-auto max-h-[200px] scrollbar-thin">
        {processedBids.map((bid, index) => (
          <div 
            key={`bid-${index}`} 
            className="grid grid-cols-3 text-xs p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{
              background: `linear-gradient(to left, rgba(0, 255, 0, 0.05) ${Math.min(bid.total || 0, 20) * 5}%, transparent 0%)`
            }}
          >
            <div className="text-left text-green-500">{formatPrice(bid.price)}</div>
            <div className="text-right">{formatAmount(bid.amount)}</div>
            <div className="text-right">{formatTotal(bid.total || 0)}</div>
          </div>
        ))}
      </div>
      
      {/* ローディング表示 */}
      {isLoadingOrderBook && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default OrderBook; 