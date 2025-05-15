# Supabase SSRクライアント移行計画

## 移行の目的

Next.js 15のApp Router機能を最大限活用するため、Supabaseアクセスを従来の`@supabase/supabase-js`クライアントから、より最適化された`@supabase/ssr`クライアントに移行します。

この移行により以下のメリットが得られます：

- **パフォーマンス向上**: サーバーコンポーネントでの直接データ取得
- **セキュリティ強化**: サーバー側で認証情報を安全に管理
- **開発効率の向上**: コンポーネント種別ごとに最適なクライアント

## ディレクトリ構造

新しいSSR対応のクライアントとビジネスロジックは以下の構造に整理しています：

```
lib/supabase/
├── client.ts                - クライアントコンポーネント用
├── server.ts                - サーバーコンポーネント用
├── middlewareClient.ts      - ミドルウェア用
├── routeHandlerClient.ts    - ルートハンドラー用
├── features/                - 機能モジュール
│   ├── index.ts             - エクスポート管理
│   ├── profile.ts           - プロフィール機能
│   ├── settings.ts          - 設定機能
│   ├── auth.ts              - 認証機能
│   ├── chat.ts              - チャット機能
│   ├── conversations.ts     - 会話機能
│   ├── entry.ts             - エントリー機能
│   ├── api.ts               - API機能
│   ├── backtest.ts          - バックテスト機能
│   ├── cache.ts             - キャッシュ機能
│   ├── memory.ts            - メモリ機能
│   └── relations.ts         - ユーザー関係機能
└── ... (旧ファイル群 - 非推奨)
```

## 移行進捗状況

| モジュール    | 移行状況 | 削除状況 | 優先度 | 
|-------------|---------|---------|-------|
| プロフィール | ✅ 完了  | ✅ 削除済 | 高    |
| 設定         | ✅ 完了  | ✅ 削除済 | 高    |
| 認証         | ✅ 完了  | ✅ 削除済 | 高    |
| チャット      | ✅ 完了  | ✅ 削除済 | 中    |
| 会話         | ✅ 完了  | ✅ 削除済 | 中    |
| エントリー    | ✅ 完了  | ✅ 削除済 | 中    |
| バックテスト  | ✅ 完了  | ✅ 削除済 | 低    |
| API          | ✅ 完了  | ✅ 削除済 | 低    |
| キャッシュ    | ✅ 完了  | ✅ 削除済 | 低    |
| メモリ        | ✅ 完了  | ✅ 削除済 | 低    |
| ユーザー関係  | ✅ 完了  | ✅ 削除済 | 低    |

## 使用方法

### 1. SSRクライアントのインポート

```typescript
// クライアントコンポーネント
import { createClient } from '@/lib/supabase/client';

// サーバーコンポーネント
import { createClient } from '@/lib/supabase/server';

// ミドルウェア
import { createMiddlewareClient } from '@/lib/supabase/middlewareClient';

// ルートハンドラー
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
```

### 2. 機能モジュールの使用

```typescript
// 個別モジュールのインポート
import { getExtendedProfile } from '@/lib/supabase/features/profile';
import { getUserSettings } from '@/lib/supabase/features/settings';
import { getCurrentUser } from '@/lib/supabase/features/auth';

// または一括インポート
import { getExtendedProfile, getUserSettings, getCurrentUser } from '@/lib/supabase';
```

## 今後の計画

1. ✅ すべての機能モジュールの移行完了
2. ✅ 古いモジュールの削除完了
   - ✅ 参照のないモジュール削除完了（`profile`, `api`, `backtest`, `cache`）
   - ✅ チャットモジュール参照更新・削除完了（`chat`）
   - ✅ 会話モジュール参照更新・削除完了（`conversations`）
   - ✅ 設定モジュール参照更新・削除完了（`settings`）
   - ✅ エントリーモジュール参照更新・削除完了（`entry`）
   - ✅ メモリモジュール参照更新・削除完了（`memory`）
   - ✅ ユーザー関係モジュール参照更新・削除完了（`relations`）
   - ✅ 認証モジュール参照更新・削除完了（`auth`）
3. ✅ モジュール参照の型エラー修正
   - ✅ ソーシャルAPI関連の修正（`followers`, `following`）
   - ✅ テストコードの修正（`entry`, `memory`）
   - ✅ その他のコンポーネント修正
4. ⏳ コンポーネントの最適化
   - ⏳ サーバーコンポーネントでの直接データ取得実装
   - ⏳ クライアントコンポーネントでの createClient() 使用に統一
5. ⏳ パフォーマンス最適化
   - ⏳ SSRの恩恵を最大限に活用した最適化
   - ⏳ キャッシュ戦略の改善

## 古いモジュール参照の更新手順

残りの古いモジュールを削除するには、以下の手順で参照を更新する必要があります：

1. 各モジュールのインポート文を新しいパスに変更
   ```typescript
   // 古いインポート
   import { getCurrentUser } from '@/lib/supabase/features/auth';
   
   // 新しいインポート
   import { getCurrentUser } from '@/lib/supabase/features/auth';
   // または
   import { getCurrentUser } from '@/lib/supabase';
   ```

2. テストコードの更新
   - ユニットテストで古いモジュールをインポートしている箇所を更新

3. 参照を更新後、古いモジュールを削除
   - 参照がなくなったことを確認してから削除する

## 注意事項

- 現在、旧モジュールを使用している箇所は段階的に新モジュールに移行してください
- 新規実装は必ず新しいモジュールを使用してください
- 迷った場合は`@/lib/supabase`からインポートしてください（インデックスファイルからのエクスポート）
- 参照のある古いモジュールは、すべての参照が新しいモジュールに移行されるまで削除しないでください 