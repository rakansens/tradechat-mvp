# types ディレクトリリファクタリング計画

## 概要

typesディレクトリの型定義をドメイン別に整理し、コードベースの保守性と可読性を向上させるリファクタリングプロジェクトです。このプロジェクトは複数のフェーズ（T-0〜T-6）に分けて実行されます。

## フェーズと目的

| フェーズ | 目的 | 完了条件 | 影響範囲 |
|---------|------|---------|----------|
| T-0 ひな型 | ドメイン別フォルダー構成と後方互換用バレルファイル（types/index.ts）を追加。まだファイルは移動しない。 | types/README.md が存在し、既存のインポートがビルド通過 | プロジェクト全体 |
| T-1 Chart ドメイン抽出 | chart.ts / indicators.ts / market.ts 内で チャート専用 の型を chart/ 配下に移動（data.ts, config.ts などに分割）。バレルで再エクスポート。 | import { OHLC } from "types/chart" が通る | types/*.ts, チャート関連 |
| T-2 Store ドメイン抽出 | 1) types/store.ts を削除<br>2) 各スライスの型を対応するスライス横へ（例: store/chart/state.ts → types/store/chart.ts）<br>3) types/store/index.ts に StoreState 合成型 を定義 | 型エラーなし・ビルド時間 < 5 秒 | Zustand スライス & フック |
| T-3 Network ドメイン抽出 | network/ フォルダーを作成し<br>▪ api.ts → network/api.ts<br>▪ websocket.ts → network/ws.ts<br>▪ external-libs.ts → network/external.ts へ移動 | サービス層が型チェック通過 | services レイヤ |
| T-4 UI / Chat / Entry / Symbol 抽出 | それぞれ ui/, chat/, entry/, symbol/ フォルダーを作成し、関連型を移動 | grep "types/xyz.ts" が 0 件 | 各コンポーネント & hooks |
| T-5 共通 & 廃止掃除 | 1) ルートに残った汎用型を common/ に集約<br>2) 使われていない旧ファイルは _legacy-*.ts にリネームし @deprecated 付与<br>3) ESLint no-restricted-imports で旧ファイル直接参照を禁止 | pnpm lint 緑 | 全体 |
| T-6 バレル排除（任意） | バレルをサブフォルダー再エクスポートのみに変更し、全コードを types/chart などへ書換え | grep 'from "types/.*\\.ts"' 0 件 | 全体 |

## 最終的なフォルダー構造

```
types/
  chart/
    data.ts
    config.ts
    series.ts
    indicators/
      bollinger.ts
      macd.ts
    index.ts
  store/
    chart.ts
    entry.ts
    ui.ts
    index.ts
  network/
    api.ts
    ws.ts
    external.ts
  ui/
    modal.ts
    theme.ts
    layout.ts
    index.ts
  chat/
    message.ts
    proposal.ts
    index.ts
  entry/
    order.ts
    pending.ts
    index.ts
  symbol/
    model.ts
    filter.ts
    index.ts
  common/
    date.ts
    price.ts
    app.ts
    index.ts
  global.d.ts
  index.ts          # 後方互換バレル
  README.md
```

## リファクタリングの進め方

- **小さくコミット**: ファイルを1つ動かす → pnpm type-check → コミット
- **codemod は後で**: バレル排除時に一括置換すればOK
- **Zod スキーマ**: validationスキーマはサービス/スライス側に置き、types/にはz.infer<>の型だけ公開
- **ESLint**: eslint-plugin-boundariesとno-restricted-importsでドメイン越境を防止

## 進捗状況

- **T-0** (計画中): ドメイン別フォルダー構成と後方互換用バレルファイル
- **T-1** (未開始): Chart ドメイン抽出
- **T-2** (未開始): Store ドメイン抽出
- **T-3** (未開始): Network ドメイン抽出
- **T-4** (未開始): UI / Chat / Entry / Symbol 抽出
- **T-5** (未開始): 共通 & 廃止掃除
- **T-6** (未開始): バレル排除（任意） 