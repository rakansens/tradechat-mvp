# TradeChat MVP ドキュメント

## 1. プロジェクト概要

TradeChat MVPは、チャットベースで自然言語によりチャート分析・エントリー提案・モック注文実行ができるトレーディングプラットフォームです。AIアシスタントとの対話を通じて、トレーディングの意思決定をサポートします。

### 主要機能

- リアルタイムチャート表示（ローソク足、ライン、バーチャート）
- AIチャットアシスタント
- エントリー提案と実行
- ポジション管理
- 複数の時間枠表示

## 2. 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **状態管理**: Zustand
- **チャート**: lightweight-charts
- **バリデーション**: Zod
- **AI対話**: AI SDK (現在はモック実装)
- **予定バックエンド連携**:
  - MASTRA API
  - Supabase (認証・データベース)

## 3. ディレクトリ構造

\`\`\`
tradechat-mvp/
├── app/                    # Next.js App Router
│   ├── api/                # API ルート
│   │   └── chat/           # チャットAPI
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # メインページ
├── components/             # Reactコンポーネント
│   ├── chart/              # チャート関連コンポーネント
│   ├── chat/               # チャット関連コンポーネント
│   ├── position/           # ポジション関連コンポーネント
│   ├── theme-provider.tsx  # テーマプロバイダー
│   ├── theme-toggle.tsx    # テーマ切替
│   └── ui/                 # UIコンポーネント (shadcn)
├── hooks/                  # カスタムフック
│   ├── useChartConfig.ts   # チャート設定フック
│   ├── useChatInteraction.ts # チャット対話フック
│   ├── useEntries.ts       # エントリー管理フック
│   └── useTimeframe.ts     # 時間枠管理フック
├── lib/                    # ユーティリティ
│   ├── tools/              # AIツール
│   ├── utils.ts            # 汎用ユーティリティ
│   └── validations/        # Zodバリデーション
├── public/                 # 静的ファイル
├── store/                  # Zustandストア
│   └── useStore.ts         # メインストア
├── types/                  # 型定義
│   ├── chart.ts            # チャート関連の型定義
│   ├── chat.ts             # チャット関連の型定義
│   ├── common.ts           # 共通の基本型定義
│   ├── common-interfaces.ts # 共通インターフェース
│   ├── entry.ts            # エントリー関連の型定義
│   ├── external-libs.ts    # 外部ライブラリの型定義
│   └── ui.ts               # UI関連の型定義
├── utils/                  # ユーティリティ関数
│   ├── chart.ts            # チャート関連ユーティリティ
│   ├── date.ts             # 日付処理ユーティリティ
│   ├── format.ts           # フォーマットユーティリティ
│   ├── indicators.ts       # 指標計算ユーティリティ
│   ├── position.ts         # ポジション計算ユーティリティ
│   └── price.ts            # 価格関連ユーティリティ
└── docs/                   # ドキュメント
    ├── README.md           # プロジェクト概要（このファイル）
    ├── type-system.md      # 型システムの説明
    └── components.md       # コンポーネント構造の説明
\`\`\`

## 4. 主要コンポーネント

### 4.1 チャート関連

- **ChartCanvas**: lightweight-chartsを使用したチャート描画
- **ChartSection**: チャート表示エリア全体の管理
- **TimeframeSelector**: 時間枠選択UI

### 4.2 チャット関連

- **ChatSection**: チャットエリア全体の管理
- **ChatWindow**: メッセージ表示
- **InputBox**: メッセージ入力

### 4.3 ポジション関連

- **PositionHistory**: ポジション履歴表示
- **ProposalDetails**: エントリー提案の詳細表示

## 5. 型システム

TypeScriptの型システムを積極的に活用し、型安全性を高めています。詳細は `docs/type-system.md` を参照してください。

### 5.1 型定義の構造

- **ドメイン別の型定義**: 関連する型を論理的にグループ化
- **共通インターフェース**: コンポーネント間で共有されるプロパティとイベントハンドラの型定義
- **Union型とタグ付きUnion**: 状態に応じた型の厳密な定義（例: Entry型）
- **外部ライブラリの型定義**: 一貫した型定義の提供

### 5.2 主要な型定義

```typescript
// エントリー関連の型定義例
export type Entry = OpenEntry | ClosedEntry | CanceledEntry;

// チャート関連の型定義例
export type ChartType = 'candle' | 'line' | 'bar';
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

