// utils/socketClient.ts
// Socket.IOクライアントの初期化とイベントハンドリング
// 作成: 2023-09-01
// 更新: 2023-10-15 - チャートデータの取得機能を追加
// 更新: 2023-11-20 - 取引タイプ切り替え機能のサポートを追加
// 更新: 2024-01-10 - 接続ステータス監視と再接続機能の改善
// 更新: 2024-02-20 - ロギングを構造化形式にアップグレード
// 更新: 2024-03-15 - App Store用の直接変更イベントを追加 (元のCustomEventも維持)
// 更新: 2025-05-09 - CustomEvent発行を削除し、App Store後方互換レイヤーを完全に移行
// 更新: 2025-05-09 - ローカルストレージの保存を最小限に抑える
// 更新: 2025-05-12 - 接続URLをlocalhost:3000に修正（標準ポートを使用）
// 更新: 2025-05-13 - 全ての機能をSocketCoreに委譲するように変更
// 更新: 2025-05-14 - socketActionsを削除し、store/socket/dispatcherを使用

import { Socket } from 'socket.io-client';
import { SocketCore } from '@/services/socket/core';
import { logger } from '@/utils/common';
import { storeEmit } from '@/store/socket/dispatcher';
import { Timeframe } from '@/types/chart';
import { ExchangeType } from '@/types/constants/enums';
import { captureChartAsBase64 } from './screenshotUtils';

// レガシー状態変数
let clientId = '';
let isInitialized = false;

/**
 * @deprecated 新しいSocketServiceを使用してください
 * Socket.ioクライアントを初期化
 */
export function initializeSocketClient(forceReinitialize = false, namespace?: string): boolean {
  try {
    // 新しいコアモジュールを使用
    const socket = SocketCore.getSocket(forceReinitialize);
    
    if (!socket) return false;
    
    // 初期化済みフラグを設定
    isInitialized = true;
    
    // 接続済みの場合はクライアントIDを取得
    if (socket.connected && socket.id) {
      clientId = socket.id;
      // AppStore状態を更新
      storeEmit('connected', true);
      storeEmit('socketId', clientId);
    }
    
    // イベントハンドラの設定
    setupLegacyEventHandlers(socket);
    
    logger.info('socketClient: Socket.IO初期化完了（レガシーAPI）', {
      component: 'socketClient',
      action: 'initializeSocketClient',
      socketConnected: socket?.connected
    });
    
    return isInitialized;
  } catch (error) {
    logger.error('Socket初期化エラー', { error });
    isInitialized = false;
    return false;
  }
}

/**
 * @deprecated 新しいSocketServiceを使用してください
 * 現在のSocketインスタンスを取得
 */
export function getSocket(attemptInitialize = false): Socket | null {
  // 初期化が必要な場合
  if (attemptInitialize && !isInitialized) {
    initializeSocketClient(false);
  }
  
  // コアモジュールからソケットを取得
  return SocketCore.getSocket(false);
}

/**
 * @deprecated 新しいSocketServiceを使用してください
 * クライアントIDを取得
 */
export function getClientId(): string {
  return clientId;
}

/**
 * @deprecated 新しいSocketServiceを使用してください
 * ソケットイベントを発行
 */
export function emitEvent(eventName: string, data: any, callback?: (response: any) => void): boolean {
  const socket = getSocket(false);
  
  if (!socket || !isInitialized) {
    logger.warn(`Socket.IO接続が初期化されていません。イベント ${eventName} を発行できません。`, {
      component: 'socketClient',
      action: 'emitEvent',
      event: eventName
    });
    return false;
  }

  try {
    if (callback) {
      socket.emit(eventName, data, callback);
    } else {
      socket.emit(eventName, data);
    }
    return true;
  } catch (error) {
    logger.error(`イベント ${eventName} の発行中にエラーが発生しました:`, {
      component: 'socketClient',
      action: 'emitEvent',
      event: eventName,
      error
    });
    return false;
  }
}

// 新しいAPIへの移行ヘルパー
export const getModernSocketService = () => {
  // インポートの循環参照を回避するためにdynamic importを使用
  return import('@/services/socket').then(module => module.getSocketService());
};

// ------ プライベート関数 ------

/**
 * レガシーイベントハンドラを設定
 * @private
 */
function setupLegacyEventHandlers(socket: Socket): void {
  // 以前に設定したハンドラをクリア
  socket.off('connected');
  socket.off('changeTimeframe');
  socket.off('changeSymbol');
  socket.off('instrument-type-change');
  socket.off('disconnect');
  socket.off('reconnect_attempt');
  socket.off('reconnect');
  
  // 接続成功時の処理
  socket.on('connected', (data: { clientId: string }) => {
    clientId = data.clientId;
    isInitialized = true;
    storeEmit('connected', true);
    storeEmit('socketId', clientId);
    
    logger.info('Socket.IO接続成功:', {
      component: 'socketClient',
      action: 'connected',
      clientId
    });
  });
  
  // 時間足変更イベントのリスナー
  socket.on('changeTimeframe', (data: { timeframe: Timeframe }) => {
    logger.info('時間足変更イベント受信:', {
      component: 'socketClient',
      action: 'changeTimeframe',
      data
    });
    
    // AppStoreを直接更新
    storeEmit('timeframe', data.timeframe);
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('lastUsedTimeframe', data.timeframe);
      localStorage.setItem('selectedTimeframe', data.timeframe);
    } catch (error) {
      /* noop */
    }
    
    // グローバルイベントを発行
    try {
      window.dispatchEvent(new CustomEvent('timeframeChanged', { detail: data }));
    } catch (e) {
      /* noop */
    }
  });
  
  // 銘柄変更イベントのリスナー
  socket.on('changeSymbol', (data: { symbol: string, exchangeType?: ExchangeType, timeframe?: Timeframe }) => {
    logger.info('銘柄変更イベント受信:', {
      component: 'socketClient',
      action: 'changeSymbol',
      data
    });
    
    // 取引タイプが指定されている場合は先に設定
    if (data.exchangeType) {
      storeEmit('exchangeType', data.exchangeType);
      
      setTimeout(() => {
        storeEmit('symbol', data.symbol);
      }, 100);
    } else {
      storeEmit('symbol', data.symbol);
      
      if (data.timeframe) {
        storeEmit('timeframe', data.timeframe);
      }
    }
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('lastUsedSymbol', data.symbol);
      localStorage.setItem('selectedSymbol', data.symbol);
    } catch (error) {
      /* noop */
    }
    
    // グローバルイベントを発行
    try {
      window.dispatchEvent(new CustomEvent('symbolChanged', { detail: data }));
    } catch (e) {
      /* noop */
    }
  });
  
  // 切断時の処理
  socket.on('disconnect', (reason) => {
    logger.warn('Socket.IO切断:', {
      component: 'socketClient',
      action: 'disconnect',
      reason
    });
    
    isInitialized = false;
    clientId = '';
    storeEmit('connected', false);
  });
  
  // 再接続成功時の処理
  socket.on('reconnect', () => {
    logger.info('Socket.IO再接続成功', {
      component: 'socketClient',
      action: 'reconnect'
    });
    
    isInitialized = true;
    storeEmit('connected', true);
  });
}
