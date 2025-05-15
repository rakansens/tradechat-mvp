# Supabase クライアント使用ルール

## 基本方針

本プロジェクトでは、Supabase クライアントの使用に関して以下のルールを統一します。

### 1. 環境別クライアント使用

- **サーバー環境**: `@/lib/supabase/server` からクライアントをインポート
  ```ts
  import { createClient } from '@/lib/supabase/server';
  ```

- **クライアント環境**: `@/lib/supabase/client` からクライアントをインポート
  ```ts
  import { createClient } from '@/lib/supabase/client';
  ```

- **旧 `supabase.ts` クライアント**: 非推奨。新規コードでは使用しないでください。

### 2. 機能モジュールでの依存性注入

`features/*` ディレクトリのユーティリティ関数では、以下の方針に従ってください：

```ts
// ✅ 推奨: クライアントを引数として受け取る
export const someFunction = async (
  params: SomeParams, 
  supabaseClient = createClient() // デフォルト値としてクライアントを指定
) => {
  // supabaseClient を使用した処理
};
```

この方式により:
- SSR/CSR どちらでも使用可能なコードになります
- テスト時にモックの注入が容易になります
- 同一セッションで複数のDB操作を行う場合に接続を再利用できます

### 3. 実装例

**memory.ts** の実装パターンを参考にしてください：

```ts
export const getMemories = async (
  userId: string,
  limit = 10,
  supabaseClient = createClient()
) => {
  const { data, error } = await supabaseClient
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .limit(limit);

  if (error) throw error;
  return data;
};
```

### 4. テスト時の注意点

テストでは明示的にモックを指定します：

```ts
const mockClient = {
  from: () => ({
    select: jest.fn().mockReturnThis(),
    // 必要に応じてメソッドをモック
  })
} as unknown as SupabaseClient;

// テスト対象の関数にモックを渡す
await someFunction(params, mockClient);
```

## 移行ガイド

既存のコードを新しいパターンに移行する際は:

1. `import { supabase } from '@/lib/supabase'` を削除
2. `import { createClient } from '@/lib/supabase/client'` または `/server` に置き換え
3. 関数シグネチャを更新して `supabaseClient` パラメータを追加
4. `supabase` の参照を全て `supabaseClient` に置き換え

## セキュリティ上の注意点

- RLS (Row Level Security) はすべてのテーブルで有効にしてください
- クライアントサイドでのクエリは必ず RLS を考慮して設計してください
- 機密性の高いデータを扱う場合は、サーバーサイドのエンドポイントを作成してください

## マイグレーション検証とテスト手順

### ローカル開発環境でのテスト

1. Supabaseローカルインスタンスをリセットして最新のマイグレーションを適用:

```bash
# 完全リセット（全データ消去）
supabase db reset --debug

# または現在のデータを保持したまま新規マイグレーションのみ適用
supabase db push
```

2. 型定義の更新:

```bash
# スキーマから型定義を生成
supabase gen types typescript --local > types/network/supabase.ts

# 生成された型と既存の型定義にズレがないか確認
git diff types/network/supabase.ts
```

3. テストの実行:

```bash
npm run test
```

### CI環境でのテスト

CI環境では以下の流れでテストを実行します:

1. Supabaseの起動:
```bash
supabase start
```

2. マイグレーションの適用:
```bash
supabase db push
```

3. テストの実行:
```bash
npm run test
```

### RLSポリシーの検証

ポリシーの整合性を確認するための方法:

```bash
# ポリシーの診断（RLSの重複や矛盾をチェック）
supabase db lint --level=warning

# インタラクティブシェルで直接ポリシーをテスト
supabase db remote shell

# シェル内でのテスト例
SET ROLE authenticated;
SET request.jwt.claims.sub='test-user-id';
SELECT * FROM profiles; -- 自分のプロフィールのみ取得できることを確認
``` 