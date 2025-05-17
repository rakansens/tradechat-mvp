import type { FormEvent } from 'react'
import type { ExtendedMessage } from '@/types/chat/base'
import type { OpenEntry } from '@/types/entry'
import { getCurrentUserId } from './utils'

interface UseSampleResponsesProps {
  input: string
  messages: ExtendedMessage[]
  setMessages: (msgs: ExtendedMessage[]) => void
  setPendingEntry: (entry: OpenEntry | null) => void
  setIsSearching: (v: boolean) => void
  conversationId?: string
  submit: (e: FormEvent<HTMLFormElement>) => void
}

export function useSampleResponses({
  input,
  messages,
  setMessages,
  setPendingEntry,
  setIsSearching,
  conversationId,
  submit,
}: UseSampleResponsesProps) {
  const handleEntryPointQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: input } as ExtendedMessage,
      {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: `Based on my analysis of the BTC/USD chart, I've identified a potential entry point.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $61,500, recent low: $59,500
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $60,500? Target: $62,000, Stop loss: $59,000.`,
        isProposal: true,
        proposalType: 'buy',
        price: 60500,
      } as ExtendedMessage,
    ])

    setPendingEntry({
      id: Date.now().toString(),
      userId: getCurrentUserId(),
      side: 'buy',
      symbol: 'BTC/USD',
      price: 60500,
      time: new Date().toISOString(),
      status: 'open',
      takeProfit: 62000,
      stopLoss: 59000,
    })

    setIsSearching(false)
  }

  const handleNewsQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: input } as ExtendedMessage,
      {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: `Here are the latest Bitcoin news headlines:

1. Bitcoin price surges 5% in the last 24 hours, reaching $60,500
2. Major institutional investor announces $100M Bitcoin purchase
3. New regulatory framework for cryptocurrencies proposed in the US
4. Bitcoin mining difficulty increases by 3.4% after latest adjustment

Would you like to enter a long position based on this positive news sentiment?`,
        isProposal: true,
        proposalType: 'buy',
        price: 60500,
      } as ExtendedMessage,
    ])

    setPendingEntry({
      id: Date.now().toString(),
      userId: getCurrentUserId(),
      side: 'buy',
      symbol: 'BTC/USD',
      price: 60500,
      time: new Date().toISOString(),
      status: 'open',
    })

    setIsSearching(false)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (conversationId) {
      setIsSearching(true)
      submit(e)
      return
    }

    setIsSearching(true)

    if (input.toLowerCase().includes('entry point') || input.toLowerCase().includes('buy signal')) {
      handleEntryPointQuery()
      return
    }

    if (input.toLowerCase().includes('news') || input.toLowerCase().includes('latest')) {
      handleNewsQuery()
      return
    }

    submit(e)
  }

  return { handleSubmit, handleEntryPointQuery, handleNewsQuery }
}
