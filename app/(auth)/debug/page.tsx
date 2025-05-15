'use client'

/**
 * Supabase認証のデバッグページ
 * 作成日: 2025/6/30
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  
  // 診断情報を取得
  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      setDiagnostics(data);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // ログインテスト
  const testLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 通常のフェッチAPI使用
      const fetchResponse = await fetch(`${diagnostics?.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const fetchData = await fetchResponse.json();
      
      // 診断情報に追加
      setDiagnostics({
        ...diagnostics,
        loginTest: {
          success: fetchResponse.ok,
          status: fetchResponse.status,
          data: fetchData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      setError(err.message || 'ログインテスト中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // ページ読み込み時に診断を実行
  useEffect(() => {
    fetchDiagnostics();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase認証デバッグ</h1>
      
      {loading && <p className="text-blue-500">読み込み中...</p>}
      {error && <p className="text-red-500">エラー: {error}</p>}
      
      <div className="mb-6">
        <Button onClick={fetchDiagnostics} disabled={loading}>
          診断情報を更新
        </Button>
      </div>
      
      {diagnostics && (
        <div className="space-y-6">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">基本診断</h2>
            <pre className="bg-gray-800 p-4 rounded overflow-auto">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">ログインテスト</h2>
            <form onSubmit={testLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" disabled={loading}>
                ログインテスト実行
              </Button>
            </form>
            
            {diagnostics.loginTest && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">テスト結果</h3>
                <pre className="bg-gray-800 p-4 rounded overflow-auto">
                  {JSON.stringify(diagnostics.loginTest, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 