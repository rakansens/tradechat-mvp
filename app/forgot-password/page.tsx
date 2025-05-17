'use client';

/**
 * パスワードリセットページ
 * 作成日: 2025/6/15
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
      toast({
        title: 'パスワードリセットメール送信完了',
        description: 'パスワードリセット用のメールを送信しました。メールの指示に従ってください。',
      });
      
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: error.message || 'パスワードリセットメールの送信に失敗しました。再度お試しください。',
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
          <h1 className="text-2xl font-bold tracking-tight">パスワードをリセット</h1>
          <p className="text-sm text-muted-foreground mt-2">
            登録メールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              <p>パスワードリセット用のメールを送信しました。</p>
              <p className="mt-2">メールの指示に従ってパスワードをリセットしてください。</p>
            </div>
            
            <Button asChild className="mt-4">
              <Link href="/signin">ログインページに戻る</Link>
            </Button>
          </div>
        ) : (
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

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
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