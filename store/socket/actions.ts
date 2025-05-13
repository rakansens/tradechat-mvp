// store/socket/actions.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのAction定義
// 更新: 2025-05-10 - StateCreator型の修正

import { StateCreator } from 'zustand';
import { SocketSliceState } from './state';
import { logger } from '@/utils/logger';

export interface SocketSliceActions {
  /**
   * ソケット接続状態を更新する
   * @param connected 接続状態 (true: 接続済み, false: 切断)
   * @param source イベントのソース（ログ用）
   */
  setConnected: (connected: boolean, source?: string) => void;
  
  /**
   * Socket ID を更新する
   * @param socketId 設定するSocket ID
   * @param source イベントのソース（ログ用）
   */
  setSocketId: (socketId: string, source?: string) => void;
}

export type SocketSlice = SocketSliceState & SocketSliceActions;

export const createSocketSliceActions: StateCreator<
  SocketSlice,
  [],
  [],
  SocketSliceActions
> = (set, _get, _store) => ({
  setConnected: (connected: boolean, source: string = 'socket-event') => {
    logger.info(`SocketSlice: 接続状態を${connected}に更新します`, {
      component: 'SocketSlice',
      action: 'setConnected',
      connected,
      source
    });
    try {
      set({ connected });
      logger.info(`SocketSlice: 接続状態を${connected}に更新しました`, {
        component: 'SocketSlice',
        action: 'setConnected',
        success: true,
        connected
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`SocketSlice: 接続状態更新エラー: ${errorMessage}`, {
        component: 'SocketSlice',
        action: 'setConnected',
        errorMessage,
        connected
      });
    }
  },
  
  setSocketId: (socketId: string, source: string = 'socket-event') => {
    logger.info(`SocketSlice: Socket ID ${socketId} を受信しました`, {
      component: 'SocketSlice',
      action: 'setSocketId',
      socketId,
      source
    });
    try {
      set({ socketId });
      logger.info(`SocketSlice: Socket ID ${socketId} を設定しました`, {
        component: 'SocketSlice',
        action: 'setSocketId',
        success: true,
        socketId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`SocketSlice: Socket ID処理エラー: ${errorMessage}`, {
        component: 'SocketSlice',
        action: 'setSocketId',
        errorMessage,
        socketId
      });
    }
  }
}); 