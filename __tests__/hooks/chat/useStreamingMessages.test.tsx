import { renderHook } from '@testing-library/react'
import { useStreamingMessages } from '@/hooks/chat'
import type { ExtendedMessage } from '@/types/chat/base'

const addMessage = jest.fn()
const updateMessage = jest.fn()

jest.mock('@/store', () => ({
  useRootStore: {
    getState: () => ({
      addMessage,
      updateMessage,
    }),
  },
}))

describe('useStreamingMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('adds and updates streaming message', () => {
    const messages: ExtendedMessage[] = [
      { id: '1', role: 'assistant', content: 'hi' },
    ]
    const { rerender } = renderHook(
      ({ isLoading, msgs }) => useStreamingMessages(isLoading, msgs),
      { initialProps: { isLoading: true, msgs: messages } }
    )

    expect(addMessage).toHaveBeenCalledTimes(1)

    rerender({ isLoading: false, msgs: messages })
    expect(updateMessage).toHaveBeenCalledWith(expect.any(String), { isStreaming: false })
  })
})

