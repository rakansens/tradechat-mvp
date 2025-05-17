import { useRootStore } from '@/store/rootStore'
import { symbolService } from '@/services/symbol'
import type { SymbolInfo } from '@/types/symbol/common'
import type { ExchangeType } from '@/types/constants/enums'

jest.mock('@/services/symbol', () => ({
  symbolService: {
    fetchSymbols: jest.fn(),
    saveLastUsedSymbol: jest.fn(),
    saveLastUsedExchangeType: jest.fn(),
    getLastUsedSymbol: jest.fn(),
    getLastUsedExchangeType: jest.fn()
  }
}))

const TEST_EXCHANGE_TYPE: ExchangeType = 'bitget'

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
    exchangeType: TEST_EXCHANGE_TYPE as unknown as any,
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
    exchangeType: TEST_EXCHANGE_TYPE as unknown as any,
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
    exchangeType: TEST_EXCHANGE_TYPE as unknown as any,
    favorite: false
  }
]

const setupStore = () => {
  useRootStore.setState({
    currentSymbol: '',
    exchangeType: TEST_EXCHANGE_TYPE as unknown as any,
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

  it('exposes history actions', () => {
    const state = useRootStore.getState()
    expect(typeof state.addToHistory).toBe('function')
    expect(typeof state.clearHistory).toBe('function')
  })

  it('setFilterOptions updates filter options and filtered symbols', () => {
    useRootStore.getState().setFilterOptions({ quoteAsset: 'USDT' })

    const state = useRootStore.getState()
    expect(state.filterOptions.quoteAsset).toBe('USDT')
    expect(state.filteredSymbols.every(s => s.quoteCoin === 'USDT')).toBe(true)
  })

  it('fetchSymbols populates symbols list and filtered list', async () => {
    ;(symbolService.fetchSymbols as jest.Mock).mockResolvedValue(mockSymbols)

    await useRootStore.getState().fetchSymbols(TEST_EXCHANGE_TYPE as any)

    const state = useRootStore.getState()
    expect(symbolService.fetchSymbols).toHaveBeenCalledWith(TEST_EXCHANGE_TYPE)
    expect(state.symbolsList.length).toBe(mockSymbols.length)
    expect(state.filteredSymbols.length).toBe(mockSymbols.length)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('clearHistory removes all history entries', () => {
    useRootStore.getState().addToHistory({
      symbol: 'BTCUSDT',
      exchangeType: TEST_EXCHANGE_TYPE as unknown as any,
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
