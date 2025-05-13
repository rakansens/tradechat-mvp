'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { StoredLog } from '@/utils/logStorage';
import { LogLevel } from '@/hooks/debug';

interface LogsPanelProps {
  logs: StoredLog[];
  activeTab: LogLevel;
  onChangeTab: (value: LogLevel) => void;
  onClearLogs: () => void;
}

/**
 * ログパネルコンポーネント
 * 
 * ログのフィルタリングと表示を担当するコンポーネント
 */
export function LogsPanel({ logs, activeTab, onChangeTab, onClearLogs }: LogsPanelProps) {
  return (
    <Tabs defaultValue="all" onValueChange={(value) => onChangeTab(value as LogLevel)}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="error">エラー</TabsTrigger>
          <TabsTrigger value="warn">警告</TabsTrigger>
          <TabsTrigger value="debug">デバッグ</TabsTrigger>
        </TabsList>
        <Button variant="destructive" size="sm" onClick={onClearLogs}>
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