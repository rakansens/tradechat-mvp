import { renderHook, act } from '@testing-library/react'
import { useEntryManager } from '@/hooks/chat'
import type { Entry } from '@/types/entry'

const setPendingEntry = jest.fn()
const executeEntry = jest.fn()
const setActiveTab = jest.fn()
const setMessages = jest.fn()

const mockProposal = { proposalType: 'buy', price: 100 }
const useRootStoreMock = jest.fn(selector => selector({ latestProposal: mockProposal }))

jest.mock('@/store', () => ({
  useRootStore: (selector: any) => useRootStoreMock(selector),
  selectLatestProposal: (state: any) => state.latestProposal,
}))

jest.mock('@/hooks/chat/utils', () => ({
  getCurrentUserId: () => 'user',
}))

describe('useEntryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handleAIProposalQuery sets entry and switches tab', () => {
    const { result } = renderHook(() =>
      useEntryManager({
        pendingEntry: null,
        setPendingEntry,
        executeEntry,
        setActiveTab,
        messages: [],
        setMessages,
      })
    )

    act(() => {
      result.current.handleAIProposalQuery()
    })

    expect(setPendingEntry).toHaveBeenCalled()
    expect(setActiveTab).toHaveBeenCalledWith('chart')
  })

  test('handleProceedWithEntry executes entry', () => {
    const entry: Entry = {
      id: '1',
      userId: 'user',
      side: 'buy',
      symbol: 'BTC',
      price: 1,
      time: '',
      status: 'open',
    }

    const { result } = renderHook(() =>
      useEntryManager({
        pendingEntry: entry,
        setPendingEntry,
        executeEntry,
        setActiveTab,
        messages: [],
        setMessages,
      })
    )

    act(() => {
      result.current.handleProceedWithEntry()
    })

    expect(executeEntry).toHaveBeenCalled()
    expect(setMessages).toHaveBeenCalled()
  })
})

