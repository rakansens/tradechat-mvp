// store/socket/selectors.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのSelector定義

import { SocketSlice } from './actions';
import { useRootStore } from '../rootStore';

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

// WebSocketの接続状態を取得
export const useSocketConnected = () => useRootStore(state => state.connected);

// WebSocketの購読状態を取得
export const useSocketSubscriptions = () => useRootStore(state => state.subscriptions);

// 特定のタイプの購読状態を取得
export const useSocketSubscription = (type: 'orderbook' | 'chart') => 
  useRootStore(state => state.subscriptions[type]);

// WebSocketの状態全体を取得
export const useSocketStatus = () => 
  useRootStore(state => ({
    connected: state.connected,
    subscriptions: state.subscriptions
  })); 