'use client'

// components/providers/ModalProvider.tsx
// モーダル管理プロバイダーコンポーネント
// 作成日: 2025/6/15

import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

// モーダルコンテキストの型定義
type ModalContextType = {
  isOpen: boolean
  modalType: string | null
  data: any
  openModal: (type: string, data?: any) => void
  closeModal: () => void
}

// デフォルト値を持つモーダルコンテキストの作成
const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  modalType: null,
  data: null,
  openModal: () => {},
  closeModal: () => {},
})

// カスタムフックの作成
export const useModal = () => {
  return useContext(ModalContext)
}

// モーダルプロバイダーコンポーネント
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const router = useRouter()

  // モーダルを開く関数
  const openModal = (type: string, data?: any) => {
    setModalType(type)
    setData(data || null)
    setIsOpen(true)
  }

  // モーダルを閉じる関数
  const closeModal = () => {
    setIsOpen(false)
    setModalType(null)
    setData(null)
  }

  // ルート変更時にモーダルを閉じる
  useEffect(() => {
    const handleRouteChange = () => {
      closeModal()
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  // コンテキスト値
  const contextValue = {
    isOpen,
    modalType,
    data,
    openModal,
    closeModal,
  }

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  )
} 