// components/market/OrderBook.tsx
// オーダーブック（板情報）表示コンポーネント - ChartSectionと視覚的に統一
// 更新: WebSocketの共有データ方式に対応
// - WebSocketからのデータを利用するように変更
// - WebSocketの接続状態を表示する機能を追加
// - データ表示の最適化とパフォーマンス向上
// - WebSocketとRESTAPIのフォールバック機能を実装
// 更新: シンボル更新問題の根本的な解決
// - シンボル変更検出の強化
// - シンボルストアとの連携強化
// - ポーリング管理の改善
// 更新: Zodバリデーションの適用
// 更新: ハイドレーションエラーの修正
// 更新: 無限ループ問題の修正
// - シンボル変更検出ロジックの最適化
// - 不要な再レンダリングの防止
// - fetchOrderBookWithSymbol関数の改善
// 更新: ドメイン駆動設計ストア構造に対応
// - useAppStoreからuseOrderBookStoreとuseSymbolStoreに移行
// - WebSocketの状態管理を更新
// - データフェッチロジックを新しいストア構造に合わせて更新
// 更新: useSymbolStoreからrootStore経由のセレクタに移行

'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { OrderBookEntry } from '../../types/market';
import { cn, normalizeSymbol } from '../../lib/utils';
import { theme } from '../../styles/colors';
import { orderBookPropsSchema, validateOrderBookProps } from '@/lib/validations/market';
import { useOrderBookStore } from '../../store/market/useOrderBookStore';
import { useRootStore } from '../../store/rootStore';
import { getPrice, getAmount, normalizeOrderBookData } from '../../utils/orderbook-utils';
import { useSocketConnected } from '@/store/barrel';
import Decimal from 'decimal.js';
import { BookEntry, OrderBookData } from '../../types/orderbook';
import { Spinner } from '../ui/spinner';

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

// OrderBookPropsはlib/validations/market.tsで定義されたZodスキーマを使用
import type { OrderBookPropsSchema } from '@/lib/validations/market';

export const OrderBook: React.FC<OrderBookPropsSchema> = (props) => {
  // クライアントサイドでのみシンボルを表示するための状態
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
  // 新しいドメインストアからデータを取得
  const orderBook = useOrderBookStore(state => state.orderBook);
  const isLoadingOrderBook = useOrderBookStore(state => state.isLoadingOrderBook);
  const orderBookError = useOrderBookStore(state => state.orderBookError);
  const currentSymbol = useRootStore(state => state.currentSymbol);
  const fetchOrderBook = useOrderBookStore((state) => state.fetchOrderBook);
  // WebSocketの接続状態を取得（無限ループを防ぐために個別のステートを取得）
  const wsConnected = useSocketConnected();
  const wsSubscribed = useOrderBookStore(state => state.wsSubscribed);
  const status = useMemo(() => ({
    connected: wsConnected,
    subscriptions: { orderbook: wsSubscribed }
  }), [wsConnected, wsSubscribed]);
  
  // AppStoreからスプレッド情報を計算
  const spread = useMemo(() => {
    if (!orderBook || !orderBook.asks || !orderBook.bids || orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      return 0;
    }
    const lowestAsk = getPrice(orderBook.asks[0]);
    const highestBid = getPrice(orderBook.bids[0]);
    return lowestAsk - highestBid;
  }, [orderBook]);
  
  const spreadPercent = useMemo(() => {
    if (!orderBook || !orderBook.asks || !orderBook.bids || orderBook.asks.length === 0 || orderBook.bids.length === 0) {
      return 0;
    }
    const lowestAsk = getPrice(orderBook.asks[0]);
    const highestBid = getPrice(orderBook.bids[0]);
    return ((lowestAsk - highestBid) / lowestAsk) * 100;
  }, [orderBook]);
  
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

  // データのローカル加工
  const [processedBids, setProcessedBids] = useState<OrderBookEntry[]>([]);
  const [processedAsks, setProcessedAsks] = useState<OrderBookEntry[]>([]);
  
  // オーダーブックデータの検証 - パフォーマンス向上のために参照のみを保持
  const { validateOrderBookData } = require('@/lib/validations/market');
  
  // デバッグモードでのみ検証を実行
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && orderBook) {
      const validationResult = validateOrderBookData(orderBook);
      
      if (!validationResult.success) {
        console.warn('OrderBook data validation failed:', validationResult.error);
      }
    }
  }, [orderBook?.timestamp]); // タイムスタンプのみを依存配列に追加

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

  // シンボルストアから直接シンボルを取得
  const appStoreSymbol = useRootStore(state => state.currentSymbol);
  
  // シンボル変更を検出するための参照
  const prevSymbolRef = useRef(currentSymbol);
  const prevAppStoreSymbolRef = useRef(appStoreSymbol);
  
  // オーダーブック取得関数（最適化版）
  const fetchOrderBookWithSymbol = useCallback((symbol: string) => {
    // シンボルが空の場合は処理を行わない
    if (!symbol) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('OrderBook: Cannot fetch orderbook with empty symbol');
      }
      return;
    }
    
    // 正規化したシンボルを使用
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // 開発環境のみログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`OrderBook: Fetching orderbook for normalized symbol: ${normalizedSymbol}`);
    }
    
    // OrderBookStoreのfetchOrderBook関数を呼び出し
    fetchOrderBook(normalizedSymbol);
  }, [fetchOrderBook]);
  
  // シンボル変更を監視して、変更があった場合にオーダーブックを再取得（最適化版）
  useEffect(() => {
    // 前回のシンボルを取得（参照を使用）
    const prevSymbol = prevSymbolRef.current;
    const prevAppStoreSymbol = prevAppStoreSymbolRef.current;
    
    // 現在のシンボルを正規化
    const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
    const normalizedAppStoreSymbol = normalizeSymbol(appStoreSymbol);
    const normalizedPrevSymbol = normalizeSymbol(prevSymbol);
    
    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`OrderBook: currentSymbol=${normalizedCurrentSymbol}, appStoreSymbol=${normalizedAppStoreSymbol}, prevSymbol=${normalizedPrevSymbol}`);
    }
    
    // シンボルが変更された場合のみオーダーブックを取得
    // 前回のシンボルと現在のシンボルが異なる場合のみ処理
    if (normalizedCurrentSymbol !== normalizedPrevSymbol) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`OrderBook: Symbol changed from ${prevSymbol} to ${currentSymbol}`);
      }
      
      // オーダーブックを取得
      fetchOrderBookWithSymbol(currentSymbol);
    }
    
    // 参照を更新
    prevSymbolRef.current = currentSymbol;
    prevAppStoreSymbolRef.current = appStoreSymbol;
    
    // クリーンアップ関数は不要（AbortControllerはfetchOrderBookWithSymbol内で管理）
  }, [currentSymbol, appStoreSymbol, fetchOrderBookWithSymbol]);

  // ポーリングはuseAppStoreで一元管理されるため、コンポーネント側での実装は削除

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
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-white">オーダーブック</h3>
          {/* WebSocketの接続状態を表示 */}
          {mounted && (
            <div className="ml-2 flex items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mr-1",
                  status.connected ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="text-xs text-[#9CA3AF]">
                {status.connected ? (
                  status.subscriptions?.orderbook ? "WS" : "REST"
                ) : "REST"}
              </span>
            </div>
          )}
        </div>
        <span className="text-xs text-[#9CA3AF]">
          {mounted ? currentSymbol : ''}
          {/* デバッグ用：AppStoreとの同期状態を表示 */}
          {mounted && normalizeSymbol(currentSymbol) !== normalizeSymbol(appStoreSymbol) && (
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
