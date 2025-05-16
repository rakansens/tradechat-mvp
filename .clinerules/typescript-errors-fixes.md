# TypeScriptエラー修正パターン

## エラーの分類と修正パターン

### 型エクスポート問題

#### 再エクスポートバレルファイルの問題

**問題**:
```
types/chart/toolbar/ui/IndicatorPopover.tsx:15:10 - error TS2305: Module '"@/types/store"' has no exported member 'IndicatorType'.
```

**解決パターン**:
1. types/store/index.tsに明示的にエクスポート文を追加
```typescript
// types/store/index.ts
export type { IndicatorType, ActiveIndicator, DrawingToolType } from './chart';
export type { TabType } from './ui';
```

2. 実際の型定義ファイルでも型をエクスポート
```typescript
// types/store/chart.ts
export type { IndicatorType, ActiveIndicator, DrawingToolType };
```

### Zustandストア型定義の問題

#### スライス型定義とアクション型の分離

**問題**:
```
store/rootStore.ts:268:26 - error TS2571: Object is of type 'unknown'.
```

**解決パターン**:
1. スライス状態とアクションを明確に型定義
```typescript
// スライス状態型
export interface ExampleSliceState {
  count: number;
  name: string;
}

// スライスアクション型
export interface ExampleSliceActions {
  increment: () => void;
  setName: (name: string) => void;
}

// 完全なスライス型（状態+アクション）
export type ExampleSlice = ExampleSliceState & ExampleSliceActions;
```

2. RootStoreでのスライス統合時に明示的に型キャスト
```typescript
// rootStore.ts内
const exampleSlice = createExampleSlice(
  (fn) => set((state) => {
    fn(state as ExampleSliceState);
  }),
  () => get() as ExampleSliceState
) as ExampleSlice;
```

#### StateCreator型とインプラー使用時の問題

**問題**:
```
store/core/createPersistedSlice.ts:23:19 - error TS2345: Argument of type 'StateCreator<T & U, [], [["zustand/immer", never]]>' is not assignable to parameter of type '(T & U) | Partial<T & U> | ((state: T & U) => (T & U) | Partial<T & U>)'.
```

**解決方法**:
```typescript
// 明示的な関数定義とimmerSetラッパーの使用
export function createPersistedSlice<T extends object, U extends object>(
  persistKey: string,
  sliceCreator: CreateSliceWithPersist<T>,
  persistOptions?: Partial<PersistOptions<T & U>>
): StateCreator<T & U, [], [['zustand/immer', never]]> {
  return (set, get, api) => {
    const immerSet = (fn: (state: T) => void) => 
      set((state) => {
        const draft = state as T;
        fn(draft);
        return state;
      });
    
    const slice = sliceCreator(
      immerSet,
      () => get() as T,
      api
    );
    
    return slice as T & U;
  };
}
```

### Supabase型とAPI関数の問題

#### テーブル参照とカラム名変更

**問題**:
```
lib/supabase/features/settings.ts:387:11 - error TS2769: No overload matches this call.
```

**解決パターン**:
```typescript
// 古い実装
const { data, error } = await supabase
  .from('user_settings')  // 存在しないテーブル
  .select('value')
  .eq('user_id', userId)
  .single();

// 新しい実装 - 正しいテーブルとカラム名
const { data, error } = await supabase
  .from('profiles')  // 正しいテーブル
  .select('settings')  // 正しいカラム名
  .eq('id', userId)  // 正しいID列名
  .single();
```

### 型互換性の問題

#### プロパティ名のリネーム

**問題**:
```
SymbolInfo型のプロパティが別の名前（quoteAsset → quoteCoin）に変更されたためのエラー
```

**解決パターン**:
```typescript
// 新しい型定義を集中管理
export interface SymbolInfo {
  id: string;
  symbol: string;
  baseCoin: string;    // baseAssetから変更
  quoteCoin: string;   // quoteAssetから変更 
  favorite: boolean;   // isFavoriteから変更
  // 他のプロパティ
}

// 変換関数を提供
export function toLegacySymbol(symbol: SymbolInfo): LegacySymbolInfo {
  return {
    symbol: symbol.symbol,
    baseAsset: symbol.baseCoin,
    quoteAsset: symbol.quoteCoin,
    isFavorite: symbol.favorite,
    // その他のプロパティ変換
  };
}
```

