'use client';

// components/LogViewer.tsx
// 更新: デバッグ機能の追加
// このコンポーネントはローカルストレージに保存されたログを表示し、
// アクティブなフェッチリクエスト、ポーリング状態、シンボル変更履歴などのデバッグ情報を提供します

import { useState, useEffect, useCallback } from 'react';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { cacheService } from '@/services/cache';
import { requestHistoryService } from '@/services/history';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function LogViewer() {
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warn' | 'debug'>('all');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [activeFetches, setActiveFetches] = useState<any[]>([]);
  const [pollingStatus, setPollingStatus] = useState<any>({});
  const [symbolHistory, setSymbolHistory] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  
  // AppStoreからデバッグ関連の状態と関数を取得
  const isDebugMode = useAppStore(state => state.isDebugMode);
  const toggleDebugMode = useAppStore(state => state.toggleDebugMode);
  const getActiveFetchesInfo = useAppStore(state => state.getActiveFetchesInfo);
  const getPollingStatus = useAppStore(state => state.getPollingStatus);
  const getSymbolChangeHistory = useAppStore(state => state.getSymbolChangeHistory);
  
  // デバッグ情報を更新する関数
  const refreshDebugInfo = useCallback(() => {
    if (isDebugMode) {
      // AppStoreからデバッグ情報を取得
      setActiveFetches(getActiveFetchesInfo());
      setPollingStatus(getPollingStatus());
      setSymbolHistory(getSymbolChangeHistory());
      
      // 新しいサービスからデバッグ情報を取得
      try {
        setCacheStats(cacheService.getStats());
        setRequestHistory(requestHistoryService.getHistory());
      } catch (e) {
        console.error('Failed to get debug info from services', e);
      }
    }
  }, [isDebugMode, getActiveFetchesInfo, getPollingStatus, getSymbolChangeHistory]);
  
  // コンポーネントマウント時とタブ切り替え時にログを取得
  useEffect(() => {
    refreshLogs();
    refreshDebugInfo();
  }, [activeTab, refreshDebugInfo]);
  
  // ログを取得して状態を更新
  const refreshLogs = () => {
    const allLogs = getStoredLogs();
    
    // タブに応じてフィルタリング
    let filteredLogs = allLogs;
    if (activeTab === 'error') {
      filteredLogs = allLogs.filter(log => log.level === 'error');
    } else if (activeTab === 'warn') {
      filteredLogs = allLogs.filter(log => log.level === 'warn');
    }
    
    setLogs(filteredLogs);
  };
  
  // 定期的な更新を設定
  useEffect(() => {
    if (isDebugMode) {
      const intervalId = setInterval(() => {
        refreshLogs();
        refreshDebugInfo();
      }, 2000); // 2秒ごとに更新
      
      setRefreshInterval(intervalId as unknown as number);
      
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isDebugMode, refreshDebugInfo]);
  
  // ログをクリア
  const handleClearLogs = () => {
    clearStoredLogs();
    setLogs([]);
  };
  
  // ログレベルに応じたバッジの色を返す
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'warning';
      case 'info':
        return 'secondary';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };

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
          <div className="flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={isDebugMode}
              onCheckedChange={toggleDebugMode}
            />
            <Label htmlFor="debug-mode">デバッグモード</Label>
          </div>
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
          
          {/* ログタブ */}
          <TabsContent value="logs" className="mt-4">
            <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as 'all' | 'error' | 'warn' | 'debug')}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="error">エラー</TabsTrigger>
                  <TabsTrigger value="warn">警告</TabsTrigger>
                  <TabsTrigger value="debug">デバッグ</TabsTrigger>
                </TabsList>
                <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                  ログをクリア
                </Button>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <LogList logs={logs} />
              </TabsContent>
              <TabsContent value="error" className="mt-0">
                <LogList logs={logs} />
              </TabsContent>
              <TabsContent value="warn" className="mt-0">
                <LogList logs={logs} />
              </TabsContent>
              <TabsContent value="debug" className="mt-0">
                <LogList logs={logs} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* フェッチリクエストタブ */}
          <TabsContent value="fetches" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">アクティブなフェッチリクエスト</h3>
              <p className="text-sm text-gray-500">現在進行中のAPIリクエスト</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>リクエスト種別</TableHead>
                  <TableHead>シンボル</TableHead>
                  <TableHead>取引種別</TableHead>
                  <TableHead>実行時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeFetches.length > 0 ? (
                  activeFetches.map((fetch, index) => (
                    <TableRow key={index}>
                      <TableCell>{fetch.type}</TableCell>
                      <TableCell>{fetch.symbol}</TableCell>
                      <TableCell>{fetch.exchangeType}</TableCell>
                      <TableCell>{fetch.duration ? `${Math.round(fetch.duration / 1000)}秒` : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">アクティブなリクエストはありません</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            <div className="mt-8 mb-4">
              <h3 className="text-lg font-medium">リクエスト履歴</h3>
              <p className="text-sm text-gray-500">最近のAPIリクエスト（最大50件）</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>リクエストキー</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>所要時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestHistory.length > 0 ? (
                  requestHistory.map((req, index) => (
                    <TableRow key={index}>
                      <TableCell>{req.key}</TableCell>
                      <TableCell>
                        <Badge variant={
                          req.status === 'completed' ? 'default' :
                          req.status === 'error' ? 'destructive' :
                          req.status === 'aborted' ? 'outline' : 'secondary'
                        }>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{req.duration ? `${req.duration}ms` : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">リクエスト履歴はありません</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          {/* ポーリング状態タブ */}
          <TabsContent value="polling" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">ポーリング状態</h3>
              <p className="text-sm text-gray-500">自動更新の状態</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">オーダーブックポーリング</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">ステータス:</span>
                      <Badge variant={pollingStatus?.orderbook?.active ? 'default' : 'outline'}>
                        {pollingStatus?.orderbook?.active ? 'アクティブ' : '停止中'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">更新間隔:</span>
                      <span>{pollingStatus?.orderbook?.interval ? `${pollingStatus.orderbook.interval / 1000}秒` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">最終更新:</span>
                      <span>
                        {pollingStatus?.orderbook?.lastPollTime
                          ? new Date(pollingStatus.orderbook.lastPollTime).toLocaleTimeString()
                          : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">チャートデータポーリング</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">ステータス:</span>
                      <Badge variant={pollingStatus?.chart?.active ? 'default' : 'outline'}>
                        {pollingStatus?.chart?.active ? 'アクティブ' : '停止中'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">更新間隔:</span>
                      <span>{pollingStatus?.chart?.interval ? `${pollingStatus.chart.interval / 1000}秒` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">最終更新:</span>
                      <span>
                        {pollingStatus?.chart?.lastPollTime
                          ? new Date(pollingStatus.chart.lastPollTime).toLocaleTimeString()
                          : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* シンボル履歴タブ */}
          <TabsContent value="symbols" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">シンボル変更履歴</h3>
              <p className="text-sm text-gray-500">最近のシンボル変更（最新20件）</p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>変更前</TableHead>
                  <TableHead>変更後</TableHead>
                  <TableHead>変更理由</TableHead>
                  <TableHead>日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symbolHistory.length > 0 ? (
                  symbolHistory.map((change, index) => (
                    <TableRow key={index}>
                      <TableCell>{change.from || '-'}</TableCell>
                      <TableCell>{change.to}</TableCell>
                      <TableCell>{change.reason || '-'}</TableCell>
                      <TableCell>{new Date(change.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">シンボル変更履歴はありません</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          {/* キャッシュタブ */}
          <TabsContent value="cache" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">キャッシュ統計</h3>
              <p className="text-sm text-gray-500">
                キャッシュエントリ数: {cacheStats?.totalEntries || 0}
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cache-entries">
                <AccordionTrigger>キャッシュエントリ</AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>キー</TableHead>
                        <TableHead>経過時間</TableHead>
                        <TableHead>状態</TableHead>
                        <TableHead>有効期限</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cacheStats?.entries?.length > 0 ? (
                        cacheStats.entries.map((entry: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{entry.key}</TableCell>
                            <TableCell>{Math.round(entry.age / 1000)}秒</TableCell>
                            <TableCell>
                              <Badge variant={entry.isExpired ? 'destructive' : 'default'}>
                                {entry.isExpired ? '期限切れ' : '有効'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entry.isExpired ? '期限切れ' : `${Math.round(entry.expiresIn / 1000)}秒後`}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">キャッシュエントリはありません</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ログリストコンポーネント
function LogList({ logs }: { logs: StoredLog[] }) {
  if (logs.length === 0) {
    return <div className="text-center py-8 text-gray-400">保存されたログはありません</div>;
  }
  
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {logs.map((log, index) => (
          <LogItem key={index} log={log} />
        ))}
      </div>
    </ScrollArea>
  );
}

// 個別のログアイテムコンポーネント
function LogItem({ log }: { log: StoredLog }) {
  const [expanded, setExpanded] = useState(false);
  
  // ログレベルに応じたバッジの色を返す
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'warning';
      case 'info':
        return 'secondary';
      case 'debug':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  return (
    <div className={`p-4 rounded-lg border ${log.level === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' : log.level === 'warn' ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-gray-800/50 border-gray-700 text-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <Badge variant={getBadgeVariant(log.level) as any} className="mb-1">
            {log.level.toUpperCase()}
          </Badge>
          <div className="text-sm font-medium">{log.message}</div>
        </div>
        <div className="text-xs text-gray-400">
          {new Date(log.timestamp).toLocaleString()}
        </div>
      </div>
      
      {(log.context || log.error) && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs mt-1 p-0 h-auto"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '詳細を隠す' : '詳細を表示'}
        </Button>
      )}
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {log.context && (
            <div>
              <div className="text-xs font-medium mb-1 text-gray-300">コンテキスト:</div>
              <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}
          
          {log.error && (
            <div>
              <div className="text-xs font-medium mb-1 text-red-400">エラー詳細:</div>
              <pre className="text-xs bg-gray-800 text-red-300 p-2 rounded overflow-x-auto">
                {log.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
