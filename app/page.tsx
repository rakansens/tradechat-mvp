// app/page.tsx
// 更新: リファクタリングでレイアウトコンポーネントを使用し、コードを整理、チャートデータ取得ロジックを統合
"use client"

import { useEffect, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import ChartSection from "@/components/chart/ChartSection"
import ChatSection from "@/components/chat/ChatSection"
import PositionHistory from "@/components/position/PositionHistory"
import ChartToolbarComponent from "@/components/chart/ChartToolbar"
import {
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  selectEntries,
  selectPendingEntry,
  selectActiveTab,
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

  // エントリーストアから状態とアクションを取得（メモ化されたセレクタを使用）
  const entries = useEntryStore(selectEntries);
  const pendingEntry = useEntryStore(selectPendingEntry);
  const setPendingEntry = useEntryStore((state) => state.setPendingEntry);
  const executeStoreEntry = useEntryStore((state) => state.executeEntry);
  const closePosition = useEntryStore((state) => state.closePosition);
  const cancelPosition = useEntryStore((state) => state.cancelPosition);

  // チャートデータ関連（メモ化されたセレクタを使用）
  const currentSymbol = useChartDataStore((state) => state.currentSymbol);
  const currentTimeFrame = useChartDataStore((state) => state.currentTimeFrame);
  const fetchData = useChartDataStore((state) => state.fetchData);

  // メモ化されたセレクターを使用してデータを取得
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);

  // UIストアから状態とアクションを取得（メモ化されたセレクタを使用）
  const activeTab = useUIStore(selectActiveTab);
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

  // 新しいストアを使用してチャートデータを取得
  useEffect(() => {
    if (currentSymbol) {
      fetchData(currentSymbol, currentTimeFrame);
    }
  }, [fetchData, currentSymbol, currentTimeFrame]);

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
    <ChartToolbarComponent
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
