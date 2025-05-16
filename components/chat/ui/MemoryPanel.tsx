"use client"

// components/chat/ui/MemoryPanel.tsx
// チャット統合用メモリパネルコンポーネント
// 作成日: 2025/5/31
// 更新日: 2025/5/31 - ヘッダー下部に表示されるスタイルに変更
// 更新日: 2025/5/31 - TabsContentエラーを修正し、正しいコンポーネント階層にする
// 更新日: 2025/5/31 - 既存アプリのトーンマナーに合わせたスタイル調整
// 更新日: 2025/6/1 - OpenAI API連携のembedding生成機能を追加
// 更新日: 2025/6/27 - ConversationContextの統合、Embedding検索API連携
// 更新日: 2025/6/28 - インラインスタイルをTailwindクラスに変更

import { useState, useEffect } from "react";
import { Search, Trash2, RefreshCw, Brain, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Empty } from "@/components/ui/Empty";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useConversation } from "@/contexts/ConversationContext";
import type { Memory } from "@/types/memory";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter,
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMemory?: (content: string) => void;
  currentChatContext?: string; // 追加: 現在のチャットコンテキスト
}

/**
 * チャットUI統合用メモリパネルコンポーネント
 */
export function MemoryPanel({ 
  isOpen, 
  onClose, 
  onInsertMemory,
  currentChatContext // 追加: 現在のチャットコンテキスト
}: MemoryPanelProps) {
  // 状態管理
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [deleteMemoryId, setDeleteMemoryId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // ConversationContextから会話IDを取得
  const { conversationId } = useConversation();

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

  // 初回レンダリング時とパネルが開かれた時にデータを取得
  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  // 現在のチャットコンテキストで類似メモリを自動検索
  useEffect(() => {
    if (isOpen && currentChatContext && currentChatContext.trim().length > 0) {
      searchMemoriesBySimilarity(currentChatContext);
    }
  }, [isOpen, currentChatContext]);

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

  // ベクトル類似度による検索
  const searchMemoriesBySimilarity = async (query: string) => {
    setIsLoading(true);
    try {
      // ConversationContextから会話IDを取得して検索APIに渡す
      const apiUrl = `/api/v1/memory?q=${encodeURIComponent(query)}`;
      const apiUrlWithConversationId = conversationId 
        ? `${apiUrl}&conversationId=${conversationId}` 
        : apiUrl;
      
      const response = await fetch(apiUrlWithConversationId);
      
      if (!response.ok) {
        throw new Error("メモリの類似度検索に失敗しました");
      }
      
      const data = await response.json();
      
      // スコアでソート（スコアが高い順）
      const sortedData = [...data].sort((a, b) => {
        // スコアがある場合は降順（高い順）
        if (a.score !== undefined && b.score !== undefined) {
          return b.score - a.score;
        }
        // スコアがない場合は作成日時の降順
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setMemories(sortedData);
      applyFilters(sortedData, searchTerm, activeTab);
    } catch (error) {
      console.error("メモリ類似度検索エラー:", error);
      // 失敗時は通常検索にフォールバック
      searchMemoriesByText(query);
    } finally {
      setIsLoading(false);
    }
  };

  // テキストベース検索
  const searchMemoriesByText = async (query: string) => {
    if (!query.trim()) {
      fetchMemories();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/memories?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("メモリ検索に失敗しました");
      }
      
      const data = await response.json();
      setMemories(data);
      applyFilters(data, searchTerm, activeTab);
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモリの検索中にエラーが発生しました",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 検索ハンドラー
  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchMemoriesByText(searchTerm);
    } else {
      fetchMemories();
    }
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

  // 現在のチャットコンテキストをメモリとして保存
  const saveCurrentContext = async () => {
    if (!currentChatContext || !currentChatContext.trim()) {
      toast({
        title: "エラー",
        description: "保存するチャットコンテキストがありません",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: currentChatContext,
          metadata: {
            source: "chat_context",
            timestamp: new Date().toISOString()
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error("メモリの保存に失敗しました");
      }
      
      toast({
        title: "保存完了",
        description: "チャットコンテキストをメモリに保存しました",
      });
      
      // 保存後にリストを更新
      fetchMemories();
    } catch (error) {
      toast({
        title: "エラー",
        description: "メモリの保存中にエラーが発生しました",
        variant: "destructive",
      });
      console.error(error);
    }
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

  // メモリをチャットに挿入する
  const handleInsertMemory = (content: string) => {
    if (onInsertMemory) {
      onInsertMemory(content);
      onClose(); // 挿入後パネルを閉じる
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

  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-10 inset-x-0 border-b z-10 shadow-lg max-h-[60vh] overflow-y-auto bg-background-secondary border-border-light"
    >
      <div className="flex flex-col">
        {/* ヘッダー */}
        <div 
          className="flex items-center justify-between p-2 px-3 border-b border-border-light bg-background-tertiary"
        >
          <div className="flex items-center">
            <Brain className="h-4 w-4 mr-2 text-accent-blue" />
            <h2 className="text-sm font-medium text-text-primary">メモリ</h2>
          </div>
          <div className="flex items-center space-x-2">
            {currentChatContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={saveCurrentContext}
                className="h-7 text-xs border-border-light"
              >
                現在の会話を保存
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-slate-700/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 検索バー - 共通セクション */}
        <div className="p-2 px-3 border-b border-border-light">
          <div className="relative">
            <Input
              placeholder="検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8 text-xs h-8 bg-background-tertiary text-text-primary"
            />
            <Search 
              className="h-3.5 w-3.5 absolute top-2.5 right-3 text-muted-foreground opacity-70" 
              onClick={handleSearch}
            />
          </div>
        </div>

        {/* タブとコンテンツセクション */}
        <div className="flex">
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="flex-1 flex"
          >
            {/* 左側：タブ選択部分 */}
            <div className="w-1/4 border-r p-2 border-border-light">
              <TabsList 
                className="grid grid-cols-1 gap-1 h-auto w-full bg-background-tertiary"
              >
                <TabsTrigger value="all" className="justify-start text-xs">すべて</TabsTrigger>
                <TabsTrigger value="synced" className="justify-start text-xs">同期済み</TabsTrigger>
                <TabsTrigger value="local" className="justify-start text-xs">ローカル</TabsTrigger>
              </TabsList>

              {/* 更新ボタン */}
              <Button 
                variant="outline"
                size="sm"
                onClick={fetchMemories}
                className="w-full mt-2 h-8 text-xs border-border-light hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                更新
              </Button>
            </div>

            {/* 右側：メモリリスト */}
            <div className="w-3/4 p-2">
              <TabsContent value="all" className="mt-0 h-full">
                <MemoryList 
                  memories={filteredMemories} 
                  isLoading={isLoading} 
                  formatDate={formatDate}
                  onDelete={(id) => setDeleteMemoryId(id)}
                  onInsert={handleInsertMemory}
                />
              </TabsContent>
              <TabsContent value="synced" className="mt-0 h-full">
                <MemoryList 
                  memories={filteredMemories} 
                  isLoading={isLoading} 
                  formatDate={formatDate}
                  onDelete={(id) => setDeleteMemoryId(id)}
                  onInsert={handleInsertMemory}
                />
              </TabsContent>
              <TabsContent value="local" className="mt-0 h-full">
                <MemoryList 
                  memories={filteredMemories} 
                  isLoading={isLoading} 
                  formatDate={formatDate}
                  onDelete={(id) => setDeleteMemoryId(id)}
                  onInsert={handleInsertMemory}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {deleteMemoryId && (
        <AlertDialog open={!!deleteMemoryId} onOpenChange={() => setDeleteMemoryId(null)}>
          <AlertDialogContent 
            className="border-slate-700 bg-background-secondary"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>本当にこのメモリを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。メモリはデータベースから完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 hover:bg-slate-700">キャンセル</AlertDialogCancel>
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
    </div>
  );
}

// メモリリストコンポーネント
interface MemoryListProps {
  memories: Memory[];
  isLoading: boolean;
  formatDate: (date: string) => string;
  onDelete: (id: string) => void;
  onInsert: (content: string) => void;
}

function MemoryList({ memories, isLoading, formatDate, onDelete, onInsert }: MemoryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <LoadingSpinner />
      </div>
    );
  }

  if (memories.length === 0) {
    return <Empty message="メモリが見つかりません" className="h-32" />;
  }

  return (
    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
      {memories.map((memory) => (
        <Card 
          key={memory.id} 
          className="p-1.5 hover:bg-slate-800/50 transition cursor-pointer border-slate-700/80 bg-background-tertiary"
          onClick={() => onInsert(memory.content)}
        >
          <div className="flex justify-between">
            <div className="flex items-center space-x-1.5">
              <Badge 
                variant={memory.is_synced ? "default" : "secondary"} 
                className={cn(
                  "text-[10px] h-4 px-1.5",
                  memory.is_synced 
                    ? "bg-accent-blue text-white"
                    : "bg-background-tertiary text-text-muted"
                )}
              >
                {memory.is_synced ? "同期済み" : "ローカル"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {formatDate(memory.created_at)}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 hover:bg-slate-700/50" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(memory.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              <span className="sr-only">削除</span>
            </Button>
          </div>
          <div className="mt-1 text-[11px] line-clamp-3 text-slate-300">
            {memory.content}
          </div>
        </Card>
      ))}
    </div>
  );
} 