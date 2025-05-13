/**
 * components/market/orderbook/hooks/useOrderBookCalc.ts
 * 作成: オーダーブックデータの正規化、累積数量計算、スプレッド計算を行うカスタムフック
 */

import { useMemo } from 'react';
import { OrderBookEntry, OrderBookData } from '@/types/market';
import { getPrice, normalizeOrderBookData } from '@/utils/orderbook-utils';

interface OrderBookCalcProps {
  // オーダーブックデータ
  orderBook: OrderBookData | null;
  // 表示する深さ
  depth: number;
}

/**
 * オーダーブックデータを加工し、スプレッドや累積数量を計算するフック
 * @param props フック用プロパティ
 */
export default function useOrderBookCalc({
  orderBook,
  depth
}: OrderBookCalcProps) {
  // オーダーブックデータを標準形式に変換
  const normalizedOrderBook = useMemo(() => {
    if (!orderBook) return null;
    return normalizeOrderBookData(orderBook);
  }, [orderBook]);
  
  // 標準化されたデータから注文データを取得
  const rawBids = useMemo(() => {
    if (!normalizedOrderBook?.bids) return [];
    return normalizedOrderBook.bids as OrderBookEntry[];
  }, [normalizedOrderBook]);
  
  const rawAsks = useMemo(() => {
    if (!normalizedOrderBook?.asks) return [];
    return normalizedOrderBook.asks as OrderBookEntry[];
  }, [normalizedOrderBook]);
  
  // スプレッド計算
  const spread = useMemo(() => {
    if (!orderBook || !orderBook.asks || !orderBook.bids || 
        orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      return 0;
    }
    const lowestAsk = getPrice(orderBook.asks[0]);
    const highestBid = getPrice(orderBook.bids[0]);
    return lowestAsk - highestBid;
  }, [orderBook]);
  
  // スプレッド率計算
  const spreadPercent = useMemo(() => {
    if (!orderBook || !orderBook.asks || !orderBook.bids || 
        orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      return 0;
    }
    const lowestAsk = getPrice(orderBook.asks[0]);
    const highestBid = getPrice(orderBook.bids[0]);
    return ((lowestAsk - highestBid) / lowestAsk) * 100;
  }, [orderBook]);
  
  // 累積数量を含む注文データ処理
  const processedData = useMemo(() => {
    if (!rawBids.length || !rawAsks.length) return { bids: [], asks: [] };

    // 累積数量計算用の一時変数
    let bidTotal = 0;
    let askTotal = 0;

    // 売り注文（asks）を処理 - 上から表示するため、最初から深さ分だけを取得
    const asks = [...rawAsks]
      .slice(0, depth)
      .map(entry => {
        askTotal += entry.amount;
        return {
          ...entry,
          total: askTotal
        };
      });

    // 買い注文（bids）を処理 - 上から表示するため、最初から深さ分だけを取得
    const bids = [...rawBids]
      .slice(0, depth)
      .map(entry => {
        bidTotal += entry.amount;
        return {
          ...entry,
          total: bidTotal
        };
      });

    return { bids, asks };
  }, [rawBids, rawAsks, depth]);
  
  // フォーマット関数
  const formatters = {
    // 価格を表示するためのフォーマット関数
    formatPrice: (price: number): string => {
      // 小数点以下8桁まで表示（末尾の0は削除）
      return price.toFixed(8).replace(/\.?0+$/, '');
    },
    
    // 数量を表示するためのフォーマット関数
    formatAmount: (amount: number): string => {
      // 小数点以下4桁まで表示（末尾の0は削除）
      return amount.toFixed(4).replace(/\.?0+$/, '');
    },
    
    // 合計を表示するためのフォーマット関数
    formatTotal: (total: number): string => {
      // 小数点以下4桁まで表示（末尾の0は削除）
      return total.toFixed(4).replace(/\.?0+$/, '');
    }
  };

  return {
    // 生データ
    normalizedOrderBook,
    
    // 計算値
    spread,
    spreadPercent,
    
    // 加工済みデータ
    processedAsks: processedData.asks,
    processedBids: processedData.bids,
    
    // フォーマッター
    formatters
  };
} 