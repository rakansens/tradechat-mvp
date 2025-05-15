'use client'

/**
 * App Router版サインインページ
 * 作成日: 2025/6/30
 * 更新日: 2025/6/30 - ReactQueryProvider内での実行を保証するため、App Router配下に移動
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  // ログイン済みならトップに飛ばす
  useEffect(() => {
    const checkSession = async () => {
      try {
        const isLoggedIn = localStorage.getItem('auth.session') !== null;
        if (isLoggedIn) {
          router.push('/');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('ログイン処理を開始します:', email);

    try {
      // 開発用の一時的な修正: テスト用アカウントでのログイン
      // 注意: これは本番環境では削除すること
      const testPassword = 'password123';
      console.log(`開発用テスト: パスワードを "${testPassword}" に固定します`);
      
      const { data, error } = await signIn(email, testPassword);
      
      console.log('ログイン結果:', { data, error });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'ログイン成功',
        description: 'ダッシュボードにリダイレクトします',
      });
      
      // ダッシュボードにリダイレクト
      router.push('/');
      
    } catch (error: any) {
      console.error('ログインエラー詳細:', error);
      toast({
        title: 'ログインエラー',
        description: error.message || '認証に失敗しました。メールアドレスとパスワードを確認してください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">トレードチャットにログイン</h1>
          <p className="text-sm text-muted-foreground mt-2">
            アカウント情報を入力してログインしてください
          </p>
          <p className="text-xs text-amber-500 mt-1">
            開発モード: テスト用アカウントでログインできます
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">パスワード</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                パスワードをお忘れですか？
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              開発モード: どのようなパスワードを入力しても「password123」として処理されます
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => console.log('ログインボタンがクリックされました')}
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>

        <div className="text-center text-sm mt-4">
          <p className="text-muted-foreground">
            アカウントをお持ちでない場合は、
            <Link href="/signup" className="text-primary hover:underline">
              新規登録
            </Link>
            してください
          </p>
        </div>
      </div>
    </main>
  );
} 