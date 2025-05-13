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
  * `supabase.ts` - 基本クライアント
  * `supabase-auth.ts` - 認証
  * `supabase-chat.ts` - チャット機能
  * `supabase-entry.ts` - 取引エントリー
  * `supabase-relations.ts` - リレーション操作

### types/ - 型定義

アプリケーション全体で使用される型定義を格納します。

* `types/validations/` - Zodバリデーションスキーマ
  * `market.ts` - 市場データ検証
  * `chart.ts` - チャートデータ検証
  * `price.ts` - 価格データ検証
  * `symbol.ts` - シンボル情報検証

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

### 移行タイムライン

1. ✅ **完了** - 新しい構造を準備、バレルファイルの追加
2. ✅ **完了** - 既存コードの参照変更（直接パス）
3. ✅ **現在** - 互換性のためのリダイレクトファイル追加
4. **フェーズ2** - インデックス経由のインポートに変更
5. **フェーズ3** - 古いファイルとリダイレクトの削除（参照更新完了後）

### 現在のリンターエラーについて

現在、一部のファイルで重複するエクスポートに関するリンターエラーが発生しています。これは移行期間中の一時的なもので、フェーズ3で解消されます。 