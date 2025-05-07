// components/market/OrderBook.tsx
// オーダーブック（板情報）表示コンポーネント - ChartSectionと視覚的に統一
// 更新: シンボル更新問題の根本的な解決
// - シンボル変更検出の強化
// - シンボルストアとの連携強化
// - ポーリング管理の改善

'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  useMarketStore,
  selectOrderBook,
  selectIsLoadingOrderBook,
  selectOrderBookError,
  selectMarketCurrentSymbol,
  selectBids,
  selectAsks,
  selectSpread,
  selectSpreadPercent
} from '../../store';
import { useSymbolStore } from '../../store/useSymbolStore';
import { OrderBookEntry } from '../../types/market';
import { cn } from '../../lib/utils';
import { theme } from '../../styles/colors';

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
  orderBookWidth?: number | string; // 表示幅
}

export const OrderBook: React.FC<OrderBookProps> = ({
  depth = 15, // デフォルトは15レベル
  className,
  orderBookWidth = '33%', // デフォルトは33%
}) => {
  // メモ化されたセレクタを使用してストアからデータを取得
  const orderBook = useMarketStore(selectOrderBook);
  const isLoadingOrderBook = useMarketStore(selectIsLoadingOrderBook);
  const orderBookError = useMarketStore(selectOrderBookError);
  const currentSymbol = useMarketStore(selectMarketCurrentSymbol);
  const fetchOrderBook = useMarketStore((state) => state.fetchOrderBook);
  
  // メモ化されたセレクタを使用してスプレッド情報を取得
  const spread = useMarketStore(selectSpread);
  const spreadPercent = useMarketStore(selectSpreadPercent);
  
  // メモ化されたセレクタを使用して注文データを取得
  const rawBids = useMarketStore(selectBids);
  const rawAsks = useMarketStore(selectAsks);

  // データのローカル加工
  const [processedBids, setProcessedBids] = useState<OrderBookEntry[]>([]);
  const [processedAsks, setProcessedAsks] = useState<OrderBookEntry[]>([]);

  // メモ化された注文データ処理
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

  // 処理されたデータをステートに設定
  useEffect(() => {
    if (processedData.bids.length > 0) {
      setProcessedBids(processedData.bids);
    }
    if (processedData.asks.length > 0) {
      setProcessedAsks(processedData.asks);
    }
  }, [processedData]);

  // シンボルストアから直接シンボルを取得（二重購読によるシンボル同期の強化）
  const symbolStoreSymbol = useSymbolStore(state => state.currentSymbol);
  
  // シンボル変更を検出するための参照
  const prevSymbolRef = useRef(currentSymbol);
  const prevSymbolStoreSymbolRef = useRef(symbolStoreSymbol);
  
  // シンボル正規化関数（一貫性のある正規化処理のため）
  const normalizeSymbol = useCallback((symbol: string) => {
    return symbol.replace('/', '');
  }, []);
  
  // オーダーブック取得関数（正規化処理を含む）
  const fetchOrderBookWithSymbol = useCallback((symbol: string) => {
    console.log(`OrderBook: Fetching orderbook for symbol: ${symbol}`);
    const normalizedSymbol = normalizeSymbol(symbol);
    console.log(`OrderBook: Normalized symbol for fetch: ${normalizedSymbol}`);
    
    // 新しいAbortControllerを作成
    const abortController = new AbortController();
    
    // 明示的に正規化したシンボルを渡す
    fetchOrderBook(normalizedSymbol, abortController.signal);
    
    return abortController;
  }, [fetchOrderBook, normalizeSymbol]);
  
  // シンボル変更を監視して、変更があった場合にオーダーブックを再取得
  useEffect(() => {
    console.log(`OrderBook: currentSymbol=${currentSymbol}, symbolStoreSymbol=${symbolStoreSymbol}`);
    
    // シンボルストアとマーケットストアのシンボルを正規化して比較
    const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
    const normalizedSymbolStoreSymbol = normalizeSymbol(symbolStoreSymbol);
    
    // シンボルの不一致を検出（マーケットストアとシンボルストアの同期ずれを検出）
    if (normalizedCurrentSymbol !== normalizedSymbolStoreSymbol) {
      console.log(`OrderBook: Symbol mismatch detected! market=${normalizedCurrentSymbol}, symbol=${normalizedSymbolStoreSymbol}`);
      
      // マーケットストアのシンボルを強制的にシンボルストアと同期
      useMarketStore.setState({ currentSymbol: symbolStoreSymbol });
      
      // 強制的にシンボルストアのシンボルでオーダーブックを取得
      fetchOrderBookWithSymbol(symbolStoreSymbol);
      return;
    }
    
    // 前回のシンボルと比較して変更があった場合のみ処理
    const prevSymbol = prevSymbolRef.current;
    const normalizedPrevSymbol = normalizeSymbol(prevSymbol);
    
    if (normalizedCurrentSymbol !== normalizedPrevSymbol) {
      console.log(`OrderBook: Symbol changed from ${prevSymbol} to ${currentSymbol}`);
      
      // オーダーブックを即時取得（遅延なし）
      const abortController = fetchOrderBookWithSymbol(currentSymbol);
      
      // クリーンアップ関数でAbortControllerをキャンセル
      return () => {
        abortController.abort();
        console.log(`OrderBook: Aborted fetch for symbol change from ${prevSymbol} to ${currentSymbol}`);
      };
    }
    
    // 参照を更新
    prevSymbolRef.current = currentSymbol;
    prevSymbolStoreSymbolRef.current = symbolStoreSymbol;
  }, [currentSymbol, symbolStoreSymbol, fetchOrderBookWithSymbol, normalizeSymbol]);

  // ポーリングをストアのポーリング機能を使用
  useEffect(() => {
    // ポーリング関連のアクションを取得
    const { startPolling, stopPolling, isPolling } = useMarketStore.getState();
    
    console.log('OrderBook: Component mounted, checking polling status');
    
    // 現在のシンボルを取得して正規化
    const symbol = useMarketStore.getState().currentSymbol;
    const normalizedSymbol = normalizeSymbol(symbol);
    
    console.log(`OrderBook: Starting polling for ${normalizedSymbol} (original: ${symbol})`);
    
    // 既存のポーリングを停止してから再開始（クリーンな状態で開始）
    stopPolling();
    
    // 少し遅延させてから再開始（確実に停止するのを待つ）
    const timer = setTimeout(() => {
      startPolling();
      console.log(`OrderBook: Polling started for ${normalizedSymbol}`);
    }, 200);
    
    // コンポーネントアンマウント時にタイマーをクリア
    return () => {
      clearTimeout(timer);
      console.log('OrderBook: Component unmounted');
    };
  }, [normalizeSymbol]); // 依存配列にnormalizeSymbolを追加

  // エラー表示
  if (orderBookError) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded">
        Error: {orderBookError}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full h-full bg-[#131722] border border-[#2A2E39]", className)}>
      <div className="p-2 bg-[#1E222D] border-b border-[#2A2E39] flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">オーダーブック</h3>
        <span className="text-xs text-[#9CA3AF]">
          {currentSymbol}
          {/* デバッグ用：シンボルストアとの同期状態を表示 */}
          {normalizeSymbol(currentSymbol) !== normalizeSymbol(symbolStoreSymbol) && (
            <span className="ml-1 text-red-500">(!)</span>
          )}
        </span>
      </div>
      
      {/* ヘッダー */}
      <div className="grid grid-cols-3 text-xs text-[#9CA3AF] p-1.5 bg-[#131722] border-b border-[#2A2E39]">
        <div className="text-left">価格</div>
        <div className="text-right">数量</div>
        <div className="text-right">合計</div>
      </div>
      
      {/* 売り注文（asks） - 高い価格から低い価格へ */}
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2E39] scrollbar-track-[#131722] flex-1">
        {processedAsks.map((ask, index) => (
          <div 
            key={`ask-${index}`} 
            className="grid grid-cols-3 text-[0.7rem] py-0.5 px-1 dark:hover:bg-[#1C2030]"
            style={{
              background: `linear-gradient(to left, rgba(239, 68, 68, 0.1) ${Math.min(ask.total || 0, 20) * 5}%, transparent 0%)`
            }}
          >
            <div className="text-left text-[#EF4444]">{formatPrice(ask.price)}</div>
            <div className="text-right text-white">{formatAmount(ask.amount)}</div>
            <div className="text-right text-[#9CA3AF]">{formatTotal(ask.total || 0)}</div>
          </div>
        ))}
      </div>
      
      {/* スプレッド */}
      <div className="py-1 px-2 text-xs text-center bg-[#1E222D] border-y border-[#2A2E39] font-medium">
        <span className="text-white">スプレッド:</span> <span className="text-[#9CA3AF]">{spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)</span>
      </div>
      
      {/* 買い注文（bids） - 高い価格から低い価格へ */}
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2E39] scrollbar-track-[#131722] flex-1">
        {processedBids.map((bid, index) => (
          <div 
            key={`bid-${index}`} 
            className="grid grid-cols-3 text-[0.7rem] py-0.5 px-1 dark:hover:bg-[#1C2030]"
            style={{
              background: `linear-gradient(to left, rgba(34, 197, 94, 0.1) ${Math.min(bid.total || 0, 20) * 5}%, transparent 0%)`
            }}
          >
            <div className="text-left text-[#22C55E]">{formatPrice(bid.price)}</div>
            <div className="text-right text-white">{formatAmount(bid.amount)}</div>
            <div className="text-right text-[#9CA3AF]">{formatTotal(bid.total || 0)}</div>
          </div>
        ))}
      </div>
      
      {/* ローディング表示 */}
      {isLoadingOrderBook && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-b-2 border-[#2962FF]"></div>
        </div>
      )}
    </div>
  );
};

export default OrderBook;
