# 型定義ファイル構造

## 概要
このディレクトリには、アプリケーション全体で使用される型定義が含まれています。
T-6フェーズで型定義の整理と重複解消を行いました。

## ディレクトリ構造

```
types/
├── chart/            # チャート関連の型定義
│   ├── data.ts       # OHLC・チャートデータの型
│   ├── indicators.ts # インジケーター関連の型
│   ├── symbol.ts     # チャート用シンボルの拡張型
│   └── ...
├── common/           # 共通の型定義（複数の場所で使用される型）
│   ├── orderbook.ts  # オーダーブック関連の共通型定義
│   ├── symbol.ts     # シンボル関連の共通型定義
│   └── ...
├── entry/            # エントリー（取引）関連の型定義
│   ├── base.ts       # 基本的なエントリー型
│   ├── supabase.ts   # Supabaseとの連携用の型変換関数
│   └── ...
├── network/          # ネットワーク通信関連の型定義
│   ├── api.ts        # API通信用の型
│   ├── supabase.ts   # Supabaseスキーマから生成された型
│   └── ...
├── store/            # ストア（状態管理）関連の型定義
│   ├── app.ts        # アプリ全体の状態型
│   ├── chart.ts      # チャートストアの型
│   └── ...
├── ui/               # UI関連の型定義
├── symbol/           # 銘柄関連の型定義
└── validations/      # バリデーション関連の型定義
```

## 型定義の重複と循環依存の解決

T-6フェーズでは、以下の問題に対処しました：

1. **型の重複**
   - `OrderBookEntry`、`OrderBookData`などの重複した型定義を整理
   - 共通モジュール（`common/orderbook.ts`）に集約し、他の場所からはインポートのみに変更
   - `SymbolInfo`も`common/symbol.ts`に集約

2. **循環依存の解消**
   - バレルファイル（`index.ts`）による循環依存を解消
   - エクスポート順序を考慮し、共通型を先にエクスポート
   - 依存方向を一方向に整理：`common → domain → store`

3. **名前衝突の解決**
   - 衝突する型名に接頭辞を追加（例：`FilterOptions` → `StoreFilterOptions`）
   - ドメイン固有の拡張型を作成（例：`ChartSymbolInfo`）

4. **Supabase型変換の管理**
   - 型変換関数を各ドメイン内に配置（例：`entry/supabase.ts`）

## 非推奨ファイルの段階的削除計画

以下のファイルは非推奨となっており、段階的に削除される予定です：

| ファイル | 代替ファイル | 削除予定フェーズ |
|---------|------------|--------------|
| types/entry.ts | types/entry/base.ts | T-7 |
| types/common.ts | types/common/base.ts | T-7 |
| types/common-interfaces.ts | types/common/interfaces.ts | T-7 |
| types/ui.ts | types/ui/components.ts | T-7 |
| types/symbol.ts | types/symbol/base.ts | T-7 |

## 型のインポート規則

1. **直接のインポート**
   - 共通モジュールからの直接インポートを推奨
   ```typescript
   // 良い例
   import { OrderBookEntry } from '@/types/common/orderbook';
   import { SymbolInfo } from '@/types/common/symbol';
   ```

2. **バレルファイルの使用制限**
   - バレルファイル（index.ts）からのインポートは避け、具体的なファイルを指定
   ```typescript
   // 避けるべき例
   import { OrderBookEntry } from '@/types'; // ❌
   ```

3. **型名の衝突回避**
   - 衝突する可能性のある型には接頭辞を使用
   ```typescript
   import { FilterOptions as UIFilterOptions } from '@/types/ui';
   import { FilterOptions as StoreFilterOptions } from '@/types/store';
   ```

## ESLintルールの追加と型チェック強化

次のステップでは、以下のような対策を検討します：

1. **ESLintルール追加**
   - 非推奨インポートパスの禁止
   - バレルファイルからのインポート制限
   - 命名規則の強制

2. **tsconfig.pathsの最適化**
   - 明示的なインポートパスの定義

3. **型チェックCIの追加**
   - ビルド前の型チェック強化
   - 循環依存の自動検出

## リファクタリングロードマップ

| フェーズ | 説明 | 状態 |
|---------|------|------|
| T-0 | ドメイン別フォルダ構成 | 完了 |
| T-1 | Chart ドメイン抽出 | 完了 |
| T-2 | Store ドメイン抽出 | 完了 |
| T-3 | Network ドメイン抽出 | 完了 |
| T-4 | UI / Chat / Entry / Symbol 抽出 | 完了 |
| T-5 | 共通モジュール整理 | 完了 |
| T-6 | 循環依存解消 | 進行中 |
| T-7 | 非推奨ファイル削除 | 計画中 | 
 