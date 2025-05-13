/**
 * components/market/orderbook/hooks/useOrderBookStores.ts
 * 作成: オーダーブックに必要なすべてのストアデータとアクションを集約するフック
 * 更新: useSymbolStoreをuseRootStoreに変更
 * 更新: 2025-06-05 - useOrderBookStoreをuseRootStoreに統合
 */

import { useRootStore } from '@/store/rootStore';
import { 
  selectOrderBook,
  selectIsLoadingOrderBook,
  selectOrderBookError,
  selectOrderBookWsSubscribed
} from '@/store/barrel';
import { useSocketConnected } from '@/store/barrel';

/**
 * オーダーブックコンポーネントで使用する全てのストアデータとアクションを取得するフック
 * @returns オーダーブックに関連するストアデータとアクション
 */
export default function useOrderBookStores() {
  // RootStoreからオーダーブックデータを取得
  const orderBook = useRootStore(selectOrderBook);
  const isLoadingOrderBook = useRootStore(selectIsLoadingOrderBook);
  const orderBookError = useRootStore(selectOrderBookError);
  const fetchOrderBook = useRootStore(state => state.fetchOrderBook);
  const wsSubscribed = useRootStore(selectOrderBookWsSubscribed);

  // SymbolStore（rootStoreから取得）
  const currentSymbol = useRootStore(state => state.currentSymbol);

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