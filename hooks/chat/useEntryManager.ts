import type { ExtendedMessage } from '@/types/chat/base'
import type { Entry, OpenEntry, TradeSide } from '@/types/entry'
import { useRootStore, selectLatestProposal } from '@/store'
import { getCurrentUserId } from './utils'

interface UseEntryManagerProps {
  pendingEntry: Entry | null
  setPendingEntry: (entry: OpenEntry | null) => void
  executeEntry: () => void
  setActiveTab: (tab: string) => void
  messages: ExtendedMessage[]
  setMessages: (msgs: ExtendedMessage[]) => void
}

export function useEntryManager({
  pendingEntry,
  setPendingEntry,
  executeEntry,
  setActiveTab,
  messages,
  setMessages,
}: UseEntryManagerProps) {
  const handleAIProposalQuery = () => {
    const latestProposal = useRootStore(selectLatestProposal)

    const proposalDetails = latestProposal
      ? {
          side: (latestProposal.proposalType === 'buy' ? 'buy' : 'sell') as TradeSide,
          price: latestProposal.price || 60500,
          takeProfit: latestProposal.takeProfit,
          stopLoss: latestProposal.stopLoss,
        }
      : {
          side: 'buy' as TradeSide,
          price: 60500,
          takeProfit: 62000,
          stopLoss: 59000,
        }

    setPendingEntry({
      id: Date.now().toString(),
      userId: getCurrentUserId(),
      side: proposalDetails.side,
      symbol: 'BTC/USD',
      price: proposalDetails.price,
      time: new Date().toISOString(),
      status: 'open',
      takeProfit: proposalDetails.takeProfit,
      stopLoss: proposalDetails.stopLoss,
    })

    setActiveTab('chart')
  }

  const handleProceedWithEntry = () => {
    if (pendingEntry) {
      executeEntry()
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: 'user', content: 'Proceed with the entry' } as ExtendedMessage,
        {
          id: Date.now().toString() + '-response',
          role: 'assistant',
          content: `Entry confirmed! I've opened a ${pendingEntry.side} position for you.`,
        } as ExtendedMessage,
      ])
    }
  }

  const handleCancelEntry = () => {
    setPendingEntry(null)
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: 'user', content: 'Cancel trade' } as ExtendedMessage,
      {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: "I've canceled the pending trade. Let me know if you'd like to explore other trading opportunities.",
      } as ExtendedMessage,
    ])
  }

  return { handleAIProposalQuery, handleProceedWithEntry, handleCancelEntry }
}
