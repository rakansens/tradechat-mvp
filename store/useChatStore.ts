// store/useChatStore.ts
// 更新: 新しい型定義を使用するチャット関連の状態管理ストア
// 更新: input、setInput、sendMessageなどの機能を追加

import { create } from "zustand";
import { devtools } from "zustand/middleware";
// 分割されたチャートストアをインポート
import { useChartDataStore } from "./chart";
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
      input: "", // 入力フィールドの初期値

      // アクション
      setMessages: (messages) => set({ messages }),

      addMessage: (message) => {
        const { messages } = get();
        set({ messages: [...messages, message] });
      },

      setIsSearching: (isSearching) => set({ isSearching }),
      
      // 入力フィールドの値を設定
      setInput: (input) => set({ input }),
      
      // メッセージを送信
      sendMessage: async (message) => {
        const { messages } = get();
        
        // ユーザーメッセージを追加
        const userMessage: ExtendedMessage = {
          id: Date.now().toString(),
          role: "user",
          content: message,
        };
        
        set({
          messages: [...messages, userMessage],
          input: "", // 入力フィールドをクリア
          isSearching: true // 検索中状態に設定
        });
        
        try {
          // AIの応答用メッセージを事前に作成（ストリーミング用）
          const aiResponseId = Date.now().toString() + "-response";
          const aiResponse: ExtendedMessage = {
            id: aiResponseId,
            role: "assistant",
            content: "",
            isStreaming: true, // ストリーミング中フラグを設定
          };
          
          // 空のAI応答メッセージを追加
          set({
            messages: [...get().messages, aiResponse]
          });
          
          // MASTRAのAPIエンドポイントを使用
          const response = await fetch('/api/mastra/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            }),
          });
          
          if (!response.ok) {
            throw new Error('APIリクエストに失敗しました');
          }
          
          // レスポンスをストリームとして読み込む
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('レスポンスボディを読み取れません');
          }
          
          // テキストデコーダーを作成
          const decoder = new TextDecoder();
          let accumulatedContent = ""; // 累積コンテンツ
          
          // ストリームを読み込む
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // バイナリデータをテキストに変換
            const chunk = decoder.decode(value, { stream: true });
            
            // 0:"文字" 形式のパターンを検出
            const charMatches = chunk.match(/0:"([^"]*)"/g);
            if (charMatches && charMatches.length > 0) {
              // 各文字を処理
              for (const match of charMatches) {
                const char = match.match(/0:"([^"]*)"/);
                if (char) {
                  // 文字を累積コンテンツに追加
                  accumulatedContent += char[1];
                  
                  // メッセージを更新
                  set(state => {
                    const updatedMessages = state.messages.map(msg =>
                      msg.id === aiResponseId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    );
                    return { messages: updatedMessages };
                  });
                }
              }
            } else {
              // 従来の "data: {"text":"..."}" 形式のストリーミングデータを処理
              const matches = chunk.match(/data: ({.*?})/g);
              if (matches && matches.length > 0) {
                try {
                  // 最後のデータチャンクを取得
                  const lastChunk = matches[matches.length - 1].replace('data: ', '');
                  const chunkData = JSON.parse(lastChunk);
                  const chunkContent = chunkData.text || chunkData.content || "";
                  
                  // コンテンツを更新
                  accumulatedContent = chunkContent;
                  
                  // メッセージを更新
                  set(state => {
                    const updatedMessages = state.messages.map(msg =>
                      msg.id === aiResponseId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    );
                    return { messages: updatedMessages };
                  });
                } catch (chunkError) {
                  console.log('チャンク抽出エラー:', chunkError);
                }
              }
            }
          }
          
          // ストリーミング完了後、isStreamingフラグをfalseに設定
          set(state => {
            const updatedMessages = state.messages.map(msg =>
              msg.id === aiResponseId
                ? { ...msg, isStreaming: false }
                : msg
            );
            return {
              messages: updatedMessages,
              isSearching: false
            };
          });
          
          // エントリーポイントの提案を検出
          if (aiResponse.content.includes("enter") || 
              aiResponse.content.includes("position") || 
              aiResponse.content.includes("buy") || 
              aiResponse.content.includes("sell")) {
            
            // 価格を抽出
            const priceMatch = aiResponse.content.match(/\$(\d+,?\d*)/);
            const price = priceMatch
              ? Number.parseFloat(priceMatch[1].replace(",", ""))
              : 60500; // デフォルト価格
            
            // 買いか売りかを判断
            const isBuy = !aiResponse.content.includes("sell") && !aiResponse.content.includes("short");
            
            // エントリーストアのアクションを呼び出し
            useEntryStore.getState().setPendingEntry({
              id: Date.now().toString(),
              side: isBuy ? "buy" : "sell",
              symbol: "BTC/USD",
              price: price,
              time: new Date().toISOString(),
              status: "open",
            });
          }
          
        } catch (error) {
          console.error('チャットAPIエラー:', error);
          
          // エラー時のフォールバック応答
          const errorResponse: ExtendedMessage = {
            id: Date.now().toString() + "-error",
            role: "assistant",
            content: "申し訳ありませんが、応答の生成中にエラーが発生しました。もう一度お試しください。",
            isStreaming: false,
          };
          
          set({
            messages: [...get().messages, errorResponse],
            isSearching: false
          });
        }
      },
      
      // メッセージをクリア
      clearMessages: () => set({ 
        messages: initialMessages.slice(0, 1) // ウェルカムメッセージのみ残す
      }),
      
      // メッセージを更新
      updateMessage: (id, updatedMessage) => {
        const { messages } = get();
        const updatedMessages = messages.map(msg => 
          msg.id === id ? { ...msg, ...updatedMessage } : msg
        );
        set({ messages: updatedMessages });
      },
      
      // メッセージを削除
      deleteMessage: (id) => {
        const { messages } = get();
        const filteredMessages = messages.filter(msg => msg.id !== id);
        set({ messages: filteredMessages });
      },

      handleEntryPointQuery: () => {
        const { messages } = get();
        // チャートデータストアからデータを取得
        const data = useChartDataStore.getState().data;
        const currentPrice = data[data.length - 1].close;

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
        // チャートデータストアからデータを取得
        const data = useChartDataStore.getState().data;
        const currentPrice = data[data.length - 1].close;
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
