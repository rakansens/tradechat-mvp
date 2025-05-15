'use client';

/**
 * プロフィール管理モーダルコンポーネント
 * 作成日: 2025/6/15
 * 更新日: 2025/6/20 - 型定義とプロフィールAPIを更新
 * 更新日: 2025/6/20 - 新しいSSRクライアントベースのAPIを使用
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { getExtendedProfile, updateExtendedProfile } from '@/lib/supabase/features/profile';
import { UserProfile } from '@/types/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

// 編集用プロフィール型
interface ExtendedProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  twitterHandle: string;
  tradingExperience: string;
}

export function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ExtendedProfile>({
    displayName: '',
    avatarUrl: '',
    bio: '',
    twitterHandle: '',
    tradingExperience: '',
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const userProfile = await getExtendedProfile(userId);
      
      if (userProfile) {
        // 標準フィールド
        const displayName = userProfile.display_name || '';
        const avatarUrl = userProfile.avatar_url || '';
        const bio = userProfile.bio || '';
        
        // メタデータから追加プロパティを抽出（存在しない場合は空文字列）
        const metadata = userProfile.metadata || {};
        const twitterHandle = metadata.twitter_handle || '';
        const tradingExperience = metadata.trading_experience || '';
        
        setProfile({
          displayName,
          avatarUrl,
          bio,
          twitterHandle,
          tradingExperience,
        });
      }
    } catch (error) {
      console.error('プロフィールの取得に失敗しました:', error);
      toast({
        title: 'プロフィールの取得に失敗しました',
        description: '後でもう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      // 拡張プロフィール更新APIを使用
      await updateExtendedProfile(userId, {
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        metadata: {
          twitter_handle: profile.twitterHandle,
          trading_experience: profile.tradingExperience
        }
      });
      
      toast({
        title: 'プロフィールを保存しました',
        description: 'プロフィール情報が正常に更新されました。',
      });
      
      onClose();
    } catch (error) {
      console.error('プロフィールの保存に失敗しました:', error);
      toast({
        title: 'プロフィールの保存に失敗しました',
        description: '後でもう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">プロフィール設定</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40" role="status">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-2">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="プロフィールアバター" />
                ) : (
                  <div className="bg-primary text-2xl text-white font-bold flex items-center justify-center h-full">
                    {profile.displayName ? profile.displayName[0].toUpperCase() : '?'}
                  </div>
                )}
              </Avatar>
              
              <Button variant="outline" size="sm">
                アバターを変更
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="表示名"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <textarea
                id="bio"
                rows={3}
                className="w-full p-2 rounded-md border bg-background"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="自己紹介（最大200文字）"
                maxLength={200}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitterHandle">Twitter / X ユーザー名</Label>
              <Input
                id="twitterHandle"
                value={profile.twitterHandle}
                onChange={(e) => setProfile({ ...profile, twitterHandle: e.target.value })}
                placeholder="@username（@なしで入力）"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tradingExperience">トレード経験</Label>
              <select
                id="tradingExperience"
                className="w-full p-2 border rounded bg-background"
                value={profile.tradingExperience}
                onChange={(e) => setProfile({ ...profile, tradingExperience: e.target.value })}
              >
                <option value="">選択してください</option>
                <option value="beginner">初心者（1年未満）</option>
                <option value="intermediate">中級者（1〜3年）</option>
                <option value="advanced">上級者（3〜5年）</option>
                <option value="expert">エキスパート（5年以上）</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={saveProfile} disabled={isSaving}>
                {isSaving ? '保存中...' : 'プロフィールを保存'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 