// store/settings/actions.ts
// 設定ストアのアクション
// 作成日: 2025/6/X - 設定ストアのリファクタリング
// 更新日: 2025/6/X - useToast依存を削除し、カスタムイベントを使用するように修正
// 更新日: 2025/6/15 - APIエンドポイント経由からSupabase関数を直接呼び出すように修正
// 更新日: 2025/6/20 - 新しいSupabaseクライアントを使用するように更新
// 更新日: 2025/6/20 - nullsafeヘルパーを統一

import { SettingsActions, SettingsState, UserSettings, ChartSettings, SymbolSettings } from './types';
import { 
  getUserSettings, 
  updateUserSettings,
  getChartSettings,
  createChartSettings,
  updateChartSettings as updateChartSettingsDB,
  getSymbolSettings,
  upsertSymbolSettings
} from '@/lib/supabase/features/settings';
import { createClient } from '@/lib/supabase/client';
// nullsafeヘルパー関数のインポート
import { nullsafe } from '@/utils/type-helpers';

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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseから直接設定を取得
        const settings = await getUserSettings(userId);
        
        set((state) => {
          state.userSettings = settings || {};
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseから直接チャート設定を取得
        const settings = await getChartSettings(userId);
        
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseから直接シンボル設定を取得
        const settings = await getSymbolSettings(userId);
        
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseを使用して直接設定を更新
        await updateUserSettings(userId, settings);
        
        set((state) => {
          state.userSettings = settings;
          state.isLoading = false;
        });
        
        showToast('更新完了', '設定が保存されました');
        return settings;
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        // Supabaseを使用して直接チャート設定を更新
        const updatedSettings = await updateChartSettingsDB(settings.id, settings);
        
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // 単一のシンボル設定更新
        const updatedSettings = await upsertSymbolSettings(
          userId,
          settings.symbol,
          nullsafe.boolean(settings.is_favorite),
          nullsafe.number(settings.display_order)
        );
        
        set((state) => {
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseを使用して直接チャート設定を作成
        const newSettings = await createChartSettings(
          userId,
          settings.timeframe,
          settings.chart_type,
          nullsafe.boolean(settings.show_volume),
          nullsafe.boolean(settings.show_grid),
          nullsafe.boolean(settings.show_legend),
          nullsafe.string(settings.theme)
        );
        
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
        // Supabaseクライアントの初期化
        const supabase = createClient();
        
        // 現在のユーザーIDを取得
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          throw new Error('認証が必要です');
        }
        
        const userId = data.user.id;
        
        // Supabaseを使用して直接シンボル設定を作成
        const newSettings = await upsertSymbolSettings(
          userId,
          settings.symbol,
          nullsafe.boolean(settings.is_favorite),
          nullsafe.number(settings.display_order)
        );
        
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