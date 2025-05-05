"use client"

import React, { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { setupGlobalErrorHandlers } from "@/utils/errorHandlers"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // グローバルエラーハンドラーをセットアップ（クライアントサイドのみ）
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
