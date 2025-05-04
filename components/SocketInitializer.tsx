'use client';

import { useEffect } from 'react';
import { initializeSocketClient } from '@/utils/socketClient';

export default function SocketInitializer() {
  useEffect(() => {
    // クライアントサイドのみで実行
    if (typeof window !== 'undefined') {
      // Socket.ioクライアントを初期化
      initializeSocketClient();
    }
  }, []);

  // このコンポーネントは何もレンダリングしない
  return null;
} 