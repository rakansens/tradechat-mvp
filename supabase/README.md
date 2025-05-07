# Supabaseデータベース設定

このディレクトリには、tradechat-mvpプロジェクトのSupabaseデータベース設定が含まれています。

## 概要

Supabaseは、PostgreSQLデータベースをベースにした、オープンソースのFirebase代替サービスです。このプロジェクトでは、以下の機能を利用しています：

- PostgreSQLデータベース
- 認証機能
- Row Level Security (RLS)
- リアルタイム更新
- ストレージ

## ディレクトリ構造

```
supabase/
├── config.toml        # Supabase CLI設定ファイル
├── migrations/        # マイグレーションファイル
│   ├── 00_schema.sql  # スキーマ定義
│   ├── 01_tables.sql  # テーブル作成
│   ├── 02_rls.sql     # RLSポリシー設定
│   ├── 03_indexes.sql # インデックス作成
│   └── 04_initial_data.sql # 初期データ投入
└── README.md          # このファイル
```

## セットアップ手順

### 前提条件

- [Supabase CLI](https://supabase.com/docs/guides/cli)がインストールされていること
- [Docker](https://www.docker.com/)がインストールされていること（ローカル開発用）

### ローカル開発環境のセットアップ

1. Supabase CLIをインストールします：

```bash
npm install -g supabase
```

2. ローカルのSupabaseを起動します：

```bash
supabase start
```

3. マイグレーションを適用します：

```bash
./scripts/apply-migrations.sh --local
```

### 本番環境のセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成します。

2. Supabase CLIにログインします：

```bash
supabase login
```

3. プロジェクトをリンクします：

```bash
supabase link --project-ref <your-project-ref>
```

4. マイグレーションを適用します：

```bash
./scripts/apply-migrations.sh --remote
```

## データモデル

詳細なデータモデルについては、[データベースアーキテクチャ設計書](../docs/supabase-database-architecture.md)を参照してください。

主要なテーブルは以下の通りです：

- `users` - ユーザー情報
- `profiles` - ユーザープロフィール
- `chat_messages` - チャットメッセージ
- `chat_images` - チャット画像
- `entries` - トレードエントリー
- `symbol_settings` - シンボル設定
- `chart_settings` - チャート設定
- `indicator_settings` - インジケーター設定
- `cached_data` - キャッシュデータ
- `user_relations` - ユーザー関係
- `backtest_data` - バックテストデータ

## セキュリティ

セキュリティとRLSポリシーの詳細については、[データベースセキュリティ設計書](../docs/supabase-database-security.md)を参照してください。

主なセキュリティ機能は以下の通りです：

- Row Level Security (RLS)によるデータアクセス制御
- ユーザー認証と権限管理
- 管理者特権の設定

## 運用ガイドライン

### マイグレーションの追加

新しいマイグレーションを追加する場合は、以下の手順に従ってください：

1. `migrations/supabase/`ディレクトリに新しいSQLファイルを作成します。
2. ファイル名は`<番号>_<説明>.sql`の形式にします（例：`05_add_new_table.sql`）。
3. マイグレーションスクリプトを実行して適用します。

### バックアップと復元

バックアップを作成するには：

```bash
supabase db dump -f backup.sql
```

バックアップから復元するには：

```bash
supabase db reset --db-url <connection-string>
psql <connection-string> -f backup.sql
```

## トラブルシューティング

### よくある問題

1. **マイグレーションエラー**

   マイグレーション適用時にエラーが発生した場合は、エラーメッセージを確認し、SQLスクリプトを修正してください。

2. **RLSポリシーの問題**

   データアクセスに問題がある場合は、RLSポリシーが正しく設定されているか確認してください。

3. **接続エラー**

   Supabaseへの接続エラーが発生した場合は、APIキーとURLが正しいか確認してください。

### サポート

問題が解決しない場合は、以下のリソースを参照してください：

- [Supabaseドキュメント](https://supabase.com/docs)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabaseフォーラム](https://github.com/supabase/supabase/discussions)