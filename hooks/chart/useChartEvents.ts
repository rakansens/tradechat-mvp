/**
 * hooks/chart/useChartEvents.ts
 * @deprecated hooks/chart/canvas/useChartEvents.ts に移動しました
 * 
 * チャートのグローバルイベント処理を担当するフック
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 */

import { useEffect } from 'react';
import { logger } from '@/utils/common';
import type { ProductType } from '@/types/constants/enums';
import type { Timeframe } from '@/types/chart';
import { toProductType } from '@/utils/exchangeTypeUtils';

interface ChartEventProps {
  // 銘柄関連
  currentSymbol: string;
  productType: ProductType;
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  setProductType: (type: ProductType) => void;
  
  // チャートデータ関連
  currentTimeFrame: Timeframe;
  fetchData: (symbol: string, timeframe: Timeframe) => void;
}

/**
 * チャートのグローバルイベント（取引種別変更、銘柄変更）をリッスンするフック
 * 
 * instrumentTypeChanged: 取引種別変更イベント
 * symbolChanged: 銘柄変更イベント
 */
export const useChartEvents = ({
  currentSymbol,
  productType,
  setCurrentSymbol,
  setProductType,
  currentTimeFrame,
  fetchData
}: ChartEventProps) => {
  // ブラウザ環境でない場合は何もしない
  if (typeof window === 'undefined') return;
  
  // 取引種別変更イベントのリスナー
  useEffect(() => {
    const handleInstrumentTypeChange = (event: CustomEvent) => {
      const { type, fromType, symbol } = event.detail;
      const normalizedType = toProductType(type);
      const normalizedFromType = toProductType(fromType);
      const currentProductType = toProductType(productType);
      logger.info(`WebSocketから取引タイプ変更イベントを受信: ${type}`, {
        component: 'useChartEvents',
        action: 'handleInstrumentTypeChange',
        data: event.detail,
        timestamp: Date.now(),
        currentProductType: productType,
        currentSymbol: symbol,
        fromFuturesToSpot: type === 'spot' && (fromType === 'futures' || productType === 'futures') ? '先物→現物の切り替え検出' : '他の切り替えパターン'
      });

      if (normalizedType === 'spot' || normalizedType === 'futures') {
        // イベントから銘柄を取得、なければ現在の銘柄を使用
        const targetSymbol = symbol || currentSymbol || 'BTCUSDT';
        
        logger.info(`取引タイプ変更時の銘柄: ${targetSymbol}`, {
          component: 'useChartEvents',
          action: 'handleInstrumentTypeChange',
          type,
          fromType,
          targetSymbol
        });
        
        // 先物から現物への切り替えの場合、明示的に銘柄を先に設定
        if (type === 'spot' && (fromType === 'futures' || productType === 'futures')) {
          logger.info(`先物から現物への切り替えを検出、銘柄を先に設定: ${targetSymbol}`, {
            component: 'useChartEvents',
            action: 'handleInstrumentTypeChange',
            targetSymbol
          });
          
          // 銘柄を即座に設定
          setCurrentSymbol(targetSymbol, '先物→現物切り替え前の銘柄設定');
        }
        
        // 取引タイプを更新（銘柄を明示的に指定）
        logger.info(`取引タイプを${productType}から${type}に変更します`, {
          component: 'useChartEvents',
          action: 'handleInstrumentTypeChange',
          fromType: productType,
          toType: type,
          symbol: targetSymbol
        });
        
        // 取引タイプを更新
        setProductType(type);
        
        // 現物から先物への切り替えの場合、または銘柄が変更された場合は、取引タイプ変更後に銘柄を再設定
        if ((normalizedType === 'futures' && normalizedFromType === 'spot') || targetSymbol !== currentSymbol) {
          logger.info(`取引タイプ変更後に銘柄を再設定: ${targetSymbol}`, {
            component: 'useChartEvents',
            action: 'handleInstrumentTypeChange',
            targetSymbol
          });
          
          // 少し遅延させて銘柄を再設定
          setTimeout(() => {
            setCurrentSymbol(targetSymbol, '取引タイプ変更後の銘柄再設定');
          }, 100);
        }
      }
    };
    
    // グローバルイベントリスナーを追加
    window.addEventListener('instrumentTypeChanged', handleInstrumentTypeChange as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('instrumentTypeChanged', handleInstrumentTypeChange as EventListener);
    };
  }, [productType, currentSymbol, setProductType, setCurrentSymbol]);
  
  // 銘柄変更イベントのリスナー
  useEffect(() => {
    const handleSymbolChanged = (event: CustomEvent) => {
      const { symbol } = event.detail;
      
      logger.info(`カスタムイベントから銘柄変更イベントを受信: ${symbol}`, {
        component: 'useChartEvents',
        action: 'handleSymbolChanged',
        currentSymbol,
        newSymbol: symbol,
        timestamp: new Date().toISOString()
      });
      
      if (symbol && symbol !== currentSymbol) {
        logger.info(`銘柄を${currentSymbol}から${symbol}に変更します`, {
          component: 'useChartEvents',
          action: 'handleSymbolChanged',
          fromSymbol: currentSymbol,
          toSymbol: symbol
        });
        
        // AppStoreの銘柄を更新
        setCurrentSymbol(symbol, 'カスタムイベントからの銘柄変更');
        
        // データを再取得
        setTimeout(() => {
          fetchData(symbol, currentTimeFrame);
        }, 100);
      }
    };
    
    // グローバルイベントリスナーを追加
    window.addEventListener('symbolChanged', handleSymbolChanged as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('symbolChanged', handleSymbolChanged as EventListener);
    };
  }, [currentSymbol, currentTimeFrame, setCurrentSymbol, fetchData]);
}; 