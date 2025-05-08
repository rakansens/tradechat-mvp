"use client"

import React, { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { setupGlobalErrorHandlers } from "@/utils/errorHandlers"
import { socketService } from '@/services/socketService'
import { useAppStore } from '@/store'
import { logger } from '@/utils/logger'
import LogViewer from '@/components/LogViewer'
import { Button } from '@/components/ui/button'
import { BugIcon, XIcon } from 'lucide-react'

// 更新: デバッグ機能の追加、SocketInitializerの機能を統合、useAppStoreの初期化を追加
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const isDebugMode = useAppStore(state => state.isDebugMode);
  // グローバルエラーハンドラー、ソケットクライアント、ストアをセットアップ（クライアントサイドのみ）
  useEffect(() => {
    // グローバルエラーハンドラーをセットアップ
    setupGlobalErrorHandlers();
    
    // 共通のソケットサービスを使用してSocket.ioクライアントを初期化
    if (typeof window !== 'undefined') {
      socketService.initializeMarketSocket();
      
      // アプリケーション初期化時にuseAppStoreを初期化
      try {
        // アプリストアを初期化
        const appStore = useAppStore.getState();
        const { symbol, exchangeType } = appStore.initializeApp();
        
        logger.info(`App initialized with symbol: ${symbol}, exchange type: ${exchangeType}`, {
          component: 'ClientLayout',
          action: 'initialize'
        });
      } catch (error) {
        logger.error(`Failed to initialize app store: ${error}`, {
          component: 'ClientLayout',
          action: 'initialize',
          error
        });
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ErrorBoundary>
        {children}
        
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
    </ThemeProvider>
  );
}
