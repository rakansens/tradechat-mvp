// store/socketActions/index.ts
// Deprecated SocketActions compatibility layer

import { ExchangeType, ProductType } from '@/types/constants/enums'
import { Timeframe } from '@/types/chart'
import { useRootStore } from '@/store/rootStore'

/**
 * @deprecated Use useRootStore().getState() methods instead.
 * This module provides a thin wrapper around root store actions
 * for backward compatibility with old tests and utilities.
 */
export const socketStoreActions = {
  setSymbol: (symbol: string, _source?: string) => {
    const store = useRootStore.getState()
    return store.setCurrentSymbol(symbol)
  },
  setProductType: (type: ExchangeType | ProductType, _symbol?: string, _source?: string) => {
    const store = useRootStore.getState()
    return store.setProductType(type)
  },
  setTimeframe: (timeframe: Timeframe, _source?: string) => {
    const store = useRootStore.getState()
    return store.updateTimeFrame(timeframe)
  },
  setConnected: (connected: boolean, _source?: string) => {
    const store = useRootStore.getState()
    return store.setConnected(connected)
  },
  setSocketId: (socketId: string, _source?: string) => {
    const store = useRootStore.getState()
    return store.setSocketId(socketId)
  },
  subscribeInstrument: (_symbol: string) => {
    const store = useRootStore.getState()
    return store.setSubscription('orderbook', true)
  },
  subscribeKline: (_symbol: string, _timeframe: string) => {
    const store = useRootStore.getState()
    return store.setSubscription('chart', true)
  },
  unsubscribeAll: () => {
    const store = useRootStore.getState()
    return store.unsubscribeAll()
  }
}

export const {
  setSymbol,
  setProductType,
  setTimeframe,
  setConnected,
  setSocketId,
  subscribeInstrument,
  subscribeKline,
  unsubscribeAll
} = socketStoreActions
