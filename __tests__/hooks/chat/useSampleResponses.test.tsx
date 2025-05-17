import { renderHook, act } from '@testing-library/react'
import { useSampleResponses } from '@/hooks/chat'

const setMessages = jest.fn()
const setPendingEntry = jest.fn()
const setIsSearching = jest.fn()
const submit = jest.fn()

jest.mock('@/hooks/chat/utils', () => ({
  getCurrentUserId: () => 'user',
}))

describe('useSampleResponses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('triggers sample entry point response', () => {
    const { result } = renderHook(() =>
      useSampleResponses({
        input: 'Entry Point please',
        messages: [],
        setMessages,
        setPendingEntry,
        setIsSearching,
        conversationId: undefined,
        submit,
      })
    )

    act(() => {
      result.current.handleSubmit({ preventDefault: jest.fn() } as any)
    })

    expect(setMessages).toHaveBeenCalled()
    expect(setPendingEntry).toHaveBeenCalled()
  })

  test('falls back to submit when conversationId exists', () => {
    const { result } = renderHook(() =>
      useSampleResponses({
        input: 'hello',
        messages: [],
        setMessages,
        setPendingEntry,
        setIsSearching,
        conversationId: 'abc',
        submit,
      })
    )

    act(() => {
      result.current.handleSubmit({ preventDefault: jest.fn() } as any)
    })

    expect(submit).toHaveBeenCalled()
  })
})

