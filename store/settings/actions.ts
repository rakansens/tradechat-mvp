// store/settings/actions.ts
// 設定ストアのアクション
// 作成日: 2025/6/X - 設定ストアのリファクタリング
// 更新日: 2025/6/X - useToast依存を削除し、カスタムイベントを使用するように修正

import { SettingsActions, SettingsState, UserSettings, ChartSettings, SymbolSettings } from './types';

// トースト表示用イベントの型定義
interface ToastEvent {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

// 設定ストアのアクション作成関数
export const createSettingsActions = (
  set: (fn: (state: SettingsState) => void) => void,
  get: () => SettingsState
): SettingsActions => {
  // トースト通知用ヘルパー
  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    // カスタムイベントを発行
    const toastEvent = new CustomEvent('showToast', {
      detail: { title, description, variant } as ToastEvent
    });
    window.dispatchEvent(toastEvent);
  };

  return {
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
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('設定取得エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('チャート設定取得エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('シンボル設定取得エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        
        showToast('更新完了', '設定が保存されました');
        return updatedSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('設定更新エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        
        showToast('更新完了', 'チャート設定が保存されました');
        return updatedSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('チャート設定更新エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        
        showToast('更新完了', 'シンボル設定が保存されました');
        return updatedSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('シンボル設定更新エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        
        showToast('作成完了', 'チャート設定が作成されました');
        return newSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('チャート設定作成エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
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
        
        showToast('作成完了', 'シンボル設定が作成されました');
        return newSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error('シンボル設定作成エラー:', error);
        
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        
        showToast('エラー', 'シンボル設定の作成に失敗しました', 'destructive');
        throw error;
      }
    },
  };
}; 