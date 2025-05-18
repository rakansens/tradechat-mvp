"use client"

import React, { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { setupGlobalErrorHandlers } from "@/utils/errorHandlers"
import { socketService } from '@/services/socket'
import { useRootStore } from '@/store/rootStore'
import { selectIsDebugMode } from '@/store/debug/selectors'
import { logger } from '@/utils/common'
import { LogViewer } from '@/components/debug'
import { Button } from '@/components/ui/button'
import { BugIcon, XIcon } from 'lucide-react'
import { ConversationProvider } from '@/contexts/ConversationContext'

// 更新: デバッグ機能の追加、SocketInitializerの機能を統合、useAppStoreの初期化を追加
// 更新: useSymbolStoreをuseRootStoreに置き換え
// 更新: 2025-05-15 - useDebugStoreをrootStoreセレクターに置き換え
// 更新: 2025-05-30 - OrderBookStoreの初期化を循環参照を避けるために明示的に行うよう修正
// 更新: 2025-06-05 - useOrderBookStoreをuseRootStoreに統合
// 更新: 2025-06-25 - ConversationProviderを追加
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const isDebugMode = useRootStore(selectIsDebugMode);
  
  // グローバルエラーハンドラー、ソケットクライアント、ストアをセットアップ（クライアントサイドのみ）
  useEffect(() => {
    // グローバルエラーハンドラーをセットアップ
    setupGlobalErrorHandlers();
    
    // 共通のソケットサービスを使用してSocket.ioクライアントを初期化
    if (typeof window !== 'undefined') {
      socketService.initializeMarketSocket();
      
      // シンボルと各ストアの初期化
      try {
        // シンボルストア情報をrootStoreから取得
        const rootStore = useRootStore.getState();
        const symbol = rootStore.currentSymbol;
        const exchangeType = rootStore.exchangeType;
        
        // シンボルが空の場合はデフォルト使用
        const finalSymbol = symbol || 'BTCUSDT';
        if (!symbol) {
          rootStore.setCurrentSymbol(finalSymbol, '初期化時のデフォルト設定');
        }
        
        // オーダーブックを取得
        rootStore.fetchOrderBook(finalSymbol);
        
        logger.info(`App initialized with symbol: ${finalSymbol}, exchange type: ${exchangeType}`, {
          component: 'ClientLayout',
          action: 'initialize'
        });
      } catch (error) {
        logger.error(`Failed to initialize symbol store: ${error}`, {
          component: 'ClientLayout',
          action: 'initialize',
          error
        });
      }
    }
    
    // クリーンアップ関数
    return () => {
      // クリーンアップが必要な場合はここに記述
    };
  }, []);

  return (
    <ErrorBoundary>
      <ConversationProvider>
        {children}
      </ConversationProvider>
      
      {/* デバッグモードの場合のみデバッグボタンを表示 */}
      {process.env.NODE_ENV === 'development' && (
          <>
            <div className="fixed bottom-4 right-4 z-50">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="bg-background shadow-md"
              >
                {showDebugPanel ? <XIcon size={18} /> : <BugIcon size={18} />}
              </Button>
            </div>
            
            {/* デバッグパネル */}
            {showDebugPanel && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
                <div className="bg-background rounded-lg shadow-xl w-[90vw] h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">デバッグパネル</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDebugPanel(false)}
                    >
                      <XIcon size={18} />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <LogViewer />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </ErrorBoundary>
  );
}
