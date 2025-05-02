# TradeChat MVP コンポーネント構造

## 1. コンポーネント設計の概要

TradeChat MVPでは、機能ごとに関連するコンポーネントをグループ化し、共通インターフェースを使用して型安全な連携を実現しています。このドキュメントでは、主要コンポーネントの役割と関係性、およびデータフローについて説明します。

### 設計原則

- **責務の分離**: 各コンポーネントは単一の責務を持つ
- **型安全なプロップス**: 共通インターフェースを使用した型安全な連携
- **コンポーザブル設計**: 小さなコンポーネントを組み合わせて複雑な機能を実現
- **状態管理の分離**: UIとロジックの分離

## 2. コンポーネントの分類

```
components/
├── chart/              # チャート関連コンポーネント
│   ├── ChartSection.tsx    # チャートセクション全体
│   ├── ChartCanvas.tsx     # チャート描画
│   └── TimeframeSelector.tsx # 時間枠選択
├── chat/               # チャット関連コンポーネント
│   ├── ChatSection.tsx     # チャットセクション全体
│   ├── ChatWindow.tsx      # チャットメッセージ表示
│   └── ChatInput.tsx       # チャット入力
├── position/           # ポジション関連コンポーネント
│   ├── PositionHistory.tsx # ポジション履歴
│   └── PositionCard.tsx    # 個別ポジション表示
└── ui/                 # 汎用UIコンポーネント
    ├── Button.tsx          # ボタン
    ├── Card.tsx            # カード
    └── ...                 # その他のUIコンポーネント
```

## 3. 主要コンポーネントの説明

### 3.1 チャート関連コンポーネント

#### ChartSection

チャート関連の機能を統合するコンテナコンポーネントです。

```tsx
// ChartSection.tsx
import { ChartViewProps, TimeframeControlProps } from '@/types/common-interfaces';

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
  // ...
  return (
    <div className="...">
      <div className="flex justify-between items-center">
        <h2>{title}</h2>
        <TimeframeSelector 
          timeframe={timeframe} 
          onTimeframeChange={onTimeframeChange} 
        />
      </div>
      <ChartCanvas 
        ohlcData={ohlcData} 
        chartType={chartType} 
        entries={entries} 
      />
    </div>
  );
}
```

#### ChartCanvas

チャートの描画を担当するコンポーネントです。lightweight-chartsライブラリを使用しています。

```tsx
// ChartCanvas.tsx
import { ChartViewProps } from '@/types/common-interfaces';
import { OHLCData } from '@/types/chart';

export function ChartCanvas({ 
  ohlcData, 
  chartType, 
  entries 
}: ChartViewProps) {
  // チャートの初期化と描画のロジック
  // ...
}
```

#### TimeframeSelector

時間枠を選択するためのコンポーネントです。

```tsx
// TimeframeSelector.tsx
import { TimeframeControlProps } from '@/types/common-interfaces';
import { Timeframe } from '@/types/chart';

export function TimeframeSelector({ 
  timeframe, 
  onTimeframeChange 
}: TimeframeControlProps) {
  const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  
  return (
    <div className="...">
      {timeframes.map((tf) => (
        <button
          key={tf}
          className={`... ${timeframe === tf ? 'active' : ''}`}
          onClick={() => onTimeframeChange(tf)}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
```

### 3.2 チャット関連コンポーネント

#### ChatSection

チャット関連の機能を統合するコンテナコンポーネントです。

```tsx
// ChatSection.tsx
import { MessageDisplayProps, TradeActionProps } from '@/types/common-interfaces';
import { ExtendedMessage } from '@/types/chat';

interface ChatSectionProps extends MessageDisplayProps, TradeActionProps {
  input: string;
  onInputChange: (input: string) => void;
  onSendMessage: () => void;
}

export function ChatSection({
  messages,
  isTyping,
  input,
  onInputChange,
  onSendMessage,
  onCreateEntry,
  onCloseEntry,
  onCancelEntry
}: ChatSectionProps) {
  return (
    <div className="...">
      <ChatWindow 
        messages={messages} 
        isTyping={isTyping} 
        onCreateEntry={onCreateEntry}
        onCloseEntry={onCloseEntry}
        onCancelEntry={onCancelEntry}
      />
      <ChatInput 
        input={input} 
        onInputChange={onInputChange} 
        onSendMessage={onSendMessage} 
      />
    </div>
  );
}
```

#### ChatWindow

チャットメッセージを表示するコンポーネントです。

