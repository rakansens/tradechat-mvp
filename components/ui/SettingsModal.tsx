'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getUserSettings, updateUserSettings } from '@/lib/supabase/features/settings';
import { useAuth } from '@/hooks/auth/useAuth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({
    theme: 'dark',
    notifications: {
      enabled: true,
      chatAlerts: true,
      tradeAlerts: true,
    },
    trading: {
      defaultLeverage: 1,
      confirmTrades: true,
      showIndicators: true,
    },
    display: {
      compactMode: false,
      showVolume: true,
      showGrid: true,
    },
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchSettings();
    }
  }, [isOpen, user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Supabaseから直接設定を取得
      const userSettings = await getUserSettings(user.id);
      
      if (userSettings && Object.keys(userSettings).length > 0) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error);
      toast({
        title: '設定の取得に失敗しました',
        description: '設定を読み込めませんでした。後でもう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Supabaseに直接設定を保存
      await updateUserSettings(user.id, settings);
      
      toast({
        title: '設定を保存しました',
        description: '設定が正常に更新されました。',
      });
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      toast({
        title: '設定の保存に失敗しました',
        description: '設定を保存できませんでした。後でもう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // テーマを適用
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (settings.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">アプリケーション設定</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="general">全般</TabsTrigger>
              <TabsTrigger value="trading">トレーディング</TabsTrigger>
              <TabsTrigger value="notifications">通知</TabsTrigger>
              <TabsTrigger value="display">表示</TabsTrigger>
              <TabsTrigger value="account">アカウント</TabsTrigger>
            </TabsList>

            {/* 全般設定 */}
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">テーマ</Label>
                <select
                  id="theme"
                  className="w-full p-2 border rounded bg-background"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                >
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                  <option value="system">システム設定に合わせる</option>
                </select>
              </div>
            </TabsContent>

            {/* トレーディング設定 */}
            <TabsContent value="trading" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leverage">デフォルトレバレッジ</Label>
                <Input
                  id="leverage"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.trading.defaultLeverage}
                  onChange={(e) => 
                    setSettings({
                      ...settings,
                      trading: {
                        ...settings.trading,
                        defaultLeverage: parseInt(e.target.value) || 1
                      }
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="confirm-trades"
                  checked={settings.trading.confirmTrades}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      trading: { ...settings.trading, confirmTrades: checked }
                    })
                  }
                />
                <Label htmlFor="confirm-trades">トレード前に確認する</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-indicators"
                  checked={settings.trading.showIndicators}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      trading: { ...settings.trading, showIndicators: checked }
                    })
                  }
                />
                <Label htmlFor="show-indicators">インジケーターを表示する</Label>
              </div>
            </TabsContent>

            {/* 通知設定 */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-notifications"
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, enabled: checked }
                    })
                  }
                />
                <Label htmlFor="enable-notifications">通知を有効にする</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="chat-alerts"
                  checked={settings.notifications.chatAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, chatAlerts: checked }
                    })
                  }
                  disabled={!settings.notifications.enabled}
                />
                <Label htmlFor="chat-alerts">チャットメッセージの通知</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="trade-alerts"
                  checked={settings.notifications.tradeAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, tradeAlerts: checked }
                    })
                  }
                  disabled={!settings.notifications.enabled}
                />
                <Label htmlFor="trade-alerts">トレードアラートの通知</Label>
              </div>
            </TabsContent>

            {/* 表示設定 */}
            <TabsContent value="display" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="compact-mode"
                  checked={settings.display.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, compactMode: checked }
                    })
                  }
                />
                <Label htmlFor="compact-mode">コンパクトモード</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-volume"
                  checked={settings.display.showVolume}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, showVolume: checked }
                    })
                  }
                />
                <Label htmlFor="show-volume">出来高を表示</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-grid"
                  checked={settings.display.showGrid}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      display: { ...settings.display, showGrid: checked }
                    })
                  }
                />
                <Label htmlFor="show-grid">グリッドを表示</Label>
              </div>
            </TabsContent>

            {/* アカウント設定 */}
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  アカウント情報の変更やパスワードのリセットが必要な場合は、管理者にお問い合わせください。
                </div>
              </div>
            </TabsContent>

            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={saveSettings} disabled={isSaving || !user}>
                {isSaving ? '保存中...' : '設定を保存'}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 