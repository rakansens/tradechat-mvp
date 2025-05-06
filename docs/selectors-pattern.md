# セレクタパターン

このドキュメントでは、アプリケーションで使用されているセレクタパターンについて説明します。

## 概要

セレクタパターンは、Zustandストアのパフォーマンスを向上させるために使用されています。このパターンでは、`reselect`ライブラリの`createSelector`関数を使用して、メモ化されたセレクタ関数を作成します。

メモ化されたセレクタは、入力が変更されない限り、計算結果をキャッシュします。これにより、不要な再計算を防ぎ、アプリケーションのパフォーマンスを向上させることができます。

## ファイル構造

セレクタは以下のファイル構造で管理されています：

```
store/
  ├── index.ts                # すべてのストアとセレクタをエクスポート
  ├── selectors.ts            # すべてのセレクタを集約
  ├── chart/
  │   └── selectors.ts        # チャートストア用のセレクタ
  ├── chat/
  │   └── selectors.ts        # チャットストア用のセレクタ
  ├── entry/
  │   └── selectors.ts        # エントリーストア用のセレクタ
  ├── market/
  │   └── selectors.ts        # マーケットストア用のセレクタ
  └── ui/
      └── selectors.ts        # UIストア用のセレクタ
```

## 基本セレクタとメモ化されたセレクタ

各セレクタファイルには、2種類のセレクタが含まれています：

1. **基本セレクタ**：ストアから直接データを取得する単純な関数
2. **メモ化されたセレクタ**：基本セレクタを入力として使用し、計算結果をメモ化する関数

例：

```typescript
// 基本セレクタ
export const selectMessages = (state: ChatState) => state.messages;

// メモ化されたセレクタ
export const selectLastMessage = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): ExtendedMessage | null => {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  }
);
```

## セレクタの使用方法

セレクタは、コンポーネント内で以下のように使用できます：

```typescript
import { useChatStore, selectLastMessage } from '@/store';

function ChatComponent() {
  // メモ化されたセレクタを使用
  const lastMessage = useChatStore(selectLastMessage);
  
  return (
    <div>
      {lastMessage && <p>{lastMessage.content}</p>}
    </div>
  );
}
```

## 複合セレクタ

複数の基本セレクタを組み合わせて、より複雑な計算を行うセレクタを作成することもできます：

```typescript
// スプレッドセレクター
export const selectSpread = createSelector(
  [selectHighestBid, selectLowestAsk],
  (highestBid: number, lowestAsk: number): number => {
    if (highestBid === 0 || lowestAsk === 0) return 0;
    return lowestAsk - highestBid;
  }
);
```

## パラメータ化されたセレクタ

パラメータを受け取るセレクタを作成することもできます：

```typescript
// 累積数量セレクター（指定価格までの累積数量を計算）
export const selectCumulativeVolume = (side: 'bids' | 'asks', price: number) =>
  createSelector(
    [side === 'bids' ? selectBids : selectAsks],
    (orders: OrderBookEntry[]): number => {
      // 計算ロジック
      return cumulativeVolume;
    }
  );
```

## 型ガード関数

セレクタファイルには、型ガード関数も含まれています。これらの関数は、型の安全性を確保するために使用されます：

```typescript
// 型ガード関数
export function isOpenEntry(entry: Entry): entry is OpenEntry {
  return entry.status === 'open';
}

export function isClosedEntry(entry: Entry): entry is ClosedEntry {
  return entry.status === 'closed';
}
```

## セレクタの命名規則

セレクタの命名には以下の規則を適用します：

1. **基本セレクタ**：`select` + 取得するデータの名前
   - 例：`selectMessages`, `selectCurrentPrice`

2. **複合セレクタ**：`select` + 計算結果の名前
   - 例：`selectLastMessage`, `selectSpreadPercent`

3. **パラメータ化されたセレクタ**：`select` + 計算結果の名前 + パラメータの説明（必要に応じて）
   - 例：`selectCumulativeVolume`, `selectRecentTrades`

4. **ストア間で重複する可能性のあるセレクタ**：`select` + ストア名 + データの名前
   - 例：`selectChartCurrentSymbol`, `selectMarketCurrentSymbol`

この命名規則により、セレクタの役割が明確になり、名前の衝突を避けることができます。

## ベストプラクティス

1. **基本セレクタを再利用する**：基本セレクタを複数のメモ化されたセレクタで再利用することで、コードの重複を減らし、一貫性を確保します。

2. **セレクタを小さく保つ**：各セレクタは単一の責任を持つべきです。複雑な計算は、複数の小さなセレクタに分割しましょう。

3. **型安全性を確保する**：すべてのセレクタに適切な型注釈を付けることで、型の安全性を確保します。

4. **パフォーマンスを考慮する**：セレクタは、パフォーマンスを向上させるために使用されます。不要な計算を避け、必要な場合にのみメモ化を使用しましょう。

5. **集約されたセレクタをインポートする**：コンポーネントでは、個々のセレクタファイルからではなく、`@/store`からセレクタをインポートすることで、インポートパスの一貫性を確保します。

6. **名前の衝突を避ける**：複数のストアで同じデータ名を使用する場合は、ストア名をプレフィックスとして追加します（例：`selectChartCurrentSymbol`）。
