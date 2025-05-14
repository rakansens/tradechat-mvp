'use client';

/**
 * サインインページ
 * 作成日: 2025/6/15
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'ログイン成功',
        description: 'ダッシュボードにリダイレクトします',
      });
      
    } catch (error: any) {
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg border shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">トレードチャットにログイン</h1>
          <p className="text-sm text-muted-foreground mt-2">
            アカウント情報を入力してログインしてください
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
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
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
    </div>
  );
} 