// 共通インターフェース例
export interface ChartViewProps {
  ohlcData: OHLCData[];
  chartType: ChartType;
  entries?: Entry[];
}
```

## 6. コンポーネント構造

主要コンポーネントの役割と関係性については `docs/components.md` を参照してください。

## 7. 状態管理 (Zustand)

プロジェクトはZustandを使用して状態を一元管理しています。`store/useStore.ts`に以下の状態が定義されています：

### 5.1 主要ステート

\`\`\`typescript
interface StoreState {
  // チャート状態
  timeframe: Timeframe;
  chartType: "candles" | "line" | "bar";
  ohlcData: any[];

  // エントリー状態
  entries: Entry[];
  pendingEntry: Entry | null;

  // チャット状態
  messages: Message[];
  isSearching: boolean;

  // UI状態
  activeTab: string;

  // アクション関数
  // ...
}
\`\`\`

### 5.2 主要アクション

- **チャート**: `setTimeframe`, `setChartType`, `refreshOhlcData`
- **エントリー**: `setPendingEntry`, `executeEntry`, `closePosition`, `cancelPosition`
- **チャット**: `setMessages`, `addMessage`, `handleEntryPointQuery`, `handleNewsQuery`
- **UI**: `setActiveTab`

## 6. データフロー

1. **チャートデータ**:
   - 現在は`generateOHLCData`関数でモックデータを生成
   - 将来的にはMASTRA APIからリアルタイムデータを取得予定

2. **チャット対話**:
   - 現在は`app/api/chat/route.ts`でモック応答を生成
   - 将来的にはAI SDKを使用して実際のAIモデルと連携予定

3. **エントリー管理**:
   - Zustandストアでエントリー状態を管理
   - 将来的にはSUPABASEでユーザーごとのエントリーを永続化予定

## 7. バリデーション

Zodを使用してデータバリデーションを実装しています：

- `lib/validations/entry.ts`: エントリー関連のバリデーション
- `lib/validations/chat.ts`: チャット関連のバリデーション

## 8. MASTRA連携計画

MASTRAバックエンドとの連携は以下の手順で実装予定です：

1. **API連携**:
   \`\`\`typescript
   // lib/api/mastra.ts (作成予定)
   export async function fetchMarketData(symbol: string, timeframe: Timeframe) {
     const response = await fetch(`${process.env.MASTRA_API_URL}/market-data/${symbol}/${timeframe}`);
     if (!response.ok) throw new Error('Failed to fetch market data');
     return response.json();
   }
   \`\`\`

2. **ストアへの統合**:
   \`\`\`typescript
   // store/useStore.ts に追加予定
   fetchMarketData: async (symbol: string) => {
     const { timeframe } = get();
     try {
       const data = await fetchMarketData(symbol, timeframe);
       set({ ohlcData: data });
     } catch (error) {
       console.error('Failed to fetch market data:', error);
     }
   }
   \`\`\`

3. **リアルタイム更新**:
   - WebSocketを使用してリアルタイム価格更新を実装予定

## 9. SUPABASE連携計画

SUPABASEとの連携は以下の機能を実装予定です：

1. **認証**:
   \`\`\`typescript
   // lib/supabase/auth.ts (作成予定)
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );

   export async function signIn(email: string, password: string) {
     return supabase.auth.signInWithPassword({ email, password });
   }
   \`\`\`

2. **データ永続化**:
   \`\`\`typescript
   // lib/supabase/entries.ts (作成予定)
   export async function saveEntry(entry: Entry, userId: string) {
     return supabase
       .from('entries')
       .insert({ ...entry, user_id: userId });
   }
   \`\`\`

3. **ユーザー設定**:
   - ユーザー設定をSUPABASEに保存し、ログイン時に読み込む機能

## 10. 開発環境セットアップ

\`\`\`bash
# リポジトリのクローン
git clone <repository-url>
cd tradechat-mvp

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# 開発サーバーの起動
npm run dev
\`\`\`

### 必要な環境変数

\`\`\`
# MASTRA API (将来的に必要)
MASTRA_API_URL=
MASTRA_API_KEY=

# SUPABASE (将来的に必要)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI SDK (将来的に必要)
OPENAI_API_KEY=
\`\`\`

## 11. コード規約

- **型安全性**: 常にTypeScriptの型を適切に使用する
- **コンポーネント**: 単一責任の原則に従い、小さく再利用可能なコンポーネントを作成
- **状態管理**: UIの状態はローカルで、アプリケーション状態はZustandで管理
- **バリデーション**: ユーザー入力とAPIレスポンスは常にZodでバリデーション
- **エラーハンドリング**: try/catchを使用し、ユーザーフレンドリーなエラーメッセージを表示

## 12. 今後の拡張計画

1. **リアルタイムデータ連携**:
   - MASTRA APIからのリアルタイム市場データ取得
   - WebSocketを使用した価格更新

2. **ユーザー認証と設定**:
   - SUPABASEを使用したユーザー認証
   - ユーザー設定の保存と読み込み

3. **高度なチャート機能**:
   - 複数のテクニカル指標
   - カスタムインジケーター
   - チャート描画ツール

4. **AIアシスタントの強化**:
   - 実際のAIモデルとの連携
   - 市場分析と予測機能
   - パーソナライズされたトレード提案

5. **バックテスト機能**:
   - 過去データを使用した戦略テスト
   - パフォーマンス分析

6. **モバイル対応の強化**:
   - レスポンシブデザインの最適化
   - PWA対応
\`\`\`

## 13. 更新履歴

- 2023-05-01: 初版ドキュメント作成
- 2023-05-01: 型定義の共有問題を修正、Zodバリデーションを追加
