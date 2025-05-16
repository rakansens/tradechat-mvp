# 型定義リファクタリング計画

このディレクトリには、アプリケーション全体で使用される型定義が含まれています。
T-7フェーズで循環依存関係の解消と型定義の整理を行っています。

## アーキテクチャ原則

1. **依存方向**: `common → domain → store` の一方向の依存を維持する
2. **単一出典**: 各型は1箇所でのみ定義し、他の場所では再エクスポートまたはインポートする
3. **バレルファイル**: 各ドメインディレクトリは独自のバレルファイル（index.ts）を持ち、そのドメインの型をエクスポート
4. **型変換**: 異なるレイヤー間の型変換は明示的な変換関数を使用する

## ディレクトリ構造

```
types/
├── common/         # 基本的な共通型定義
│   ├── base.ts     # 基本データ型
│   ├── interfaces.ts # 共通インターフェース
│   ├── symbol.ts   # シンボル関連の基本型
│   └── index.ts    # バレルファイル
├── constants/      # 列挙型と定数値（T-7.3フェーズで追加）
│   ├── enums.ts    # 列挙型定義
│   └── index.ts    # バレルファイル
├── store/          # ストア関連の型定義
│   ├── app.ts      # アプリケーション状態
│   ├── chart.ts    # チャート状態
│   ├── market.ts   # マーケット状態
│   ├── ui.ts       # UI状態
│   └── index.ts    # バレルファイル
├── domain/         # ドメイン固有の型定義
│   └── ...
└── index.ts        # メインバレルファイル
```

## 非推奨ファイル

以下のファイルは非推奨となっており、T-8フェーズで完全に削除される予定です：

- `types/common-interfaces.ts` → `types/common/interfaces.ts`を使用
- `types/store.ts` → 直接`types/store/*`からインポート
- その他の非推奨ファイル（T-8フェーズで完全削除予定）

## リファクタリングフェーズ

### T-7.1: バレルファイル循環依存解消

- [x] `types/index.ts`から`store`系の再エクスポートを削除
- [x] `types/store/index.ts`をストア型の唯一のエクスポート元として明示
- [ ] プロジェクト全体の`import { AppState } from '@/types'`を`@/types/store/app`などへ置換

### T-7.2: ESLint & CI セットアップ

- [x] `.eslintrc.json`に`import/no-cycle`ルールを追加
- [ ] CI設定（必要に応じて）

### T-7.3: constants ディレクトリ新設

- [x] `types/constants/enums.ts`を追加し、列挙型を集約
- [ ] 既存の列挙型/文字列リテラルをconstantsに移行

### T-7.4: codemod 基盤

- [x] `tools/codemods/replace-deprecated-imports.ts`の作成
- [x] `package.json`に`codemod`スクリプトを追加
- [ ] 既存コードのインポートパス修正（手動またはcodemodを使用）

## 推奨インポートスタイル

```typescript
// 良いインポート例
import { SymbolInfo } from '@/types/common/symbol';
import { AppState } from '@/types/store/app';
import { ChartDataState } from '@/types/store/chart';
import { TRADE_SIDES, TradeSide } from '@/types/constants';

// 悪いインポート例（循環参照の原因となる）
import { AppState, ChartDataState } from '@/types';
```

## 型変換ユーティリティ

異なるレイヤー間の型変換には、以下のようなパターンを使用します：

```typescript
// 例: APIレスポースからドメインモデルへの変換
function toUISymbol(apiSymbol: APISymbolResponse): SymbolInfo {
  // 変換ロジック
}

// 例: ドメインモデルからストアモデルへの変換
function toCommonSymbol(uiSymbol: UISymbolModel): SymbolInfo {
  // 変換ロジック
}
```

## 型定義ファイル構造

## 概要
このディレクトリには、アプリケーション全体で使用される型定義が含まれています。
T-7フェーズで型の重複を完全に解消し、依存関係を一方向に整理しました。

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

T-7フェーズでは、以下の問題に対処しました：

1. **型の重複の完全解消**
   - `SymbolInfo`型の重複定義を解消（`common/symbol.ts`に一本化）
   - `FilterOptions`型を`StoreFilterOptions`に統一
   - レガシー型を`LegacySymbolInfo`としてリネームし、変換関数を追加

2. **循環依存の解消**
   - バレルファイル（`index.ts`）の依存方向を固定（common → domain → store）
   - ストア型を明示的なタイプエクスポートでのみ公開

3. **非推奨ファイルのスタブ化**
   - 既存の型定義を削除し、共通モジュールへの参照のみに変更
   - 明確な非推奨マークと移行先の指示を追加

4. **型変換ユーティリティの提供**
   - 異なる命名規則の型間で変換を行う関数を追加
   - 例: `baseAsset`と`baseCoin`のマッピング

## 非推奨ファイルの段階的削除計画

以下のファイルは現在スタブ化され、T-8フェーズで完全に削除される予定です：

| ファイル | 代替ファイル | 削除予定フェーズ |
|---------|------------|--------------|
| types/entry.ts | types/entry/base.ts | T-8 |
| types/common.ts | types/common/base.ts | T-8 |
| types/common-interfaces.ts | types/common/interfaces.ts | T-8 |
| types/ui.ts | types/ui/components.ts | T-8 |
| types/symbol.ts | types/common/symbol.ts | T-8 |

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
   import { StoreFilterOptions } from '@/types/store';
   ```

4. **型変換ユーティリティの利用**
   - 異なる命名規則の型は専用の変換関数を使用
   ```typescript
   import { toUISymbol } from '@/types/symbol/base';
   const uiSymbol = toUISymbol(commonSymbol);
   ```

## ESLintルールの追加と型チェック強化

次のステップでは、以下のような対策を検討します：

1. **ESLintルール追加**
   - 非推奨インポートパスの禁止
   - バレルファイルからのインポート制限
   - 命名規則の強制

2. **tsconfig.pathsの最適化**
   - 明示的なインポートパスの定義
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/types/common/*": ["types/common/*"],
         "@/types/chart/*": ["types/chart/*"],
         "@/types/store/*": ["types/store/*"]
       }
     }
   }
   ```

3. **型チェックCIの追加**
   - ビルド前の型チェック強化
   - 循環依存の自動検出
   - 型重複の検出ルール

## リファクタリングロードマップ

| フェーズ | 説明 | 状態 |
|---------|------|------|
| T-0 | ドメイン別フォルダ構成 | 完了 |
| T-1 | Chart ドメイン抽出 | 完了 |
| T-2 | Store ドメイン抽出 | 完了 |
| T-3 | Network ドメイン抽出 | 完了 |
| T-4 | UI / Chat / Entry / Symbol 抽出 | 完了 |
| T-5 | 共通モジュール整理 | 完了 |
| T-6 | 循環依存解消（第1段階） | 完了 |
| T-7 | 型重複の完全解消 | 完了 |
| T-8 | 非推奨ファイル削除 | 計画中 | 
 