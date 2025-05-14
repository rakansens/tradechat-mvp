// store/settings/state.ts
// 設定ストアの初期状態
// 作成日: 2025/6/X - 設定ストアのリファクタリング

import { SettingsState } from './types';

// 設定ストアの初期状態
export const initialSettingsState: SettingsState = {
  userSettings: null,
  chartSettings: null,
  symbolSettings: null,
  isLoading: false,
  error: null,
}; 