# 型定義ファイル構造

## 概要
このディレクトリには、アプリケーション全体で使用される型定義が含まれています。
T-6フェーズで型定義の整理と重複解消を行いました。

## ディレクトリ構造

```
types/
├── chart/            # チャート関連の型定義
├── common/           # 共通の型定義（複数の場所で使用される型）
│   ├── orderbook.ts  # オーダーブック関連の共通型定義
│   └── ...
├── entry/            # エントリー（取引）関連の型定義
│   ├── base.ts       # 基本的なエントリー型
│   ├── supabase.ts   # Supabaseとの連携用の型変換関数
│   └── ...
├── generated/        # 自動生成された型定義
├── network/          # ネットワーク通信関連の型定義
│   ├── api.ts        # API通信用の型
│   ├── supabase.ts   # Supabaseスキーマから生成された型
│   └── ...
├── symbol/           # 銘柄関連の型定義
├── ui/               # UI関連の型定義
└── validations/      # バリデーション関連の型定義
```

## 型定義の重複と循環依存の解決

T-6フェーズでは、以下の問題に対処しました：

1. **型の重複**
   - OrderBookEntry、OrderBookDataなどの重複した型定義を整理
   - 共通モジュール（common/orderbook.ts）に集約し、他の場所からはインポートのみに変更

2. **循環依存の解消**
   - バレルファイル（index.ts）による循環依存を解消
   - エクスポート順序を考慮し、共通型を先にエクスポート

3. **Supabase型定義の管理**
   - network/supabase.tsに集約
   - 型変換関数を各ドメイン内に配置（例：entry/supabase.ts）

## 非推奨ファイルの段階的削除計画

以下のファイルは非推奨となっており、段階的に削除される予定です：

| ファイル | 代替ファイル | 削除予定フェーズ |
|---------|------------|--------------|
| types/entry.ts | types/entry/base.ts | T-7 |
| types/common.ts | types/common/base.ts | T-7 |
| types/common-interfaces.ts | types/common/interfaces.ts | T-7 |
| types/ui.ts | types/ui/components.ts | T-7 |
| types/symbol.ts | types/symbol/base.ts | T-7 |

## 命名規則と衝突回避

同名の型が異なるモジュールに存在する場合（例：SymbolInfo）は、以下の戦略で対処します：

1. **明示的な名前空間**
   - 例：ChartSymbolInfo vs MarketSymbolInfo

2. **コンテキストを示すプレフィックス**
   - 例：UIButton vs FormButton

## 型定義の利用ガイドライン

1. 型定義をインポートする際は、できるだけ具体的なパスを使用（インデックスファイルを避ける）
   - 良い例: `import { OrderBookEntry } from '@/types/common/orderbook'`
   - 避けるべき例: `import { OrderBookEntry } from '@/types'`

2. 複数のファイルで共有される型は common/ ディレクトリに配置

3. 型の再エクスポートには `export type` を使用
   ```typescript
   export type { OrderBookEntry } from './common/orderbook';
   ```

4. 相対パスを使用して型定義間の依存関係を明確にする
   ```typescript
   // types/chart/index.ts内
   import { OrderBookEntry } from '../common/orderbook';
   ```

## インポート規則

型定義のインポートには次のパターンを使用してください：

```typescript
// 推奨: ドメイン別フォルダからのインポート
import { OHLC } from "types/chart";
import { ChatMessage } from "types/chat";

// 非推奨: 直接ファイルからのインポート
// import { OHLC } from "types/chart.ts"; // ❌
```

## リファクタリング計画

このディレクトリ構造は、型定義をドメイン別に整理し、コードベースの保守性と可読性を向上させるためのリファクタリングプロジェクトの一部です。リファクタリングは以下のフェーズで進められます：

- **T-0** (完了): ドメイン別フォルダー構成と後方互換用バレルファイル
- **T-1** (予定): Chart ドメイン抽出
- **T-2** (予定): Store ドメイン抽出
- **T-3** (予定): Network ドメイン抽出
- **T-4** (予定): UI / Chat / Entry / Symbol 抽出
- **T-5** (予定): 共通 & 廃止掃除
- **T-6** (予定): バレル排除（任意）

リファクタリングが完了するまでの間、互換性のために古い型定義ファイルも維持されます。 
 