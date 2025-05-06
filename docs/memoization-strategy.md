# メモ化戦略

このドキュメントでは、アプリケーションでのメモ化戦略について説明します。メモ化は、不要な再レンダリングを防ぎ、アプリケーションのパフォーマンスを向上させるために重要です。

## 概要

メモ化とは、関数の結果をキャッシュし、同じ入力に対して再計算を避けるテクニックです。Reactでは、主に以下の3つのメモ化手法が使用されます：

1. **React.memo**: コンポーネントのメモ化
2. **useMemo**: 値のメモ化
3. **useCallback**: コールバック関数のメモ化

また、Zustandストアでは、セレクタパターンを使用してストアの状態の一部を効率的に取得します。

## コンポーネントのメモ化 (React.memo)

`React.memo`は、コンポーネントのpropsが変更されない限り、コンポーネントの再レンダリングを防ぎます。

### 使用すべき場合

- 頻繁に再レンダリングされる親コンポーネント内の子コンポーネント
- propsが頻繁に変更されないコンポーネント
- レンダリングコストが高いコンポーネント

### 例

```tsx
import React from 'react';

interface ChatMessageProps {
  content: string;
  timestamp: string;
  author: string;
}

const ChatMessage = React.memo(({ content, timestamp, author }: ChatMessageProps) => {
  return (
    <div className="message">
      <div className="author">{author}</div>
      <div className="content">{content}</div>
      <div className="timestamp">{timestamp}</div>
    </div>
  );
});

export default ChatMessage;
```

## 値のメモ化 (useMemo)

`useMemo`は、依存配列の値が変更されない限り、計算結果をキャッシュします。

### 使用すべき場合

- 計算コストが高い処理
- 大きな配列のフィルタリングやソート
- 複雑なデータ変換

### 例

```tsx
import { useMemo } from 'react';

function OrderBook({ orders }) {
  // 注文をソートし、累積数量を計算（コストの高い処理）
  const processedOrders = useMemo(() => {
    return orders
      .sort((a, b) => b.price - a.price)
      .map((order, index, arr) => {
        const cumulativeVolume = arr
          .slice(0, index + 1)
          .reduce((sum, o) => sum + o.volume, 0);
        return { ...order, cumulativeVolume };
      });
  }, [orders]); // ordersが変更された場合のみ再計算

  return (
    <div>
      {processedOrders.map(order => (
        <div key={order.id}>
          {order.price} - {order.volume} - {order.cumulativeVolume}
        </div>
      ))}
    </div>
  );
}
```

## コールバック関数のメモ化 (useCallback)

`useCallback`は、依存配列の値が変更されない限り、コールバック関数をキャッシュします。

### 使用すべき場合

- メモ化されたコンポーネントにコールバック関数を渡す場合
- 依存関係の配列に関数を含める場合
- イベントハンドラが複雑な場合

### 例

```tsx
import { useCallback } from 'react';

function TradeForm({ onSubmit }) {
  const handleSubmit = useCallback((values) => {
    // フォームの検証と送信処理
    const isValid = validateForm(values);
    if (isValid) {
      onSubmit(values);
    }
  }, [onSubmit]); // onSubmitが変更された場合のみ再作成

  return (
    <Form onSubmit={handleSubmit}>
      {/* フォームの内容 */}
    </Form>
  );
}
```

## Zustandストアでのメモ化（セレクタパターン）

Zustandストアでは、セレクタパターンを使用して、ストアの状態の一部を効率的に取得します。詳細は[セレクタパターン](./selectors-pattern.md)を参照してください。

### 例

```tsx
import { useChartStore, selectCurrentPrice } from '@/store';

function PriceDisplay() {
  // メモ化されたセレクタを使用
  const currentPrice = useChartStore(selectCurrentPrice);
  
  return <div>{currentPrice}</div>;
}
```

## メモ化の適用ガイドライン

以下のコンポーネントタイプに対して、メモ化を適用することを推奨します：

### 高頻度で更新されるコンポーネント

- チャートコンポーネント
- 価格表示コンポーネント
- オーダーブックコンポーネント
- リアルタイムデータを表示するコンポーネント

### 大量のデータを処理するコンポーネント

- 長いリストを表示するコンポーネント
- 複雑な計算を行うコンポーネント
- 大きなテーブルを表示するコンポーネント

### 再利用可能なUIコンポーネント

- ボタン、入力フィールドなどの基本的なUIコンポーネント
- モーダル、ポップオーバーなどの複合UIコンポーネント
- カード、パネルなどのコンテナコンポーネント

## メモ化の注意点

1. **過剰なメモ化を避ける**：すべてのコンポーネントや関数をメモ化する必要はありません。メモ化自体にもコストがあります。

2. **依存配列を正確に設定する**：`useMemo`と`useCallback`の依存配列は、必要なすべての依存関係を含める必要があります。

3. **オブジェクトと関数の参照の安定性**：オブジェクトや関数を依存配列に含める場合は、それらの参照が安定していることを確認してください。

4. **ESLintルールを活用する**：`eslint-plugin-react-hooks`を使用して、依存配列の問題を検出しましょう。

## パフォーマンス測定

メモ化の効果を測定するために、以下のツールを使用することを推奨します：

1. **React DevTools Profiler**：コンポーネントの再レンダリングを視覚化し、メモ化の効果を確認できます。

2. **Chrome DevTools Performance**：レンダリングパフォーマンスを詳細に分析できます。

3. **Lighthouse**：ウェブページの全体的なパフォーマンスを測定できます。

## まとめ

メモ化は、アプリケーションのパフォーマンスを向上させるための強力なツールですが、適切に使用することが重要です。このガイドラインに従って、必要な場所でメモ化を適用し、アプリケーションのパフォーマンスを最適化しましょう。
