// store/socketActions.ts
// 作成: 2025-05-09 - Socket.IOイベントからAppStoreを直接更新するための仲介レイヤー
// 目的: 循環依存を避けつつ、データフローを一本化する

import { useAppStore } from './index';
import { logger } from '@/utils/logger';
import { Timeframe } from '@/types/chart';
import { ExchangeType } from '@/types/api';

/**
 * 銘柄を更新する
 * @param symbol 設定する銘柄
 * @param source イベントのソース（ログ用）
 */
export const setSymbol = (symbol: string, source: string = 'socket-event') => {
  logger.info(`socketActions: 銘柄を${symbol}に更新します`, {
    component: 'socketActions',
    action: 'setSymbol',
    symbol,
    source
  });
  try {
    useAppStore.getState().setCurrentSymbol(symbol, `socketActions/${source}`);
    logger.info(`socketActions: 銘柄を${symbol}に更新しました`, {
      component: 'socketActions',
      action: 'setSymbol',
      success: true,
      symbol
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`socketActions: 銘柄更新エラー: ${errorMessage}`, {
      component: 'socketActions',
      action: 'setSymbol',
      errorMessage,
      symbol
    });
  }
};

/**
 * 取引タイプを更新する
 * @param type 設定する取引タイプ（'spot'または'futures'）
 * @param symbol 関連する銘柄（オプション）
 * @param source イベントのソース（ログ用）
 */
export const setExchangeType = (
  type: ExchangeType, 
  symbol?: string, 
  source: string = 'socket-event'
) => {
  const store = useAppStore.getState();
  const currentType = store.exchangeType;
  const currentSymbol = symbol || store.currentSymbol || 'BTCUSDT';
  
  logger.info(`socketActions: 取引タイプを${currentType}から${type}に更新します`, {
    component: 'socketActions',
    action: 'setExchangeType',
    fromType: currentType,
    toType: type,
    symbol: currentSymbol,
    source
  });
  
  try {
    // 先物から現物への切り替え時は特別な処理
    if (type === 'spot' && currentType === 'futures') {
      logger.info(`socketActions: 先物→現物の切り替えを検出、銘柄を先に設定: ${currentSymbol}`, {
        component: 'socketActions',
        action: 'setExchangeType',
        currentSymbol
      });
      
      // 銘柄を先に設定
      store.setCurrentSymbol(currentSymbol, '先物→現物切り替え前の銘柄設定');
    }
    
    // 取引タイプを更新
    store.setExchangeType(type);
    
    // 現物から先物への切り替え時、または銘柄変更時
    if ((type === 'futures' && currentType === 'spot') || 
        (symbol && symbol !== store.currentSymbol)) {
      logger.info(`socketActions: 取引タイプ変更後に銘柄を再設定: ${currentSymbol}`, {
        component: 'socketActions',
        action: 'setExchangeType',
        currentSymbol
      });
      
      // 少し遅延させて銘柄を再設定
      setTimeout(() => {
        store.setCurrentSymbol(currentSymbol, '取引タイプ変更後の銘柄再設定');
      }, 100);
    }
    
    logger.info(`socketActions: 取引タイプを${type}に更新しました`, {
      component: 'socketActions',
      action: 'setExchangeType',
      success: true,
      type,
      symbol: currentSymbol
    });
  } catch (error) {
    // エラーオブジェクトを文字列化してログに出力
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    logger.error(`socketActions: 取引タイプ更新エラー: ${errorMessage}`, {
      component: 'socketActions',
      action: 'setExchangeType',
      errorMessage,
      errorStack,
      type,
      symbol: currentSymbol
    });
  }
};

/**
 * 時間足を更新する
 * @param timeframe 設定する時間足
 * @param source イベントのソース（ログ用）
 */
export const setTimeframe = (timeframe: Timeframe, source: string = 'socket-event') => {
  logger.info(`socketActions: 時間足を${timeframe}に更新します`, {
    component: 'socketActions',
    action: 'setTimeframe',
    timeframe,
    source
  });
  try {
    const appStore = useAppStore.getState();
    // AppStoreの状態を更新
    appStore.updateTimeFrame(timeframe);
    
    // 現在のシンボルと取引タイプを取得
    const currentSymbol = appStore.currentSymbol;
    const exchangeType = appStore.exchangeType;
    
    // キャッシュもクリアする
    // 循環依存を避けるために動的インポートを使用
    import('../services/dataFetchService').then(module => {
      const dataFetchService = module.default;
      if (typeof dataFetchService.handleTimeframeChange === 'function') {
        dataFetchService.handleTimeframeChange(currentSymbol, timeframe, exchangeType);
        logger.info(`socketActions: 時間足変更に伴いキャッシュをクリアしました`, {
          component: 'socketActions',
          action: 'setTimeframe',
          symbol: currentSymbol,
          timeframe,
          exchangeType
        });
      }
    }).catch(e => {
      logger.warn(`socketActions: キャッシュクリアに失敗しました`, {
        component: 'socketActions',
        action: 'setTimeframe',
        error: e
      });
    });
    
    logger.info(`socketActions: 時間足を${timeframe}に更新しました`, {
      component: 'socketActions',
      action: 'setTimeframe',
      success: true,
      timeframe
    });
  } catch (error) {
    // エラーオブジェクトを文字列化してログに出力
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    logger.error(`socketActions: 時間足更新エラー: ${errorMessage}`, {
      component: 'socketActions',
      action: 'setTimeframe',
      errorMessage,
      errorStack,
      timeframe
    });
  }
};

/**
 * ソケット接続状態を更新する
 * @param connected 接続状態 (true: 接続済み, false: 切断)
 * @param source イベントのソース（ログ用）
 */
export const setConnected = (connected: boolean, source: string = 'socket-event') => {
  logger.info(`socketActions: 接続状態を${connected}に更新します`, {
    component: 'socketActions',
    action: 'setConnected',
    connected,
    source
  });
  try {
    // AppStore の状態を直接更新
    useAppStore.setState({ wsConnected: connected });
    logger.info(`socketActions: 接続状態を${connected}に更新しました`, {
      component: 'socketActions',
      action: 'setConnected',
      success: true,
      connected
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`socketActions: 接続状態更新エラー: ${errorMessage}`, {
      component: 'socketActions',
      action: 'setConnected',
      errorMessage,
      connected
    });
  }
};

/**
 * Socket ID を更新する
 * @param socketId 設定するSocket ID
 * @param source イベントのソース（ログ用）
 */
export const setSocketId = (socketId: string, source: string = 'socket-event') => {
  logger.info(`socketActions: Socket ID ${socketId} を受信しました (ログのみ)`, {
    component: 'socketActions',
    action: 'setSocketId',
    success: true,
    socketId
  });
  try {
    // socketId は AppStore に保存されないため、ここではログ出力のみ
    logger.info(`socketActions: Socket ID ${socketId} を受信しました (ログのみ)`, {
      component: 'socketActions',
      action: 'setSocketId',
      success: true,
      socketId
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`socketActions: Socket ID処理エラー (ログのみ): ${errorMessage}`, {
      component: 'socketActions',
      action: 'setSocketId',
      errorMessage,
      socketId
    });
  }
};
