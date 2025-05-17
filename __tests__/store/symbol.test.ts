import { useRootStore } from '@/store/rootStore'
import { symbolService } from '@/services/symbol'
import type { SymbolInfo } from '@/types/symbol/common'

jest.mock('@/services/symbol', () => ({
  symbolService: {
    fetchSymbols: jest.fn(),
    saveLastUsedSymbol: jest.fn(),
    saveLastUsedExchangeType: jest.fn(),
    getLastUsedSymbol: jest.fn(),
    getLastUsedExchangeType: jest.fn()
  }
}))

const mockSymbols: SymbolInfo[] = [
  {
    id: '1',
    symbol: 'BTCUSDT',
    baseCoin: 'BTC',
    quoteCoin: 'USDT',
    minOrderSize: 0.001,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false
  },
  {
    id: '2',
    symbol: 'ETHBTC',
    baseCoin: 'ETH',
    quoteCoin: 'BTC',
    minOrderSize: 0.001,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: true
  },
  {
    id: '3',
    symbol: 'BNBUSDT',
    baseCoin: 'BNB',
    quoteCoin: 'USDT',
    minOrderSize: 0.001,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false
  }
]

const setupStore = () => {
  useRootStore.setState({
    currentSymbol: '',
    exchangeType: 'spot',
    symbolsList: mockSymbols,
    filteredSymbols: mockSymbols,
    filterOptions: {
      search: '',
      quoteAsset: '',
      showFavoritesOnly: false,
      hideStablePairs: false
    },
    isLoading: false,
    error: null,
    changeHistory: []
  })
}

describe('Symbol Slice Actions', () => {
  beforeEach(() => {
    setupStore()
    jest.clearAllMocks()
  })

  it('setFilterOptions updates filter options and filtered symbols', () => {
    useRootStore.getState().setFilterOptions({ quoteAsset: 'USDT' })

    const state = useRootStore.getState()
    expect(state.filterOptions.quoteAsset).toBe('USDT')
    expect(state.filteredSymbols.every(s => s.quoteCoin === 'USDT')).toBe(true)
  })

  it('fetchSymbols populates symbols list and filtered list', async () => {
    ;(symbolService.fetchSymbols as jest.Mock).mockResolvedValue(mockSymbols)

    await useRootStore.getState().fetchSymbols('spot')

    const state = useRootStore.getState()
    expect(symbolService.fetchSymbols).toHaveBeenCalledWith('spot')
    expect(state.symbolsList.length).toBe(mockSymbols.length)
    expect(state.filteredSymbols.length).toBe(mockSymbols.length)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('clearHistory removes all history entries', () => {
    useRootStore.getState().addToHistory({
      symbol: 'BTCUSDT',
      exchangeType: 'spot',
      field: 'favorite',
      oldValue: false,
      newValue: true,
      source: 'test'
    })

    expect(useRootStore.getState().changeHistory.length).toBe(1)

    useRootStore.getState().clearHistory()

    expect(useRootStore.getState().changeHistory.length).toBe(0)
  })
})
