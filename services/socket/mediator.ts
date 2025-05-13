// services/socket/mediator.ts
// 作成: 2025-05-10 - Socket-IOイベントをSliceアクションに橋渡しするメディエータ
// 更新: 2025-05-14 - 実際のSocketServiceとの接続

import { logger } from '@/utils/common';
import { ExchangeType } from "@/types/api";
import { Timeframe } from "@/types/chart";
import { storeEmit } from "@/store/socket/dispatcher";
import { EventEmitter } from 'events';

/**
 * SocketServiceをEventEmitterとして処理するためのヘルパー
 */
const getSocketEventEmitter = async (): Promise<EventEmitter | null> => {
  try {
    // 循環参照を避けるため動的インポート
    const { getSocketService } = await import('./index');
    const socketService = getSocketService();
    
    if (!socketService) {
      logger.warn('SocketMediator: SocketServiceが見つかりません', {
        component: 'SocketMediator',
        action: 'getSocketEventEmitter'
      });
      return null;
    }
    
    // EventEmitterとして処理するために型アサーション
    return socketService as unknown as EventEmitter;
  } catch (error) {
    logger.error('SocketMediator: SocketService取得エラー', {
      component: 'SocketMediator',
      action: 'getSocketEventEmitter',
      error
    });
    return null;
  }
};

/**
 * ソケットメディエータを初期化
 * Socket.IOイベントをStoreアクションに変換する役割を担う
 */
export const initSocketMediator = async () => {
  logger.info('SocketMediator: 初期化を開始', {
    component: 'SocketMediator',
    action: 'initialize'
  });

  try {
    // 実際のソケットサービスを取得
    const eventEmitter = await getSocketEventEmitter();
    
    // サービスが取得できなかった場合はダミーのEventEmitterで代用
    // この部分は実際のサービスが実装された後に削除予定
    const socketEvents = eventEmitter || new EventEmitter();
    
    if (!eventEmitter) {
      logger.warn('SocketMediator: 本番サービスが利用できなかったためダミーモードで初期化します', {
        component: 'SocketMediator'
      });
      
      // テスト用ダミーイベント発行（開発・テスト用）
      setTimeout(() => {
        socketEvents.emit('connected', true);
        socketEvents.emit('socketId', 'socket-123456');
      }, 1000);
    }

    // シンボル変更イベント
    socketEvents.on("symbol", (symbol: string) => {
      logger.debug(`SocketMediator: symbolイベント受信 ${symbol}`, {
        component: 'SocketMediator',
        event: 'symbol',
        symbol
      });
      storeEmit("symbol", symbol);
    });

    // 取引タイプ変更イベント
    socketEvents.on("exchangeType", (type: ExchangeType) => {
      logger.debug(`SocketMediator: exchangeTypeイベント受信 ${type}`, {
        component: 'SocketMediator',
        event: 'exchangeType',
        type
      });
      storeEmit("exchangeType", type);
    });

    // 時間足変更イベント
    socketEvents.on("timeframe", (timeframe: Timeframe) => {
      logger.debug(`SocketMediator: timeframeイベント受信 ${timeframe}`, {
        component: 'SocketMediator',
        event: 'timeframe',
        timeframe
      });
      storeEmit("timeframe", timeframe);
    });

    // 接続状態変更イベント
    socketEvents.on("connected", (connected: boolean) => {
      logger.debug(`SocketMediator: connectedイベント受信 ${connected}`, {
        component: 'SocketMediator',
        event: 'connected',
        connected
      });
      storeEmit("connected", connected);
    });

    // ソケットID変更イベント
    socketEvents.on("socketId", (id: string) => {
      logger.debug(`SocketMediator: socketIdイベント受信 ${id}`, {
        component: 'SocketMediator',
        event: 'socketId',
        id
      });
      storeEmit("socketId", id);
    });

    logger.info('SocketMediator: 初期化完了', {
      component: 'SocketMediator',
      action: 'initialize',
      success: true,
      usingRealService: !!eventEmitter
    });
    
    return socketEvents;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`SocketMediator: 初期化エラー: ${errorMessage}`, {
      component: 'SocketMediator',
      action: 'initialize',
      error: errorMessage
    });
    return null;
  }
};

/**
 * メモ: 実際の実装では下記のようにSocketServiceを直接扱う
 * この実装は循環参照の解決後に有効化する
 */
/*
import { getSocketService } from "./service";

export const initSocketMediator = () => {
  const socketService = getSocketService();
  if (!socketService) return;
  
  // EventEmitterの形に型変換して使用
  const eventEmitter = socketService as unknown as EventEmitter;
  
  eventEmitter.on("symbol", (symbol: string) => {
    storeEmit("symbol", symbol);
  });
  
  // 他のイベントハンドラも同様に実装
};
*/ 