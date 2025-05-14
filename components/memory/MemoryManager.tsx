"use client"

// components/memory/MemoryManager.tsx
// Mem0メモリ管理UIコンポーネント
// 作成日: 2025/5/31

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Trash2, RefreshCw, Plus } from "lucide-react";
import { theme } from "@/styles/colors";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Empty } from "@/components/ui/Empty";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, 
         AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
         AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// メモリの型定義
interface Memory {
  id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  external_id: string | null;
  is_synced: boolean;
}

/**
 * メモリ管理コンポーネント
 */
export default function MemoryManager() {
  // 状態管理
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [deleteMemoryId, setDeleteMemoryId] = useState<string | null>(null);
  const { toast } = useToast();

  // メモリデータを取得
  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/memories");
      if (!response.ok) {
        throw new Error("メモリデータの取得に失敗しました");
      }
      const data = await response.json();
      setMemories(data);
      applyFilters(data, searchTerm, activeTab);
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモリデータの取得中にエラーが発生しました",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchMemories();
  }, []);

  // 検索とフィルターを適用
  const applyFilters = (memories: Memory[], search: string, tab: string) => {
    let filtered = [...memories];
    
    // 検索フィルター
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(memory => 
        memory.content.toLowerCase().includes(searchLower)
      );
    }
    
    // タブフィルター
    if (tab === "synced") {
      filtered = filtered.filter(memory => memory.is_synced);
    } else if (tab === "local") {
      filtered = filtered.filter(memory => !memory.is_synced);
    }
    
    setFilteredMemories(filtered);
  };

  // 検索ハンドラー
  const handleSearch = () => {
    applyFilters(memories, searchTerm, activeTab);
  };

  // 検索実行（Enter押下時）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // タブ切り替えハンドラー
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    applyFilters(memories, searchTerm, value);
  };

  // メモリ削除ハンドラー
  const handleDeleteMemory = async (id: string) => {
    try {
      const response = await fetch(`/api/memories?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("メモリの削除に失敗しました");
      }
      
      // 成功メッセージを表示
      toast({
        title: "削除完了",
        description: "メモリが正常に削除されました",
      });
      
      // 削除後、リストを更新
      fetchMemories();
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモリの削除中にエラーが発生しました",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      // 削除ダイアログを閉じる
      setDeleteMemoryId(null);
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card 
      className="h-full w-full border overflow-hidden"
      style={{ backgroundColor: theme.background.secondary }}
    >
      <CardHeader className="py-3 px-4 border-b" style={{ borderColor: theme.border.light }}>
        <CardTitle className="text-xl font-semibold flex items-center">
          <span>メモリ管理</span>
        </CardTitle>
      </CardHeader>

      <div className="px-4 py-3 border-b" style={{ borderColor: theme.border.light }}>
        <div className="flex space-x-2 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background pr-8"
            />
            <Search 
              className="h-4 w-4 absolute top-2.5 right-3 text-muted-foreground opacity-70" 
              onClick={handleSearch}
            />
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={fetchMemories}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="pb-0"
      >
        <div className="px-4 pt-2 pb-0">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="synced">同期済み</TabsTrigger>
            <TabsTrigger value="local">ローカルのみ</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="pt-0 mt-0">
          <MemoryList 
            memories={filteredMemories} 
            isLoading={isLoading} 
            formatDate={formatDate}
            onDelete={(id) => setDeleteMemoryId(id)}
          />
        </TabsContent>
        <TabsContent value="synced" className="pt-0 mt-0">
          <MemoryList 
            memories={filteredMemories} 
            isLoading={isLoading} 
            formatDate={formatDate}
            onDelete={(id) => setDeleteMemoryId(id)}
          />
        </TabsContent>
        <TabsContent value="local" className="pt-0 mt-0">
          <MemoryList 
            memories={filteredMemories} 
            isLoading={isLoading} 
            formatDate={formatDate}
            onDelete={(id) => setDeleteMemoryId(id)}
          />
        </TabsContent>
      </Tabs>

      {/* 削除確認ダイアログ */}
      {deleteMemoryId && (
        <AlertDialog open={!!deleteMemoryId} onOpenChange={() => setDeleteMemoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>本当にこのメモリを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。メモリはデータベースから完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMemoryId && handleDeleteMemory(deleteMemoryId)}
                className="bg-red-600 hover:bg-red-700"
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

// メモリリストコンポーネント
interface MemoryListProps {
  memories: Memory[];
  isLoading: boolean;
  formatDate: (date: string) => string;
  onDelete: (id: string) => void;
}

function MemoryList({ memories, isLoading, formatDate, onDelete }: MemoryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (memories.length === 0) {
    return <Empty message="メモリが見つかりません" className="h-64" />;
  }

  return (
    <CardContent className="p-3 space-y-3">
      {memories.map((memory) => (
        <Card 
          key={memory.id} 
          className="p-3 hover:bg-muted/50 transition"
        >
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={memory.is_synced ? "default" : "secondary"}>
                {memory.is_synced ? "同期済み" : "ローカル"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(memory.created_at)}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0" 
              onClick={() => onDelete(memory.id)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              <span className="sr-only">削除</span>
            </Button>
          </div>
          <div className="mt-2 text-sm">
            {memory.content}
          </div>
          {Object.keys(memory.metadata).length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">メタデータ:</span>{" "}
              {JSON.stringify(memory.metadata)}
            </div>
          )}
        </Card>
      ))}
    </CardContent>
  );
} 