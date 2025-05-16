/**
 * components/chat/section/ui/Header.tsx
 * チャットセクションのヘッダーコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-31: メモリトグルボタンを追加
 * - 2025-05-31: レイアウト改善、AIアシスタントタイトルとメモリボタンを中央配置
 * - 2025-05-31: AIアシスタントテキストを左寄せに修正
 * - 2025-05-31: レイアウト構造を単純化し、AIアシスタントを左、メモリボタンを右に確実に配置
 * - 2025-06-01: メモリパネルを最新のメモリトグルコンポーネントに更新
 * - 2025-06-28: Tailwindクラスに変更
 * - 2025-06-29: 接続状態を表示するバッジを追加
 */

"use client"

import { MessageSquare } from "lucide-react"
import { MemoryToggle } from "@/components/chat/ui/MemoryToggle"
import { Badge } from "@/components/ui/badge"
import { ConnectionStatus } from "@/store/chat/state"
import { cn } from "@/lib/utils"

interface ConnectionInfo {
  status: ConnectionStatus;
  error: string | null;
}

interface HeaderProps {
  onToggleMemory: () => void;
  isMemoryOpen: boolean;
  connection: ConnectionInfo;
}

// バッジのvariantタイプ
type BadgeVariant = 'success' | 'destructive' | 'secondary' | 'default' | 'outline';

/**
 * チャットセクションのヘッダーコンポーネント
 * 
 * AIアシスタントのタイトルとメモリトグルボタンを表示します。
 * 接続状態を示すバッジも表示します。
 */
export const Header = ({ 
  onToggleMemory, 
  isMemoryOpen, 
  connection 
}: HeaderProps) => {
  // 接続状態に基づいてバッジの色とテキストを決定
  const getConnectionBadge = () => {
    if (!connection) return null;
    
    const { status, error } = connection;
    
    // ステータスに応じたスタイルとテキストを設定
    switch (status) {
      case 'CONNECTED':
        return { text: 'リアルタイム接続中', variant: 'success' as BadgeVariant };
      case 'CONNECTING':
        return { text: '接続中...', variant: 'secondary' as BadgeVariant, className: 'bg-amber-500 text-white' };
      case 'RECONNECTING':
        return { text: '再接続中...', variant: 'secondary' as BadgeVariant, className: 'bg-amber-500 text-white' };
      case 'ERROR':
        return { text: error || '接続エラー', variant: 'destructive' as BadgeVariant };
      case 'MAX_RETRIES_EXCEEDED':
        return { text: '再接続失敗', variant: 'destructive' as BadgeVariant };
      case 'DISCONNECTED':
      default:
        return { text: 'オフライン', variant: 'secondary' as BadgeVariant };
    }
  };
  
  const connectionBadge = getConnectionBadge();
  
  return (
    <div 
      className="flex items-center justify-between px-4 py-2 border-b bg-background-secondary border-border-light"
    >
      {/* 左側: AIアシスタントタイトルと接続状態 */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 mr-2 text-accent-blue" />
        <span className="text-sm font-medium text-text-primary">
          AI Assistant
        </span>
        
        {/* 接続状態バッジ */}
        {connectionBadge && (
          <Badge 
            variant={connectionBadge.variant}
            className={cn(
              "text-xs px-2 py-0.5 h-5",
              connectionBadge.className,
              connectionBadge.variant === "success" ? "bg-accent-green text-white" :
              connectionBadge.variant === "destructive" ? "bg-accent-red text-white" :
              connectionBadge.variant === "secondary" && !connectionBadge.className ? "bg-gray-500 text-white" : ""
            )}
          >
            {connectionBadge.text}
          </Badge>
        )}
      </div>
      
      {/* 右側: メモリトグルボタン */}
      <MemoryToggle 
        onClick={onToggleMemory} 
        isOpen={isMemoryOpen} 
      />
    </div>
  );
};

export default Header; 