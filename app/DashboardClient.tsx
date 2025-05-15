// app/DashboardClient.tsx
// <!-- このファイルはダッシュボードページのクライアントサイドのロジックを扱います。 -->
'use client';

import { useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import ChartSection from "@/components/chart/ChartSection";
import ChatSection from "@/components/chat/section";
import PositionHistory from "@/components/position/PositionHistory";
import ChartToolbarComponent from "@/components/chart/ChartToolbar";
import {
  useRootStore,
  selectCurrentPrice,
  selectPriceChangePercent,
  selectEntries,
  selectPendingEntry,
  selectActiveTab,
} from "@/store";
import { selectCurrentSymbol, selectCurrentTimeFrame } from "@/store/chart/data/selectors";
import type { OpenEntry } from "@/types/entry";
import { MastraClient } from '@mastra/client-js';
import { useChat } from 'ai/react';

const mastraClient = new MastraClient({
  baseUrl: '/api/mastra',
});

// Propsの型を定義 (Server Componentから渡される初期データ)
interface DashboardClientProps {
  initialEntries: OpenEntry[];
  initialCurrentSymbol: string | null;
  initialCurrentTimeFrame: string;
  // 必要に応じて他の初期データを追加
}

export default function DashboardClient({ 
  initialEntries,
  initialCurrentSymbol,
  initialCurrentTimeFrame 
}: DashboardClientProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ストアの初期化 or propsからのデータ反映 (ストアの実装による)
  // useEffect(() => {
  //   useRootStore.setState(state => ({ ...state, entries: initialEntries, currentSymbol: initialCurrentSymbol, currentTimeFrame: initialCurrentTimeFrame }));
  // }, [initialEntries, initialCurrentSymbol, initialCurrentTimeFrame]);

  const entries = useRootStore(selectEntries);
  const pendingEntry = useRootStore(selectPendingEntry);
  const setPendingEntry = useRootStore((state) => state.setPendingEntry);
  const executeStoreEntry = useRootStore((state) => state.executeEntry);
  const closePosition = useRootStore((state) => state.closePosition);
  const cancelPosition = useRootStore((state) => state.cancelPosition);

  const currentSymbol = useRootStore(selectCurrentSymbol);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const fetchData = useRootStore((state) => state.fetchData);

  const currentPrice = useRootStore(selectCurrentPrice);
  const priceChangePercent = useRootStore(selectPriceChangePercent);

  const activeTab = useRootStore(selectActiveTab);
  const setActiveTab = useRootStore((state) => state.setActiveTab);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: '/api/mastra/chat',
  });

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

  useEffect(() => {
    // 初期データ取得はサーバーで行うため、ここではシンボルやタイムフレーム変更時の再取得ロジックのみを想定
    // もしinitialCurrentSymbol が null でなく、かつストアの currentSymbol と異なる場合はfetchDataを呼ぶなど。
    // あるいは、初回ロード時のfetchDataはサーバーで行い、クライアントではユーザー操作による再取得のみを担当する。
    if (currentSymbol) {
      fetchData(currentSymbol, currentTimeFrame);
    }
  }, [fetchData, currentSymbol, currentTimeFrame]);

  const handleTabChange = useCallback((value: string) => {
    if (value === "chart" || value === "positions") {
      setActiveTab(value);
    }
  }, [setActiveTab]);

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
      entries={entries} // ストアから取得したentriesを使用。初期値はprops経由でストアに反映されている想定
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
      currentSymbol={currentSymbol} // ストアから取得。初期値はprops経由でストアに反映されている想定
      currentPrice={currentPrice || 0}
      priceChangePercent={priceChangePercent || 0}
      chatSection={chatSectionComponent}
      chartSection={chartSectionComponent}
      positionsSection={positionsSectionComponent}
      toolbarSection={toolbarSectionComponent}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
} 