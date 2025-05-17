'use client';

/**
 * サインアップページ
 * 作成日: 2025/6/15
 * 更新日: 2025/6/25 - サインアップ処理のデバッグを強化
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('サインアップフォームが送信されました', { email });
    
    // パスワード確認チェック
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
      console.log('サインアップAPI呼び出し前', { email, passwordLength: password.length });
      const { data, error } = await signUp(email, password);
      console.log('サインアップ結果', { data, error });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'アカウント作成成功',
        description: '確認メールをご確認ください。メール認証後にログインできます。',
      });
      
      // 成功したらサインインページにリダイレクト
      router.push('/auth-client/signin');
      
    } catch (error: any) {
      console.error('サインアップエラー詳細:', error);
      toast({
        title: 'アカウント作成エラー',
        description: error.message || '登録に失敗しました。入力内容を確認してください。',
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
          <h1 className="text-2xl font-bold tracking-tight">トレードチャットに新規登録</h1>
          <p className="text-sm text-muted-foreground mt-2">
            アカウント情報を入力して新規登録してください
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
            <Label htmlFor="password">パスワード</Label>
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
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
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
            onClick={() => console.log('アカウント作成ボタンがクリックされました')}
          >
            {isSubmitting ? '登録中...' : 'アカウント作成'}
          </Button>
        </form>

        <div className="text-center text-sm mt-4">
          <p className="text-muted-foreground">
            既にアカウントをお持ちの場合は、
            <Link href="/auth-client/signin" className="text-primary hover:underline">
              ログイン
            </Link>
            してください
          </p>
        </div>
      </div>
    </div>
  );
} 