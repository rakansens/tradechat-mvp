/**
 * components/market/orderbook/hooks/useOrderBookFetcher.ts
 * 作成: シンボル変更検知とオーダーブックデータ取得を行うカスタムフック
 */

import { useEffect, useRef, useCallback } from 'react';
import { normalizeSymbol } from '@/utils/symbol';

interface OrderBookFetcherProps {
  // 現在のシンボル
  currentSymbol: string;
  // オーダーブック取得関数
  fetchOrderBook: (symbol: string) => void;
}

/**
 * シンボル変更を監視し、オーダーブックデータを取得するフック
 * @param props フック用プロパティ
 */
export default function useOrderBookFetcher({ 
  currentSymbol, 
  fetchOrderBook 
}: OrderBookFetcherProps) {
  // シンボル変更を検出するための参照
  const prevSymbolRef = useRef(currentSymbol);
  
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
  
  // シンボル変更を監視して、変更があった場合にオーダーブックを再取得
  useEffect(() => {
    // 前回のシンボルを取得（参照を使用）
    const prevSymbol = prevSymbolRef.current;
    
    // 現在のシンボルを正規化
    const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
    const normalizedPrevSymbol = normalizeSymbol(prevSymbol);
    
    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`OrderBook: currentSymbol=${normalizedCurrentSymbol}, prevSymbol=${normalizedPrevSymbol}`);
    }
    
    // シンボルが変更された場合のみオーダーブックを取得
    if (normalizedCurrentSymbol !== normalizedPrevSymbol) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`OrderBook: Symbol changed from ${prevSymbol} to ${currentSymbol}`);
      }
      
      // オーダーブックを取得
      fetchOrderBookWithSymbol(currentSymbol);
    }
    
    // 参照を更新
    prevSymbolRef.current = currentSymbol;
  }, [currentSymbol, fetchOrderBookWithSymbol]);

  return {
    // 必要に応じて手動で再取得するための関数を公開
    refetch: () => fetchOrderBookWithSymbol(currentSymbol)
  };
} 