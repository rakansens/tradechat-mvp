// store/useChatStore.ts
// 更新: 新しい型定義を使用するチャット関連の状態管理ストア

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useChartStore } from "./useChartStore";
import { useEntryStore } from "./useEntryStore";
import type { ChatState, ExtendedMessage, ProposalType } from "@/types/chat";
import type { OpenEntry } from "@/types/entry";


// 初期メッセージの設定
const initialMessages: ExtendedMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to AlphaTrader! I'm your AI trading assistant. How can I help you analyze the market today?",
  },
  {
    id: "ai-proposal-1",
    role: "assistant",
    content: `I've analyzed the Bitcoin chart and detected a potential buy signal.

Technical Analysis:
• Price has broken above the 50-day moving average
• Recent higher highs and higher lows
• Volume is trending upward

Would you like to enter a long position at the current price of $60,500?`,
    isProposal: true,
    proposalType: "buy",
    price: 60500,
  },
];

// チャットストアの作成
export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      messages: initialMessages,
      isSearching: false,

      // アクション
      setMessages: (messages) => set({ messages }),

      addMessage: (message) => {
        const { messages } = get();
        set({ messages: [...messages, message] });
      },

      setIsSearching: (isSearching) => set({ isSearching }),

      handleEntryPointQuery: () => {
        const { messages } = get();
        // チャートストアからデータを取得
        const ohlcData = useChartStore.getState().ohlcData;
        const currentPrice = ohlcData[ohlcData.length - 1].close;

        const userMessage: ExtendedMessage = {
          id: Date.now().toString(),
          role: "user",
          content: "Entry Point",
        };

        const aiResponse: ExtendedMessage = {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: `Based on my analysis of the current chart, Bitcoin is in a short-term uptrend.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $${(currentPrice * 1.02).toFixed(0)}, recent low: $${(currentPrice * 0.98).toFixed(0)}
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $${currentPrice.toLocaleString()}? Target: $${(currentPrice * 1.05).toFixed(0)}, Stop loss: $${(currentPrice * 0.98).toFixed(0)}.`,
          isProposal: true,
          proposalType: "buy",
          price: currentPrice,
        };

        // エントリーストアのアクションを呼び出し
        useEntryStore.getState().setPendingEntry({
          id: Date.now().toString(),
          side: "buy",
          symbol: "BTC/USD",
          price: currentPrice,
          time: new Date().toISOString(),
          status: "open",
        });

        set({
          messages: [...messages, userMessage, aiResponse],
        });
      },

      handleNewsQuery: () => {
        const { messages } = get();

        const userMessage: ExtendedMessage = {
          id: Date.now().toString(),
          role: "user",
          content: "Market News",
        };

        set({ isSearching: true });

        // ニュース取得のシミュレーション（API遅延）
        setTimeout(() => {
          const aiResponse: ExtendedMessage = {
            id: Date.now().toString() + "-response",
            role: "assistant",
            content: `Here's the latest Bitcoin market news:

1. Bitcoin price has risen 5% in the last 24 hours, currently trading around $61,200.
2. U.S. regulators are considering a new regulatory framework for crypto assets.
3. Major institutional investors have increased their Bitcoin positions.
4. Technical analysis shows Bitcoin trading above its 50-day moving average, indicating a bullish signal.
5. Market volatility has decreased by 20% compared to last week.

Based on these developments, the short-term trend appears bullish, but watch for regulatory news that could impact the market.`,
          };

          set({
            messages: [...get().messages, userMessage, aiResponse],
            isSearching: false,
          });
        }, 1500);
      },

      handleAIProposalQuery: () => {
        const { messages } = get();
        // チャートストアからデータを取得
        const ohlcData = useChartStore.getState().ohlcData;
        const currentPrice = ohlcData[ohlcData.length - 1].close;
        const randomPrice = Math.floor(currentPrice * (0.98 + Math.random() * 0.04));
        const isBuy = Math.random() > 0.5;

        const userMessage: ExtendedMessage = {
          id: Date.now().toString(),
          role: "user",
          content: "AI Signal",
        };

        // シグナル生成のシミュレーション（API遅延）
        setTimeout(() => {
          const aiResponse: ExtendedMessage = {
            id: Date.now().toString() + "-proposal",
            role: "assistant",
            content: `I've detected a ${isBuy ? "BUY" : "SELL"} signal!

Technical Analysis:
• ${isBuy ? "Uptrend forming" : "Downtrend forming"}
• ${isBuy ? "RSI rising but not yet overbought" : "RSI falling but not yet oversold"}
• ${isBuy ? "Price bouncing off support level" : "Price rejecting at resistance level"}

Would you like to enter a ${isBuy ? "long" : "short"} position at the current price of $${randomPrice.toLocaleString()}?`,
            isProposal: true,
            proposalType: isBuy ? "buy" : "sell",
            price: randomPrice,
          };

          // エントリーストアのアクションを呼び出し
          useEntryStore.getState().setPendingEntry({
            id: Date.now().toString(),
            side: isBuy ? "buy" : "sell",
            symbol: "BTC/USD",
            price: randomPrice,
            time: new Date().toISOString(),
            status: "open",
          });

          set({
            messages: [...get().messages, userMessage, aiResponse],
          });
        }, 1000);
      },
    }),
    { name: "chat-store" }
  )
);
