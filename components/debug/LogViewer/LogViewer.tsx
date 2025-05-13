'use client';

// components/debug/LogViewer/LogViewer.tsx
// LogViewerコンポーネントのリファクタリング版
// 複数のサブコンポーネントとカスタムフックに分割された実装

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogs, useDebugStores, useDebugPolling, LogLevel } from '@/hooks/debug';
import { 
  DebugModeSwitch, 
  LogsPanel,
  FetchesPanel,
  PollingStatusPanel,
  SymbolHistoryPanel,
  CacheStatsPanel
} from '.';

export default function LogViewer() {
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warn' | 'debug'>('all');
  const [activeFetches, setActiveFetches] = useState<any[]>([]);
  const [pollingStatus, setPollingStatus] = useState<any>({});
  const [symbolHistory, setSymbolHistory] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  
  // useLogsフックを使用してログ管理機能を取得
  const { logs, refreshLogs, handleClearLogs } = useLogs(activeTab);
  
  // useDebugStoresフックを使用してデバッグ関連機能を取得
  const { isDebugMode, toggleDebugMode, refreshDebugInfo } = useDebugStores();
  
  // デバッグ情報を表示に適用する関数
  const updateDebugDisplay = () => {
    const debugInfo = refreshDebugInfo();
    setActiveFetches(debugInfo.activeFetches);
    setPollingStatus(debugInfo.pollingStatus);
    setSymbolHistory(debugInfo.symbolHistory);
    setCacheStats(debugInfo.cacheStats);
    setRequestHistory(debugInfo.requestHistory);
  };
  
  // useDebugPollingフックを使用してポーリングを管理
  useDebugPolling({
    isDebugMode,
    refreshFunctions: [refreshLogs, updateDebugDisplay],
    interval: 2000
  });
  
  // コンポーネントマウント時に初回データ取得
  useEffect(() => {
    refreshLogs();
    updateDebugDisplay();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>デバッグパネル</CardTitle>
            <CardDescription>
              アプリケーションのデバッグ情報とログを表示します
            </CardDescription>
          </div>
          <DebugModeSwitch isDebugMode={isDebugMode} onToggle={toggleDebugMode} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="logs">ログ</TabsTrigger>
            <TabsTrigger value="fetches">フェッチリクエスト</TabsTrigger>
            <TabsTrigger value="polling">ポーリング状態</TabsTrigger>
            <TabsTrigger value="symbols">シンボル履歴</TabsTrigger>
            <TabsTrigger value="cache">キャッシュ</TabsTrigger>
          </TabsList>
          
          {/* ログタブ - リファクタリングされたLogsPanelコンポーネントを使用 */}
          <TabsContent value="logs" className="mt-4">
            <LogsPanel 
              logs={logs}
              activeTab={activeTab}
              onChangeTab={(value: LogLevel) => setActiveTab(value)}
              onClearLogs={handleClearLogs}
            />
          </TabsContent>
          
          {/* フェッチリクエストタブ - リファクタリングされたFetchesPanelコンポーネントを使用 */}
          <TabsContent value="fetches" className="mt-4">
            <FetchesPanel 
              activeFetches={activeFetches}
              requestHistory={requestHistory}
            />
          </TabsContent>
          
          {/* ポーリング状態タブ - リファクタリングされたPollingStatusPanelコンポーネントを使用 */}
          <TabsContent value="polling" className="mt-4">
            <PollingStatusPanel 
              pollingStatus={pollingStatus}
            />
          </TabsContent>
          
          {/* シンボル履歴タブ - リファクタリングされたSymbolHistoryPanelコンポーネントを使用 */}
          <TabsContent value="symbols" className="mt-4">
            <SymbolHistoryPanel 
              symbolHistory={symbolHistory}
            />
          </TabsContent>
          
          {/* キャッシュタブ - リファクタリングされたCacheStatsPanelコンポーネントを使用 */}
          <TabsContent value="cache" className="mt-4">
            <CacheStatsPanel 
              cacheStats={cacheStats}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 