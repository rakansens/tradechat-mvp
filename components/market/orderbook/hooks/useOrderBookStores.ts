/**
 * components/market/orderbook/hooks/useOrderBookStores.ts
 * 作成: オーダーブックに必要なすべてのストアデータとアクションを集約するフック
 */

import { useOrderBookStore } from '@/store/market/useOrderBookStore';
import { useSymbolStore } from '@/store/useSymbolStore';
import { useSocketConnected } from '@/store/barrel';

/**
 * オーダーブックコンポーネントで使用する全てのストアデータとアクションを取得するフック
 * @returns オーダーブックに関連するストアデータとアクション
 */
export default function useOrderBookStores() {
  // OrderBookStore
  const orderBook = useOrderBookStore(state => state.orderBook);
  const isLoadingOrderBook = useOrderBookStore(state => state.isLoadingOrderBook);
  const orderBookError = useOrderBookStore(state => state.orderBookError);
  const fetchOrderBook = useOrderBookStore(state => state.fetchOrderBook);
  const wsSubscribed = useOrderBookStore(state => state.wsSubscribed);

  // SymbolStore
  const currentSymbol = useSymbolStore(state => state.currentSymbol);

  // WebSocketStore
  const wsConnected = useSocketConnected();

  return {
    // OrderBookStoreデータ
    orderBook,
    isLoadingOrderBook,
    orderBookError,
    wsSubscribed,
    
    // OrderBookStoreアクション
    fetchOrderBook,
    
    // SymbolStoreデータ
    currentSymbol,
    
    // WebSocketStoreデータ
    wsConnected,
    
    // 結合データ（UIで利用しやすいよう整形）
    wsStatus: {
      connected: wsConnected,
      subscriptions: { orderbook: wsSubscribed }
    }
  };
} 