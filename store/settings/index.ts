// store/settings/index.ts
// ユーザー設定管理ストア
// 作成日: 2025/6/2

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useToast } from '@/components/ui/use-toast';

/**
 * 設定の型定義
 */
export interface ChartSettings {
  id: string;
  timeframe: string;
  chart_type: string;
  show_volume: boolean;
  show_grid: boolean;
  show_legend: boolean;
  theme: string;
}

export interface SymbolSettings {
  symbol: string;
  is_favorite: boolean;
  display_order: number;
}

export type UserSettings = Record<string, any>;

/**
 * 設定ストアの状態の型定義
 */
export interface SettingsState {
  // 状態
  userSettings: UserSettings | null;
  chartSettings: ChartSettings[] | null;
  symbolSettings: SymbolSettings[] | null;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchUserSettings: () => Promise<void>;
  fetchChartSettings: () => Promise<void>;
  fetchSymbolSettings: () => Promise<void>;
  updateUserSettings: (settings: UserSettings) => Promise<void>;
  updateChartSettings: (settings: ChartSettings) => Promise<void>;
  updateSymbolSettings: (settings: SymbolSettings | SymbolSettings[]) => Promise<void>;
  createSymbolSettings: (settings: Omit<SymbolSettings, 'id'>) => Promise<void>;
  createChartSettings: (settings: Omit<ChartSettings, 'id'>) => Promise<void>;
}

/**
 * 設定ストアの作成
 */
export const useSettingsStore = create<SettingsState>()(
  immer((set, get) => ({
    // 初期状態
    userSettings: null,
    chartSettings: null,
    symbolSettings: null,
    isLoading: false,
    error: null,
    
    // トースト通知用ヘルパー
    showToast: (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
      try {
        const { toast } = useToast();
        toast({
          title,
          description,
          variant,
        });
      } catch (e) {
        console.error('トースト表示エラー:', e);
      }
    },
    
    // ユーザー設定を取得するアクション
    fetchUserSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings?type=user');
        
        if (!response.ok) {
          throw new Error(`設定の取得に失敗しました: ${response.statusText}`);
        }
        
        const settings = await response.json();
        
        set((state) => {
          state.userSettings = settings;
          state.isLoading = false;
        });
        
        return settings;
      } catch (error) {
        console.error('設定取得エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', '設定の取得に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // チャート設定を取得するアクション
    fetchChartSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings?type=chart');
        
        if (!response.ok) {
          throw new Error(`チャート設定の取得に失敗しました: ${response.statusText}`);
        }
        
        const settings = await response.json();
        
        set((state) => {
          state.chartSettings = settings;
          state.isLoading = false;
        });
        
        return settings;
      } catch (error) {
        console.error('チャート設定取得エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'チャート設定の取得に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // シンボル設定を取得するアクション
    fetchSymbolSettings: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings?type=symbol');
        
        if (!response.ok) {
          throw new Error(`シンボル設定の取得に失敗しました: ${response.statusText}`);
        }
        
        const settings = await response.json();
        
        set((state) => {
          state.symbolSettings = settings;
          state.isLoading = false;
        });
        
        return settings;
      } catch (error) {
        console.error('シンボル設定取得エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'シンボル設定の取得に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // ユーザー設定を更新するアクション
    updateUserSettings: async (settings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'user',
            settings,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`設定の更新に失敗しました: ${response.statusText}`);
        }
        
        const updatedSettings = await response.json();
        
        set((state) => {
          state.userSettings = updatedSettings;
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('更新完了', '設定が保存されました');
        
        return updatedSettings;
      } catch (error) {
        console.error('設定更新エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', '設定の更新に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // チャート設定を更新するアクション
    updateChartSettings: async (settings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'chart',
            settings,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`チャート設定の更新に失敗しました: ${response.statusText}`);
        }
        
        const updatedSettings = await response.json();
        
        set((state) => {
          // チャート設定配列を更新
          if (state.chartSettings) {
            state.chartSettings = state.chartSettings.map((s) => 
              s.id === updatedSettings.id ? updatedSettings : s
            );
          } else {
            state.chartSettings = [updatedSettings];
          }
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('更新完了', 'チャート設定が保存されました');
        
        return updatedSettings;
      } catch (error) {
        console.error('チャート設定更新エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'チャート設定の更新に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // シンボル設定を更新するアクション
    updateSymbolSettings: async (settings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'symbol',
            settings,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`シンボル設定の更新に失敗しました: ${response.statusText}`);
        }
        
        const updatedSettings = await response.json();
        
        set((state) => {
          // 更新が単一か複数かで処理を分ける
          if (Array.isArray(updatedSettings)) {
            // 複数のシンボル設定を更新
            const updatedSymbols = updatedSettings.map((s) => s.symbol);
            if (state.symbolSettings) {
              state.symbolSettings = state.symbolSettings.filter(
                (s) => !updatedSymbols.includes(s.symbol)
              ).concat(updatedSettings);
            } else {
              state.symbolSettings = updatedSettings;
            }
          } else {
            // 単一のシンボル設定を更新
            if (state.symbolSettings) {
              state.symbolSettings = state.symbolSettings.map((s) => 
                s.symbol === updatedSettings.symbol ? updatedSettings : s
              );
              
              // 存在しない場合は追加
              if (!state.symbolSettings.some((s) => s.symbol === updatedSettings.symbol)) {
                state.symbolSettings.push(updatedSettings);
              }
            } else {
              state.symbolSettings = [updatedSettings];
            }
          }
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('更新完了', 'シンボル設定が保存されました');
        
        return updatedSettings;
      } catch (error) {
        console.error('シンボル設定更新エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'シンボル設定の更新に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // チャート設定を作成するアクション
    createChartSettings: async (settings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'chart',
            settings,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`チャート設定の作成に失敗しました: ${response.statusText}`);
        }
        
        const newSettings = await response.json();
        
        set((state) => {
          if (state.chartSettings) {
            state.chartSettings.push(newSettings);
          } else {
            state.chartSettings = [newSettings];
          }
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('作成完了', 'チャート設定が作成されました');
        
        return newSettings;
      } catch (error) {
        console.error('チャート設定作成エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'チャート設定の作成に失敗しました', 'destructive');
        
        throw error;
      }
    },
    
    // シンボル設定を作成するアクション
    createSymbolSettings: async (settings) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });
      
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'symbol',
            settings,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`シンボル設定の作成に失敗しました: ${response.statusText}`);
        }
        
        const newSettings = await response.json();
        
        set((state) => {
          if (state.symbolSettings) {
            state.symbolSettings.push(newSettings);
          } else {
            state.symbolSettings = [newSettings];
          }
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('作成完了', 'シンボル設定が作成されました');
        
        return newSettings;
      } catch (error) {
        console.error('シンボル設定作成エラー:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : '不明なエラー';
          state.isLoading = false;
        });
        
        const { showToast } = get() as any;
        showToast('エラー', 'シンボル設定の作成に失敗しました', 'destructive');
        
        throw error;
      }
    },
  }))
); 