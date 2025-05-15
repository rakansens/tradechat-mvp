'use client';

/**
 * パスワードリセット完了ページ
 * 作成日: 2025/6/15
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URLパラメーターにトークンがない場合はエラー
    if (!searchParams?.get('token')) {
      setError('無効なリセットリンクです。再度パスワードリセットを行ってください。');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワード確認
    if (password !== confirmPassword) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードと確認用パスワードが一致しません',
        variant: 'destructive',
      });
      return;
    }
    
    // バリデーション - パスワードの強度チェック
    if (password.length < 8) {
      toast({
        title: 'パスワードエラー',
        description: 'パスワードは8文字以上である必要があります',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // URLからトークンを取得
      const token = searchParams?.get('token');
      
      if (!token) {
        throw new Error('無効なリセットトークンです');
      }
      
      // Supabaseクライアントの初期化
      const supabase = createClient();
      
      // パスワードを更新
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      setIsComplete(true);
      toast({
        title: 'パスワード更新完了',
        description: 'パスワードが正常に更新されました。新しいパスワードでログインしてください。',
      });
      
    } catch (error: any) {
      setError(error.message || 'パスワードの更新に失敗しました。再度お試しください。');
      toast({
        title: 'エラー',
        description: error.message || 'パスワードの更新に失敗しました。再度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">パスワードリセット</h1>
          <p className="text-sm text-muted-foreground mt-2">
            新しいパスワードを設定してください
          </p>
        </div>

        {error ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
              <p>{error}</p>
            </div>
            
            <Button asChild className="mt-4">
              <Link href="/forgot-password">パスワードリセットをやり直す</Link>
            </Button>
          </div>
        ) : isComplete ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              <p>パスワードが正常に更新されました。</p>
              <p className="mt-2">新しいパスワードでログインしてください。</p>
            </div>
            
            <Button asChild className="mt-4">
              <Link href="/signin">ログインページへ</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">新しいパスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                8文字以上の安全なパスワードを設定してください
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '更新中...' : 'パスワードを更新'}
            </Button>
            
            <div className="text-center text-sm mt-4">
              <Link href="/signin" className="text-primary hover:underline">
                ログインページに戻る
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 