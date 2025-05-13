// store/socket/selectors.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのSelector定義

import { SocketSlice } from './actions';

/**
 * ソケット接続状態を選択する
 * @param state SocketSlice
 * @returns 接続状態 (true: 接続済み, false: 切断)
 */
export const selectConnected = (state: SocketSlice) => state.connected;

/**
 * ソケットIDを選択する
 * @param state SocketSlice
 * @returns ソケットID
 */
export const selectSocketId = (state: SocketSlice) => state.socketId; 