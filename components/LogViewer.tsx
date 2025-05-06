'use client';

// components/LogViewer.tsx
// 作成: ログビューアーコンポーネント
// このコンポーネントはローカルストレージに保存されたログを表示します

import { useState, useEffect } from 'react';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LogViewer() {
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warn'>('all');
  
  // コンポーネントマウント時とタブ切り替え時にログを取得
  useEffect(() => {
    refreshLogs();
  }, [activeTab]);
  
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
        <CardTitle>アプリケーションログ</CardTitle>
        <CardDescription>
          エラーと警告のログがローカルストレージに保存されています
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as 'all' | 'error' | 'warn')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="error">エラー</TabsTrigger>
              <TabsTrigger value="warn">警告</TabsTrigger>
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
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ログリストコンポーネント
function LogList({ logs }: { logs: StoredLog[] }) {
  if (logs.length === 0) {
    return <div className="text-center py-8 text-gray-500">保存されたログはありません</div>;
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
    <div className={`p-4 rounded-lg border ${log.level === 'error' ? 'bg-red-50 border-red-200' : log.level === 'warn' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <Badge variant={getBadgeVariant(log.level) as any} className="mb-1">
            {log.level.toUpperCase()}
          </Badge>
          <div className="text-sm font-medium">{log.message}</div>
        </div>
        <div className="text-xs text-gray-500">
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
              <div className="text-xs font-medium mb-1">コンテキスト:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          )}
          
          {log.error && (
            <div>
              <div className="text-xs font-medium mb-1 text-red-600">エラー詳細:</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {log.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
