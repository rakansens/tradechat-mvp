// store/socket/state.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのState定義

export interface SocketSliceState {
  /**
   * ソケットの接続状態
   * true: 接続済み, false: 切断
   */
  connected: boolean;
  
  /**
   * ソケットID
   * 接続時に割り当てられるユニークID
   */
  socketId?: string;
}

/**
 * ソケットスライスの初期状態
 */
export const initialSocketState: SocketSliceState = {
  connected: false,
  socketId: undefined
}; 