#### 必須プロパティの追加

**問題**:
```
hooks/chat/useChatInteraction.ts:110:25 - error TS2741: Property 'userId' is missing in type '{ id: string; side: "buy" | "sell"; symbol: string; price: any; time: string; status: "open"; }' but required in type 'OpenEntry'.
```

**解決パターン**:
```typescript
// 必須プロパティの追加
const entry: OpenEntry = {
  id: entryId,
  userId: getCurrentUserId(), // 必須プロパティを追加
  side: 'buy',
  symbol: currentSymbol,
  price: currentPrice || 0,
  time: new Date().toISOString(),
  status: 'open',
};
```

### テスト関連のエラー

#### モジュールパス変更によるテストエラー

**問題**:
```
Cannot find module '@/lib/supabase/supabase' or its corresponding type declarations.
```

**解決パターン**:
```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/supabase/(.*)$': '<rootDir>/lib/supabase/$1',
    '^@/lib/supabase/supabase$': '<rootDir>/lib/supabase/client',   // ←追加
    '^@/store/useSymbolStore$': '<rootDir>/store/symbol',           // ←追加
    // 他のパスマッピング
  }
}
```

#### WebSocketとFetchのMock型問題

**問題**: 
```
Type 'typeof WebSocket' is missing the following properties from type 'Mock<any, any, any>': getMockName, mock, mockClear, mockReset, and 13 more.
```

**解決パターン**:
```typescript
// __tests__/setupMocks/websocket.ts
export const createMockWebSocket = (): jest.Mocked<WebSocket> => {
  const mockSocket = {
    // プロパティ
    url: 'ws://mock-websocket-url.com',
    readyState: WebSocketReadyState.CONNECTING,
    // メソッド
    send: jest.fn(),
    close: jest.fn(),
    // イベントリスナー
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    // シミュレーションヘルパー
    simulateOpen: () => {
      mockSocket.readyState = WebSocketReadyState.OPEN;
      mockSocket.dispatchEvent(new Event('open'));
    }
    // その他のメソッド...
  };

  return mockSocket as unknown as jest.Mocked<WebSocket>;
};
```

## 今回の追加修正で解消された主なエラー数

| エラータイプ | 前回解消 | 今回解消 | 残り |
|------------|---------|---------|-----|
| 型エクスポート問題 | 15 | 5 | 2 |
| Zustandストア型定義問題 | 22 | 9 | 22 |
| サードパーティライブラリとの型互換性 | 4 | 2 | 10 |
| 存在しないモジュール参照 | 2 | 20 | 8 |
| プロパティ不足 | 8 | 2 | 2 |
| Mockオブジェクト型エラー | 0 | 8 | 4 |
| その他の型エラー | 4 | 5 | 3 |
| **合計** | **55** | **51** | **51** |

## 重要な教訓

1. **型階層を明確に設計する**: 循環参照を避けるため、型の依存関係を明確にし、一方向の依存構造を確立する。

2. **明示的な型アサーションを必要な箇所で使用する**: 特にZustandのようなライブラリでは、時にはTypeScriptの型推論を助けるために明示的なキャストが必要。

3. **再エクスポートを効果的に使用する**: バレルファイルでの再エクスポートパターンは便利だが、型の場合は明示的なエクスポートが必要なことが多い。

4. **API型とクライアント型の一貫性を保つ**: バックエンド（Supabase）とフロントエンドで型の一貫性を保つために、変換レイヤーとマッピング関数を使用する。

5. **テスト用のモックを型安全に実装する**: 型安全なモック関数ファクトリを作成することで、テスト時の型エラーを防ぎ、テストコードの品質を向上させる。

6. **モジュールパスのリファクタリング時は jest.config.js を更新する**: コード内でのインポートパスを変更した場合、テスト環境でも同じパスが解決できるようにモジュールマッピングを更新する。 