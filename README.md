# TradeChat MVP Exchange

## ユーティリティマップ

このプロジェクトのユーティリティは以下のように整理されています。コードを追加する際は適切な場所に配置してください。

### utils/ - 純粋な関数とユーティリティ

純粋関数や副作用のないユーティリティを格納します。外部APIやDBへの依存は含みません。

* `utils/common/` - 共通ユーティリティ関数
  * `date.ts` - 日付フォーマットと計算
  * `format.ts` - 文字列、数値フォーマット
  * `logger.ts` - ロギングユーティリティ

* `utils/chart/` - チャート関連の計算と整形
  * `chart.ts` - 基本的なチャート機能
  * `chartUtils.ts` - チャート描画と操作
  * `indicators.ts` - チャート指標計算
  * `indicatorFactory.ts` - 指標生成

* `utils/market/` - 市場データ処理
  * `price.ts` - 価格計算と比較
  * `orderbook-utils.ts` - オーダーブック操作
  * `tradeUtils.ts` - 取引関連ユーティリティ

* `utils/position/` - ポジション管理
  * `position.ts` - ポジション基本計算
  * `positionUtils.ts` - ポジション管理ユーティリティ

### lib/ - 外部依存とラッパー

外部サービス、API、データベースとの連携のためのモジュールです。

* `lib/supabase/` - Supabase関連の連携
  * `client.ts` - クライアントサイド用クライアント
  * `server.ts` - サーバーサイド用クライアント
  * `middlewareClient.ts` - ミドルウェア用クライアント
  * `routeHandlerClient.ts` - ルートハンドラ用クライアント
  * `features/` - Supabase機能モジュール
    * `profile.ts` - ユーザープロファイル操作
    * `settings.ts` - 設定関連操作

* `lib/api/` - 外部APIとの接続
  * `bitget.ts` - Bitget API連携
  * `exchange.ts` - 汎用取引所API
  * `market.ts` - 市場データAPI

## 開発ステータス

1. ✅ **完了** - 基本的なチャート描画
2. ✅ **完了** - ユーザー認証(Supabase Auth)
3. ✅ **完了** - リアルタイム市場データ(WebSocket)
4. ✅ **完了** - Supabase連携コードの移行（`utils/supabase` → `lib/supabase`）
5. 🚧 **進行中** - ユーザー設定の永続化
6. 🚧 **進行中** - チャット機能の実装
7. 📅 **予定** - ポジションエントリー管理
8. 📅 **予定** - モバイル対応UI

### 🔄 旧 utils/supabase の完全撤廃 (2025-06-XX)

* utils/supabase は **削除済み**  
* 旧 import はすべて lib/supabase 経由に置換済み  
* tsconfig / Jest / ESLint の paths も 1 本化  
* ESLint ルール `no-restricted-imports` で再発防止  

## セットアップと開発

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test
```

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **状態管理**: Zustand
- **UI**: TailwindCSS, shadcn/ui
- **チャート**: Lightweight Charts
- **バックエンド**: Supabase (Auth, Database, Edge Functions)
- **WebSocket**: Socket.io

## コーディングガイドライン

### インポート規則

- 直接のファイルインポートではなく、インデックスファイル経由でインポートしてください:

```ts
// 良い例
import { formatDate, truncateString } from '@/utils/common';
import { calculateEMA } from '@/utils/chart';

// 悪い例
import { formatDate } from '@/utils/common/date';
import { truncateString } from '@/utils/common/format';
```

### 適切な配置

- **utils/** には副作用のない純粋なユーティリティ関数のみを配置
- **lib/** には外部サービスとの連携コードを配置
- **services/** にはドメイン固有のビジネスロジックと外部連携を配置

## リファクタリング移行ガイド

現在、ユーティリティ関数の整理を行っています。移行期間中は以下の点に注意してください。

### 移行状況

- [x] ディレクトリ構造の整理
- [x] バレルファイル（index.ts）の追加
- [x] ESLintルールの設定
- [x] 既存コードの参照更新
- [x] 互換性のために古いファイルへのリダイレクトを追加
- [x] Supabase連携コードを `utils/supabase` から `lib/supabase` に移行
- [ ] すべての参照が新しいパスに移行した後に古いリダイレクトファイルを削除

### 移行ヘルパーツール

移行作業をサポートするためのスクリプトがあります：

```bash
# ヘルプを表示
./scripts/migration-helpers.sh

# 古いパスへの参照を検索
./scripts/migration-helpers.sh check-imports

# インポートパスを新しい構造に更新
./scripts/migration-helpers.sh update-imports

# 循環参照をチェック
./scripts/migration-helpers.sh check-circular

# 古いファイルを削除（移行完了後）
./scripts/migration-helpers.sh clean-old-files
```

### 🔄 Supabase連携コードの移行 (2025-06-19)

* `utils/supabase` は **削除済み**  
* 旧 import はすべて `lib/supabase` 経由に置換済み  
* tsconfig / Jest / ESLint の paths も 1 本化  
* ESLint ルール `no-restricted-imports` で再発防止

### 移行タイムライン

1. ✅ **完了** - 新しい構造を準備、バレルファイルの追加
2. ✅ **完了** - 既存コードの参照変更（直接パス）
3. ✅ **完了** - 互換性のためのリダイレクトファイル追加
4. ✅ **完了** - Supabase連携コードの移行（`utils/supabase` → `lib/supabase`