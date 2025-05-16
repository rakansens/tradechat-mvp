# Supabase Dependency Injection パターン

このドキュメントでは、TradeChatで使用しているSupabaseクライアントのDependency Injection (DI)パターンについて説明します。

## 背景

以前は、各ファイルで直接Supabaseクライアントをインポートして使用していましたが、これにはいくつかの問題がありました：

1. テストが難しい（モックが困難）
2. SSR環境とCSR環境での切り替えが複雑
3. コードの重複

DIパターンを採用することで、これらの問題を解決し、コードの保守性とテスト容易性を向上させています。

## 基本的な使い方

### 1. 機能関数の定義

`lib/supabase/features/` ディレクトリには、Supabaseを使用する関数が格納されています。これらの関数は、最後の引数として オプショナルなSupabaseClientを受け取るようになっています：

```typescript
export const getExtendedProfile = async (
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<UserProfile | null> => {
  const supabase = supabaseClient ?? createClient();
  // 以下、通常の実装...
};
```

### 2. サーバーサイドからの呼び出し

Route HandlerやServer Actionなどのサーバーサイドコードでは、適切なSupabaseクライアントを作成して、関数に渡します：

```typescript
// Route Handlerの例
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { getExtendedProfile } from '@/lib/supabase/features/profile';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // サーバー環境に最適化されたクライアントを作成
  const supabase = await createRouteHandlerClient();
  
  // DIパターンでクライアントを渡す
  const profile = await getExtendedProfile(params.id, supabase);
  
  // 以下、通常の処理...
}
```

### 3. クライアントサイドからの呼び出し

クライアントコンポーネントでは、クライアント用のSupabaseインスタンスを使用します：

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getExtendedProfile } from '@/lib/supabase/features/profile';

export default function ProfileComponent({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    async function loadProfile() {
      // クライアント環境用のSupabaseインスタンス
      const supabase = createClient();
      
      // DIパターンでクライアントを渡す
      const userProfile = await getExtendedProfile(userId, supabase);
      setProfile(userProfile);
    }
    
    loadProfile();
  }, [userId]);
  
  // 以下、通常のレンダリング...
}
```

## 利点

### 1. テスト容易性

DIパターンの最大の利点は、テストが容易になることです：

```typescript
import { getExtendedProfile } from '@/lib/supabase/features/profile';

it('プロフィールを取得できること', async () => {
  // スパイ/モックを作成
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { user_id: 'test-id', display_name: 'Test User' },
      error: null
    })
  };
  
  // モックを注入してテスト
  const profile = await getExtendedProfile('test-id', mockSupabase as any);
  
  // アサーション
  expect(profile).toEqual({ user_id: 'test-id', display_name: 'Test User' });
  expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
});
```

### 2. 環境の分離

サーバーサイドとクライアントサイドで適切なクライアントを使い分けることができます：

- サーバーサイド: `createRouteHandlerClient()`, `createServerActionClient()`
- クライアントサイド: `createClient()`

### 3. 一貫性と型安全性

すべての関数が同じパターンで実装され、`Database`型を使用することで型安全性が向上します。

## ベストプラクティス

1. **常にクライアントを渡す**: サーバーサイドでは常にSupabaseクライアントを作成して渡す
2. **型情報を活用**: `SupabaseClient<Database>`型を使用して型安全性を確保する
3. **フォールバック**: 関数内では`supabaseClient ?? createClient()`でフォールバックを提供する
4. **エラーハンドリング**: 関数内で適切なエラーハンドリングを行う

## 既知の制限

1. サーバーコンポーネントからのデータ取得は、Server Componentsの仕様上の制限により、常に`createClient`を内部で使用します。
2. クライアントが渡されなかった場合のフォールバックは、環境によって異なる動作をする可能性があります。

---

**注意**: DIパターンへの移行は段階的に行われています。古いAPIを使用していると考えられるコードを見つけた場合は、このパターンに移行してください。 