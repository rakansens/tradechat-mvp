# トレードチャット交換システム - データベース改善統合ガイド

## 変更内容の概要

このPRでは、以下の改善を行いました：

1. **profiles テーブルの拡張**
   - `metadata` JSONBカラムの追加（ユーザーの追加情報保存用）
   - 型定義の整合性確保

2. **RLSポリシーの改善**
   - 重複ポリシーの排除
   - 公開情報と個人情報の分離（`public_profiles` ビュー）
   - すべてのポリシーの冪等化（idempotent）

3. **開発者向けルールの明確化**
   - `createClient()` の使用ルールを文書化
   - ESLintで強制的にチェック
   - 型生成のワークフロー自動化

4. **CI/テスト強化**
   - GitHub Actionsワークフローの追加
   - Supabase CLIキャッシュ設定
   - テスト実行の最適化

## 統合手順

### 1. マージ前チェック

```bash
# 事前検証
supabase db reset --debug   # マイグレーション確認
npm run test                # テスト確認
npm run lint                # ESLintチェック
supabase db lint            # データベース構造チェック
supabase gen types typescript --local > types/generated/supabase.ts  # 型生成
```

### 2. 本番適用手順

```bash
# 開発環境
git checkout -b db-improvements
git pull origin <このPRのブランチ>
supabase db push            # ローカルDB更新

# ステージング環境
supabase db push --db-url=<STAGING_DATABASE_URL>

# CI確認
git push origin db-improvements  # GitHub Actionsで検証

# 本番環境（確認後）
supabase db push --db-url=<PRODUCTION_DATABASE_URL>
```

### 3. アプリケーション側の対応

- `features/profile.ts` の関数で `metadata` フィールドの利用が可能になりました
- クライアントコードでは以下のようにメタデータを利用できます:

```typescript
// プロフィール取得時
const profile = await getProfile(userId);
const tradingExperience = profile.metadata?.trading_experience || 'beginner';

// プロフィール更新時
await updateProfile(userId, {
  display_name: 'New Name',
  metadata: {
    trading_experience: 'advanced',
    twitter_handle: '@trader123',
    // その他のメタデータフィールド
  }
});
```

## 今後の改善点

詳細は `FUTURE-TASKS.md` を参照してください：

- プロフィール編集UIでのmetadata対応
- JSON Schema バリデーションの追加
- RLSテストの自動化

## ドキュメント

- Supabaseクライアント利用ルール: [README-SUPABASE-CLIENT.md](./README-SUPABASE-CLIENT.md)
- CI/テスト設定: [.github/workflows/supabase-tests.yml](./.github/workflows/supabase-tests.yml) 