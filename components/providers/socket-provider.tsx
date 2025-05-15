'use client'

// components/providers/socket-provider.tsx
// ソケット接続プロバイダーコンポーネント
// 作成日: 2025/6/15
// 更新日: 2025/6/23 - 動的URL検出を実装

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

type SocketContextType = {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export const useSocket = () => {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 動的に現在のウィンドウのオリジンを取得
    // ブラウザ環境ではwindowオブジェクトが利用可能
    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

    console.log('Connecting to socket server at:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true,
    })

    // 接続イベントリスナー
    socketInstance.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    // 切断イベントリスナー
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // エラーイベントリスナー
    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      setIsConnected(false)
    })

    // Socketインスタンスを設定
    setSocket(socketInstance)

    // クリーンアップ関数
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}