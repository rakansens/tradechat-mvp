'use client';

// components/debug/LogViewer.tsx
// 更新: ドメイン駆動設計に基づくリファクタリング
// このコンポーネントはローカルストレージに保存されたログを表示し、
// アクティブなフェッチリクエスト、ポーリング状態、シンボル変更履歴などのデバッグ情報を提供します

import { useEffect } from 'react';
import { useDebugPanel } from '@/hooks/useDebugPanel';
import { LogItem } from './LogItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function LogViewer() {
  const {
    logs,
    activeTab,
    setActiveTab,
    activeFetches,
    pollingStatus,
    symbolHistory,
    cacheStats,
    requestHistory,
    isDebugMode,
    toggleDebugMode,
    refreshLogs,
    refreshDebugInfo,
    handleClearLogs
  } = useDebugPanel();
  
  // コンポーネントマウント時とタブ切り替え時にログを取得
  useEffect(() => {
    refreshLogs();
    refreshDebugInfo();
  }, [activeTab, refreshDebugInfo, refreshLogs]);
  
  // ログリストコンポーネント (インライン関数)
  function renderLogList() {
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
  
  // ログタブレンダリング
  function renderLogsTab() {
    return (
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
          {renderLogList()}
        </TabsContent>
        <TabsContent value="error" className="mt-0">
          {renderLogList()}
        </TabsContent>
        <TabsContent value="warn" className="mt-0">
          {renderLogList()}
        </TabsContent>
        <TabsContent value="debug" className="mt-0">
          {renderLogList()}
        </TabsContent>
      </Tabs>
    );
  }
  
  // フェッチリクエストタブレンダリング
  function renderFetchesTab() {
    return (
      <>
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
      </>
    );
  }

  // ポーリング状態タブレンダリング
  function renderPollingTab() {
    return (
      <>
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
      </>
    );
  }

  // シンボル履歴タブレンダリング
  function renderSymbolsTab() {
    return (
      <>
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
      </>
    );
  }

  // キャッシュタブレンダリング
  function renderCacheTab() {
    return (
      <>
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
      </>
    );
  }
  
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
            {renderLogsTab()}
          </TabsContent>
          
          {/* フェッチリクエストタブ */}
          <TabsContent value="fetches" className="mt-4">
            {renderFetchesTab()}
          </TabsContent>
          
          {/* ポーリング状態タブ */}
          <TabsContent value="polling" className="mt-4">
            {renderPollingTab()}
          </TabsContent>
          
          {/* シンボル履歴タブ */}
          <TabsContent value="symbols" className="mt-4">
            {renderSymbolsTab()}
          </TabsContent>
          
          {/* キャッシュタブ */}
          <TabsContent value="cache" className="mt-4">
            {renderCacheTab()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 