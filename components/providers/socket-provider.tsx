'use client'

// components/providers/socket-provider.tsx
// ソケット接続プロバイダーコンポーネント
// 作成日: 2025/6/15

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
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
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