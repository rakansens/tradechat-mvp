// store/debug/state.ts
// 作成: 2025-05-15 - デバッグスライスの状態と初期値を定義

/**
 * デバッグスライスの状態インターフェース
 */
export interface DebugSliceState {
  isDebugMode: boolean;
}

/**
 * デバッグスライスの初期状態
 * 開発環境では初期値をtrueに設定
 */
export const initialDebugState: DebugSliceState = {
  isDebugMode: process.env.NODE_ENV === 'development'
} 