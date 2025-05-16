// store/ui/state.ts
// 初期実装: UIスライスの状態と初期値を定義
// 更新: T-7.5フェーズ - 型インポートパスを修正

import type { TabType } from '@/types/store/ui'

// UIスライスの状態インターフェース
export interface UISliceState {
  activeTab: TabType
  isDarkMode: boolean
  isSidebarOpen: boolean
  isSettingsOpen: boolean
  isModalOpen: boolean
  modalType: string | null
  modalData: any | null
}

// UIスライスの初期状態
export const initialUIState: UISliceState = {
  activeTab: 'chart',
  isDarkMode: false,
  isSidebarOpen: true,
  isSettingsOpen: false,
  isModalOpen: false,
  modalType: null,
  modalData: null
} 