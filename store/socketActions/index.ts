// store/socketActions/index.ts
// 古いSocketActionsのスタブ - テスト互換性のため

import { useRootStore } from '@/store/rootStore';

export const subscribeInstrument = (symbol: string) => {
  const rootStore = useRootStore.getState();
  return rootStore.setSubscription(symbol, ['instrument']);
};

export const subscribeKline = (symbol: string, timeframe: string) => {
  const rootStore = useRootStore.getState();
  return rootStore.setSubscription(symbol, ['kline', timeframe]);
};

export const unsubscribeAll = () => {
  const rootStore = useRootStore.getState();
  return rootStore.unsubscribeAll();
}; 