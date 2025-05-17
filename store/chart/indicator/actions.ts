// store/chart/indicator/actions.ts
// 作成: IndicatorSliceのアクション定義
// 更新: T-7.5フェーズ - 型インポートパスを修正
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import { v4 as uuidv4 } from 'uuid';
import { type IndicatorType, type IndicatorConfig } from "@/types/store/chart";
import { type IndicatorSliceActions, type IndicatorSlice, type IndicatorSliceState } from "./types";
import { getDefaultIndicatorParams } from "@/utils/chart/indicatorFactory";

/**
 * インジケータースライスのアクションを作成する関数
 */
export const createIndicatorActions = (
  set: (fn: (state: IndicatorSliceState) => void) => void,
  get: () => IndicatorSlice
): IndicatorSliceActions => {
  return {
    // インジケーターを追加
    addIndicator: (indicator: IndicatorConfig) => {
      set((state) => {
        // 既存のインジケーターリストをチェック
        const exists = state.indicators.some(ind => ind.id === indicator.id);
        
        if (!exists) {
          // 新しいインジケーターを追加
          state.indicators.push(indicator);
          
          // アクティブな場合はactiveIndicatorsにも追加
          if (indicator.isActive && !state.activeIndicators.includes(indicator.type)) {
            state.activeIndicators.push(indicator.type);
          }
        }
      });
    },
    
    // インジケーターを削除
    removeIndicator: (id: string) => {
      set((state) => {
        // 削除するインジケーターを見つける
        const indicatorToRemove = state.indicators.find(ind => ind.id === id);
        
        if (indicatorToRemove) {
          // indicatorsから削除
          state.indicators = state.indicators.filter(ind => ind.id !== id);
          
          // activeIndicatorsからも削除（同じタイプの他のインジケーターが無ければ）
          const sameTypeExists = state.indicators.some(
            ind => ind.type === indicatorToRemove.type && ind.isActive
          );
          
          if (!sameTypeExists) {
            state.activeIndicators = state.activeIndicators.filter(
              type => type !== indicatorToRemove.type
            );
          }
        }
      });
    },
    
    // インジケーターの有効/無効を切り替え
    toggleIndicator: (type: IndicatorType) => {
      set((state) => {
        // インジケーターの有効/無効状態を確認
        const isActive = state.activeIndicators.includes(type);
        
        if (isActive) {
          // 有効な場合は無効化
          state.activeIndicators = state.activeIndicators.filter(t => t !== type);
          
          // 対応するインジケーターのisActiveをfalseに設定
          state.indicators.forEach(ind => {
            if (ind.type === type) {
              ind.isActive = false;
            }
          });
        } else {
          // 無効な場合は有効化
          state.activeIndicators.push(type);
          
          // そのタイプのインジケーターが存在しない場合は追加
          const hasIndicator = state.indicators.some(ind => ind.type === type);
          
          if (!hasIndicator) {
            // デフォルトパラメーターでインジケーターを追加
            state.indicators.push({
              id: uuidv4(),
              type: type,
              params: getDefaultIndicatorParams(type),
              isActive: true,
              name: `${type.toUpperCase()}`
            });
          } else {
            // 既存のインジケーターのisActiveをtrueに設定
            state.indicators.forEach(ind => {
              if (ind.type === type) {
                ind.isActive = true;
              }
            });
          }
        }
      });
    },
    
    // インジケーター設定を更新
    updateIndicatorSettings: (id: string, settings: Partial<IndicatorConfig>) => {
      set((state) => {
        const indicatorIndex = state.indicators.findIndex(ind => ind.id === id);
        
        if (indicatorIndex >= 0) {
          // 既存のインジケーターを更新
          Object.assign(state.indicators[indicatorIndex], settings);
          
          // isActiveが変更された場合はactiveIndicatorsも更新
          if (settings.isActive !== undefined) {
            const indicator = state.indicators[indicatorIndex];
            const isInActiveList = state.activeIndicators.includes(indicator.type);
            
            if (settings.isActive && !isInActiveList) {
              // 有効にする場合はリストに追加
              state.activeIndicators.push(indicator.type);
            } else if (!settings.isActive && isInActiveList) {
              // 同じタイプの他のアクティブなインジケーターを確認
              const otherActiveExists = state.indicators.some(
                ind => ind.type === indicator.type && ind.id !== id && ind.isActive
              );
              
              // 他にアクティブなものがない場合のみリストから削除
              if (!otherActiveExists) {
                state.activeIndicators = state.activeIndicators.filter(
                  type => type !== indicator.type
                );
              }
            }
          }
        }
      });
    },
    
    
  };
}; 