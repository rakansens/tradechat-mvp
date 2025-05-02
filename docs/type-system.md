# TradeChat MVP 型システム

## 1. 型システムの概要

TradeChat MVPでは、型安全性を高め、コードの可読性と保守性を向上させるために、TypeScriptの型システムを積極的に活用しています。このドキュメントでは、プロジェクトで使用されている型定義の設計思想と使い方について説明します。

### 設計思想

- **ドメイン別の型定義**: 関連する型を論理的にグループ化
- **共通インターフェースの抽出**: 重複を避け、一貫性を確保
- **Union型とタグ付きUnion**: 状態に応じた型の厳密な定義
- **外部ライブラリの型定義の共通化**: 一貫した型定義の提供

## 2. 型定義ファイルの構造

```
types/
├── chart.ts              # チャート関連の型定義
├── chat.ts               # チャット関連の型定義
├── common.ts             # 共通の基本型定義
├── common-interfaces.ts  # 共通インターフェース
├── entry.ts              # エントリー関連の型定義
├── external-libs.ts      # 外部ライブラリの型定義
└── ui.ts                 # UI関連の型定義
```

## 3. 主要な型定義

### 3.1 エントリー関連の型定義 (entry.ts)

エントリー（取引ポジション）は状態によって異なる型を持ちます：

```typescript
// 基本エントリー型
export interface BaseEntry {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  entryTime: Date;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
}

// 開いているエントリー
export interface OpenEntry extends BaseEntry {
  status: 'open';
  currentPrice: number;
  unrealizedPnL: number;
}

// 閉じたエントリー
export interface ClosedEntry extends BaseEntry {
  status: 'closed';
  exitPrice: number;
  exitTime: Date;
  realizedPnL: number;
}

// キャンセルされたエントリー
export interface CanceledEntry extends BaseEntry {
  status: 'canceled';
  cancelTime: Date;
  reason: string;
}

// Union型でエントリーを表現
export type Entry = OpenEntry | ClosedEntry | CanceledEntry;
```

### 3.2 チャット関連の型定義 (chat.ts)

```typescript
// 基本メッセージ型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// 拡張メッセージ型
export interface ExtendedMessage extends Message {
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  isProcessing?: boolean;
}

// 添付ファイル型
export interface Attachment {
  type: 'image' | 'chart' | 'link';
  url: string;
  title?: string;
  description?: string;
}
```

### 3.3 チャート関連の型定義 (chart.ts)

```typescript
// OHLCデータ型
export interface OHLCData {
  time: number;
  open: number;
  high: number;
  close: number;
  low: number;
  volume?: number;
}

// チャートタイプ
export type ChartType = 'candle' | 'line' | 'bar';

// 時間枠
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
```

## 4. 共通インターフェース (common-interfaces.ts)

コンポーネント間で共有されるプロパティとイベントハンドラを定義します：

```typescript
// 時間枠制御プロパティ
export interface TimeframeControlProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

// チャートタイプ制御プロパティ
export interface ChartTypeControlProps {
  chartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
}

// チャート表示プロパティ
export interface ChartViewProps {
  ohlcData: OHLCData[];
  chartType: ChartType;
  entries?: Entry[];
}

// メッセージ表示プロパティ
export interface MessageDisplayProps {
  messages: ExtendedMessage[];
  isTyping?: boolean;
}

// トレードアクションプロパティ
export interface TradeActionProps {
  onCreateEntry: (entryData: Omit<BaseEntry, 'id' | 'entryTime'>) => void;
  onCloseEntry: (entryId: string, exitPrice: number) => void;
  onCancelEntry: (entryId: string, reason: string) => void;
}

// ポジションアクションプロパティ
export interface PositionActionProps {
  entries: Entry[];
  onClosePosition: (entryId: string, exitPrice: number) => void;
  onCancelPosition?: (entryId: string, reason: string) => void;
}
```

## 5. 外部ライブラリの型定義 (external-libs.ts)

外部ライブラリの型定義を共通化し、一貫性を確保します：

```typescript
// OpenAI関連の型定義
export namespace OpenAI {
  export type ChatCompletionTool = {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };
  
  // 他のOpenAI関連の型定義...
}

// React Day Picker関連の型定義
export namespace ReactDayPicker {
  export type IconProps = {
    className?: string;
    onClick?: () => void;
  };
  
  // 他のReact Day Picker関連の型定義...
}
```

## 6. 型の使用例

### 6.1 コンポーネントでの使用例

```tsx
import { ChartViewProps, TimeframeControlProps } from '@/types/common-interfaces';
import { OHLCData } from '@/types/chart';

// 複数のインターフェースを組み合わせて使用
interface ChartSectionProps extends ChartViewProps, TimeframeControlProps {
  title?: string;
  isLoading?: boolean;
}

export function ChartSection({
  ohlcData,
  chartType,
  timeframe,
  onTimeframeChange,
  entries,
  title = 'Chart',
  isLoading = false,
}: ChartSectionProps) {
  // コンポーネントの実装...
}
```

### 6.2 型ガードの使用例

```typescript
// エントリーの型を判別する型ガード
export function isOpenEntry(entry: Entry): entry is OpenEntry {
  return entry.status === 'open';
}

export function isClosedEntry(entry: Entry): entry is ClosedEntry {
  return entry.status === 'closed';
}

// 使用例
function calculatePnL(entry: Entry): number {
  if (isOpenEntry(entry)) {
    return entry.unrealizedPnL;
  } else if (isClosedEntry(entry)) {
    return entry.realizedPnL;
  }
  return 0;
}
```

## 7. 型安全性のベストプラクティス

1. **any型の使用を避ける**
   - 具体的な型を定義し、型安全性を確保する
   - 外部ライブラリとの連携時のみ限定的に使用

2. **Union型とタグ付きUnion**
   - 状態に応じた型を厳密に定義
   - 型ガードを使って安全に型を絞り込む

3. **共通インターフェースの活用**
   - 関連するプロパティとイベントハンドラをグループ化
   - コンポーネント間で一貫した型を使用

4. **型の拡張と合成**
   - 基本型を定義し、必要に応じて拡張
   - インターフェースの継承を活用

5. **JSDocコメントの活用**
   - 複雑な型や関数に説明コメントを追加
   - 使用例を含めると理解しやすい

## 8. 今後の拡張

型システムは、以下の方向で拡張する予定です：

1. **APIレスポンスの型定義**
   - バックエンドAPIとの統合時に型安全性を確保
   - Zodスキーマとの連携

2. **状態管理の型強化**
   - Zustandストアの型定義の改善
   - ストア間の依存関係の型安全な管理

3. **テスト用の型ユーティリティ**
   - モックデータ生成のための型ヘルパー
   - テストケースの型安全性の向上
