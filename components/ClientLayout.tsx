"use client"

import React, { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { setupGlobalErrorHandlers } from "@/utils/errorHandlers"
import { socketService } from '@/services/socketService'

// 更新: SocketInitializerの機能を統合
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // グローバルエラーハンドラーとソケットクライアントをセットアップ（クライアントサイドのみ）
  useEffect(() => {
    // グローバルエラーハンドラーをセットアップ
    setupGlobalErrorHandlers();
    
    // 共通のソケットサービスを使用してSocket.ioクライアントを初期化
    if (typeof window !== 'undefined') {
      socketService.initializeBaseSocket();
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