```tsx
// ChatWindow.tsx
import { MessageDisplayProps, TradeActionProps } from '@/types/common-interfaces';
import { ExtendedMessage } from '@/types/chat';

interface ChatWindowProps extends MessageDisplayProps, TradeActionProps {}

export function ChatWindow({ 
  messages, 
  isTyping,
  onCreateEntry,
  onCloseEntry,
  onCancelEntry
}: ChatWindowProps) {
  // メッセージ表示とトレードアクションの処理
  // ...
}
```

### 3.3 ポジション関連コンポーネント

#### PositionHistory

ポジション履歴を表示するコンポーネントです。

```tsx
// PositionHistory.tsx
import { PositionActionProps } from '@/types/common-interfaces';
import { Entry, isOpenEntry, isClosedEntry } from '@/types/entry';

export function PositionHistory({ 
  entries, 
  onClosePosition,
  onCancelPosition
}: PositionActionProps) {
  // エントリーのフィルタリングと表示
  const openEntries = entries.filter(isOpenEntry);
  const closedEntries = entries.filter(isClosedEntry);
  
  return (
    <div className="...">
      <h3>Open Positions</h3>
      {openEntries.map(entry => (
        <PositionCard 
          key={entry.id} 
          entry={entry} 
          onClosePosition={onClosePosition}
          onCancelPosition={onCancelPosition}
        />
      ))}
      
      <h3>Closed Positions</h3>
      {closedEntries.map(entry => (
        <PositionCard 
          key={entry.id} 
          entry={entry} 
          onClosePosition={onClosePosition}
          onCancelPosition={onCancelPosition}
        />
      ))}
    </div>
  );
}
```

## 4. コンポーネント間のデータフロー

TradeChat MVPでは、Zustandを使用して状態管理を行い、コンポーネント間のデータフローを整理しています。

### 4.1 基本的なデータフロー

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Store     │ ──→ │   親コンポ   │ ──→ │   子コンポ   │
│ (Zustand)   │ ←── │   ーネント   │ ←── │   ーネント   │
└─────────────┘      └─────────────┘      └─────────────┘
      ↑                                          ↑
      │                                          │
      └──────────────── Action ─────────────────┘
```

1. **ストアからデータを取得**: 親コンポーネントがZustandストアからデータを取得
2. **プロップスとして渡す**: 共通インターフェースに基づいて子コンポーネントにプロップスとして渡す
3. **アクションの発行**: 子コンポーネントからのイベントをハンドラで受け取り、ストアのアクションを発行
4. **状態の更新**: ストアが状態を更新し、変更が関連するコンポーネントに反映される

### 4.2 具体的な例: チャート時間枠の変更

```tsx
// app/page.tsx
import { useChartStore } from '@/store/useChartStore';
import { ChartSection } from '@/components/chart/ChartSection';

export default function Home() {
  const { 
    ohlcData, 
    chartType, 
    timeframe, 
    setTimeframe 
  } = useChartStore();
  
  return (
    <main>
      <ChartSection
        ohlcData={ohlcData}
        chartType={chartType}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />
      {/* 他のセクション */}
    </main>
  );
}
```

1. `useChartStore`からチャートデータと時間枠、および時間枠を変更するアクションを取得
2. `ChartSection`コンポーネントにプロップスとして渡す
3. `ChartSection`内の`TimeframeSelector`で時間枠が変更されると、`onTimeframeChange`が呼び出される
4. `setTimeframe`アクションがストアの状態を更新し、関連するコンポーネントが再レンダリングされる

## 5. 型安全なコンポーネント設計のベストプラクティス

1. **共通インターフェースの活用**
   - 関連するプロパティとイベントハンドラを共通インターフェースとして定義
   - コンポーネント間で一貫した型を使用

2. **プロップスの分割と合成**
   - 複数のインターフェースを`extends`で合成
   - 必要に応じてオプショナルプロパティを追加

3. **型ガードの活用**
   - Union型のデータを安全に処理するために型ガードを使用
   - コンポーネント内での条件付きレンダリングを型安全に

4. **デフォルト値の設定**
   - オプショナルプロパティにはデフォルト値を設定
   - 分割代入と共にデフォルト値を指定

5. **コンポーネントの責務を明確に**
   - 各コンポーネントの役割と受け取るプロップスを明確に定義
   - 過度に複雑なプロップスは避け、必要に応じて分割

## 6. 今後の拡張

コンポーネント構造は、以下の方向で拡張する予定です：

1. **コンポーネントのテスト強化**
   - 型安全なモックデータを使用したテスト
   - コンポーネントの責務に焦点を当てたユニットテスト

2. **パフォーマンス最適化**
   - メモ化を活用した不要な再レンダリングの防止
   - コンポーネントの分割とコード分割

3. **アクセシビリティの向上**
   - WAI-ARIA属性の適切な使用
   - キーボードナビゲーションのサポート
