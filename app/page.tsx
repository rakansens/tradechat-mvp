// app/page.tsx
// 更新: リファクタリングでレイアウトコンポーネントを使用し、コードを整理
"use client"

import { useEffect, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import ChartSection from "@/components/chart/ChartSection"
import ChatSection from "@/components/chat/ChatSection"
import PositionHistory from "@/components/position/PositionHistory"
import ChartToolbar from "@/components/chart/ChartToolbar"
import { 
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  // その他のストア
  useEntryStore, 
  useUIStore 
} from "@/store"
import type { OpenEntry } from "@/types/entry"
import { MastraClient } from '@mastra/client-js'; 
import { useChat } from 'ai/react'; 

const mastraClient = new MastraClient({ 
  baseUrl: '/api/mastra', 
});

export default function Home() {
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // エントリーストアから状態とアクションを取得
  const entries = useEntryStore((state) => state.entries);
  const pendingEntry = useEntryStore((state) => state.pendingEntry);
  const setPendingEntry = useEntryStore((state) => state.setPendingEntry);
  const executeStoreEntry = useEntryStore((state) => state.executeEntry);
  const closePosition = useEntryStore((state) => state.closePosition);
  const cancelPosition = useEntryStore((state) => state.cancelPosition);
  
  // チャートデータ関連
  const { 
    currentSymbol,
    currentTimeFrame,
    fetchData,
  } = useChartDataStore();
  
  // メモ化されたセレクターを使用してデータを取得
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);
  
  // UIストアから状態とアクションを取得
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  // --- AI SDK useChat Hook for Chat State and API Interaction ---
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading 
  } = useChat({
    api: '/api/mastra/chat', 
  });

  // --- Wrappers for Store Actions passed to ChatSection ---
  const handleExecuteTrade = useCallback(() => {
    console.log('Executing trade:', pendingEntry);
    executeStoreEntry(); 
  }, [executeStoreEntry, pendingEntry]);

  const handleEditSubmit = useCallback((updatedEntry: OpenEntry) => {
    console.log('Updating pending entry:', updatedEntry);
    setPendingEntry(updatedEntry); 
  }, [setPendingEntry]);

  const handleCancelPendingEntry = useCallback(() => {
    console.log('Cancelling pending entry');
    setPendingEntry(null); 
  }, [setPendingEntry]);

  // データ取得用エフェクト
  useEffect(() => {
    // 初回マウント時のみデータを取得し、以降はChartSectionのuseEffectに任せる
    // これにより無限レンダリングループを防止
  }, []);

  // 型安全なタブ切り替えハンドラー
  const handleTabChange = useCallback((value: string) => {
    // 型安全な方法で値を渡す、activeTabの値を制限する
    if (value === "chart" || value === "positions") {
      setActiveTab(value);
    }
  }, [setActiveTab]);

  // コンポーネントをレンダリング前に事前計算
  const chatSectionComponent = (
    <ChatSection
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      pendingEntry={pendingEntry}
      chatEndRef={chatEndRef as React.RefObject<HTMLDivElement>}
      executeEntry={handleExecuteTrade}
      editPendingEntry={handleEditSubmit}
      cancelPendingEntry={handleCancelPendingEntry}
    />
  );

  const chartSectionComponent = <ChartSection />;
  
  const positionsSectionComponent = (
    <PositionHistory 
      entries={entries} 
      onClosePosition={closePosition} 
      onCancelPosition={cancelPosition} 
    />
  );

  const toolbarSectionComponent = (
    <ChartToolbar 
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );

  return (
    <MainLayout
      // ヘッダー用データ
      currentSymbol={currentSymbol}
      currentPrice={currentPrice}
      priceChangePercent={priceChangePercent}
      
      // コンテンツセクション
      chatSection={chatSectionComponent}
      chartSection={chartSectionComponent}
      positionsSection={positionsSectionComponent}
      toolbarSection={toolbarSectionComponent}
      
      // UI状態
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  )
}
