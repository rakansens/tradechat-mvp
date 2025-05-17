// store/ui/actions.ts
// 初期実装: UIスライスのアクション
// 更新: T-7.5フェーズ - 型インポートパスを修正

import type { TabType } from '@/types/store/ui'
import type { UISliceState } from './state'

// UIスライスのアクション定義
export interface UISliceActions {
  // タブ管理
  setActiveTab: (tab: TabType) => void
  
  // テーマ管理
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  
  // レイアウト管理
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  toggleSettings: () => void
  setSettingsOpen: (isOpen: boolean) => void
  
  // モーダル管理
  openModal: (modalType: string, modalData?: any) => void
  closeModal: () => void
}

// UIスライスのアクション作成関数
export const createUIActions = (
  set: (fn: (state: UISliceState) => void) => void,
  get: () => UISliceState
): UISliceActions => ({
  
  // タブ管理
  setActiveTab: (tab: TabType) => {
    set((state) => {
      state.activeTab = tab
    })
  },
  
  // テーマ管理
  toggleDarkMode: () => {
    set((state) => {
      state.isDarkMode = !state.isDarkMode
    })
  },
  
  setDarkMode: (isDark: boolean) => {
    set((state) => {
      state.isDarkMode = isDark
    })
  },
  
  // レイアウト管理
  toggleSidebar: () => {
    set((state) => {
      state.isSidebarOpen = !state.isSidebarOpen
    })
  },
  
  setSidebarOpen: (isOpen: boolean) => {
    set((state) => {
      state.isSidebarOpen = isOpen
    })
  },
  
  toggleSettings: () => {
    set((state) => {
      state.isSettingsOpen = !state.isSettingsOpen
    })
  },
  
  setSettingsOpen: (isOpen: boolean) => {
    set((state) => {
      state.isSettingsOpen = isOpen
    })
  },
  
  // モーダル管理
  openModal: (modalType: string, modalData: any = null) => {
    set((state) => {
      state.isModalOpen = true
      state.modalType = modalType
      state.modalData = modalData
    })
  },
  
  closeModal: () => {
    set((state) => {
      state.isModalOpen = false
      state.modalType = null
      state.modalData = null
    })
  }
}) 