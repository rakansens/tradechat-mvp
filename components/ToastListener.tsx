"use client"

// components/ToastListener.tsx
// トースト通知イベントをリッスンして表示するコンポーネント
// 作成日: 2025/6/X - ストアからのトースト通知をサポート

import React, { useEffect } from 'react';
import { useToast } from '@/hooks/core/useToast';

// トースト通知イベントの型定義
interface ToastEvent {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

/**
 * グローバルトースト通知リスナーコンポーネント
 * ストアからのトースト通知イベントをリッスンし、UIに表示します
 */
export function ToastListener() {
  const { toast } = useToast();

  useEffect(() => {
    // トースト表示イベントのリスナー
    const handleToastEvent = (event: CustomEvent<ToastEvent>) => {
      const { title, description, variant } = event.detail;
      
      toast({
        title,
        description,
        variant,
      });
    };

    // イベントリスナーを登録
    window.addEventListener('showToast', handleToastEvent as EventListener);

    // クリーンアップ関数でリスナーを削除
    return () => {
      window.removeEventListener('showToast', handleToastEvent as EventListener);
    };
  }, [toast]);

  // このコンポーネントは表示要素を持たない
  return null;
}

export default ToastListener; 