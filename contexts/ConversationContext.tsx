"use client"

/**
 * contexts/ConversationContext.tsx
 * 作成: 会話コンテキストプロバイダー
 * 機能: 会話IDの管理とURLとの同期化
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface ConversationContextType {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

// デフォルト値を持つコンテキストを作成
const ConversationContext = createContext<ConversationContextType>({
  conversationId: null,
  setConversationId: () => {}
});

export const useConversation = () => useContext(ConversationContext);

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider = ({ children }: ConversationProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [conversationId, setConversationIdState] = useState<string | null>(null);

  // conversationIdを更新し、URLも更新する
  const setConversationId = (id: string | null) => {
    setConversationIdState(id);
    
    // URLを更新
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      
      if (id) {
        url.searchParams.set("conversationId", id);
      } else {
        url.searchParams.delete("conversationId");
      }
      
      // URLを変更（履歴に追加）
      window.history.pushState({}, "", url.toString());
      
      // 会話変更イベントを発行
      window.dispatchEvent(new CustomEvent("conversationChanged", { 
        detail: { conversationId: id } 
      }));
    }
  };

  // マウント時とURLの変更時に会話IDを取得
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // URLから会話IDを取得する関数
    const getConversationIdFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("conversationId");
    };
    
    // 初期会話IDを設定
    const urlConversationId = getConversationIdFromUrl();
    if (urlConversationId !== conversationId) {
      setConversationIdState(urlConversationId);
    }
    
    // 履歴の変更を監視
    const handlePopState = () => {
      const urlConversationId = getConversationIdFromUrl();
      setConversationIdState(urlConversationId);
    };
    
    // イベントリスナーを追加
    window.addEventListener("popstate", handlePopState);
    
    // クリーンアップ
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]);

  return (
    <ConversationContext.Provider value={{ conversationId, setConversationId }}>
      {children}
    </ConversationContext.Provider>
  );
}; 