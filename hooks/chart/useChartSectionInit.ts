/**
 * hooks/chart/useChartSectionInit.ts
 * チャートセクションの初期化とデータフェッチを担当するフック
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: useChartDataStoreをuseRootStoreに置き換え
 * - 更新: 古いuseSymbolStoreをrootStoreのSymbolSliceに置き換え
 */

import { useEffect, useCallback } from 'react';
// useSymbolStoreを削除
import { useRootStore } from '@/store';
import type { Timeframe } from '@/types/chart';
import type { ExchangeType } from '@/types/api';
import { logger } from '@/utils/logger';

interface UseChartSectionInitProps {
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  exchangeType: ExchangeType;
  initializeApi: (exchangeType: ExchangeType) => void;
  fetchChartData: (symbol: string, timeframe: Timeframe) => void;
}

/**
 * チャートセクションの初期化とデータフェッチを担当するフック
 * 
 * - APIクライアントの初期化
 * - チャートデータのフェッチ
 * - 依存関係の変更に応じた再初期化
 */
export const useChartSectionInit = ({
  currentSymbol,
  currentTimeFrame,
  exchangeType,
  initializeApi,
  fetchChartData
}: UseChartSectionInitProps) => {
  // チャートデータをフェッチする関数
  const fetchData = useCallback(() => {
    // 最新のシンボルとタイムフレームを取得（すべてrootStoreから）
    const rootState = useRootStore.getState();
    const latestSymbol = rootState.currentSymbol;
    const latestTimeFrame = rootState.currentTimeFrame;
    
    logger.info(`チャートデータをフェッチします: シンボル=${latestSymbol}, タイムフレーム=${latestTimeFrame}`, {
      component: 'useChartSectionInit',
      action: 'fetchData',
      symbol: latestSymbol,
      timeframe: latestTimeFrame,
      exchangeType
    });
    
    // 関数が存在することを確認してからフェッチ
    if (typeof fetchChartData === 'function') {
      fetchChartData(latestSymbol, latestTimeFrame);
    } else {
      logger.error('fetchChartData関数が見つかりません', {
        component: 'useChartSectionInit',
        action: 'fetchData',
        fetchChartData
      });
    }
  }, [fetchChartData, exchangeType]);

  // 初期化処理: APIクライアントの初期化とデータフェッチ
  useEffect(() => {
    logger.info('チャートセクションを初期化しています', {
      component: 'useChartSectionInit',
      action: 'initialize',
      symbol: currentSymbol,
      timeframe: currentTimeFrame,
      exchangeType
    });
    
    // 共通のソケットサービスを使用してAPIクライアントを初期化
    initializeApi(exchangeType);
    
    // 初期データを取得
    fetchData();
    
  }, [currentSymbol, currentTimeFrame, exchangeType, initializeApi, fetchData]);

  // exchangeTypeが変更されたときにリアルタイムAPIクライアントを再初期化
  useEffect(() => {
    logger.info('取引タイプが変更されました、APIクライアントを再初期化します', {
      component: 'useChartSectionInit',
      action: 'reinitialize',
      exchangeType
    });
    
    // 共通のソケットサービスを使用してAPIクライアントを初期化
    initializeApi(exchangeType);
  }, [exchangeType, initializeApi]);

  // 再試行用の関数を返す
  return {
    fetchData
  };
}; 