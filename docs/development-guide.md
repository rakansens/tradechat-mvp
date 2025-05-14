# 開発ガイド

このドキュメントでは、TradeChat MVPの開発に関するガイドラインと推奨プラクティスを提供します。

## 1. 開発環境のセットアップ

### 1.1 必要条件

- Node.js 18.x以上
- npm 9.x以上またはYarn 1.22.x以上
- Git

### 1.2 リポジトリのクローン

\`\`\`bash
git clone <repository-url>
cd tradechat-mvp
\`\`\`

### 1.3 依存関係のインストール

\`\`\`bash
npm install
# または
yarn install
\`\`\`

### 1.4 環境変数の設定

`.env.local`ファイルを作成し、必要な環境変数を設定します：

\`\`\`
# 開発環境
NODE_ENV=development


# SUPABASE (将来的に必要)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI SDK (将来的に必要)
OPENAI_API_KEY=
\`\`\`

### 1.5 開発サーバーの起動

\`\`\`bash
npm run dev
# または
yarn dev
\`\`\`

## 2. コード規約

### 2.1 ファイル命名規則

- **コンポーネント**: PascalCase（例：`ChartCanvas.tsx`）
- **ユーティリティ/フック**: camelCase（例：`useTimeframe.ts`）
- **定数/型定義**: camelCase（例：`types.ts`）

### 2.2 インポート順序

インポートは以下の順序で整理してください：

1. React/Next.js関連
2. サードパーティライブラリ
3. 内部コンポーネント
4. 内部フック
5. 内部ユーティリティ
6. 型定義
7. スタイル

例：

\`\`\`typescript
// 1. React/Next.js関連
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// 2. サードパーティライブラリ
import { createChart } from 'lightweight-charts'
import { z } from 'zod'

// 3. 内部コンポーネント
import { Button } from '@/components/ui/button'
import ChatWindow from '@/components/chat/window'

// 4. 内部フック
import { useChartConfig } from '@/hooks/useChartConfig'

// 5. 内部ユーティリティ
import { formatDate } from '@/utils/positionUtils'

// 6. 型定義
import type { Entry, Timeframe } from '@/types'

// 7. スタイル（必要な場合）
import styles from './Component.module.css'
\`\`\`

### 2.3 コンポーネント構造

コンポーネントは以下の構造に従ってください：

\`\`\`typescript
// 1. インポート

// 2. 型定義
interface ComponentProps {
  // ...
}

// 3. コンポーネント
export default function Component({ prop1, prop2 }: ComponentProps) {
  // 3.1 フック
  const [state, setState] = useState()
  
  // 3.2 副作用
  useEffect(() => {
    // ...
  }, [])
  
  // 3.3 イベントハンドラ
  const handleClick = () => {
    // ...
  }
  
  // 3.4 レンダリング
  return (
    // ...
  )
}

// 4. ヘルパーコンポーネント（必要な場合）
function HelperComponent() {
  // ...
}
\`\`\`

### 2.4 状態管理

- **ローカル状態**: コンポーネント内のUIのみに関連する状態には`useState`を使用
- **グローバル状態**: アプリケーション全体で共有される状態には`Zustand`を使用
- **サーバー状態**: APIから取得したデータには将来的にはReact Queryの使用を検討

### 2.5 エラーハンドリング

すべてのAPI呼び出しと非同期操作には適切なエラーハンドリングを実装してください：

\`\`\`typescript
try {
  const result = await someAsyncOperation()
  // 成功時の処理
} catch (error) {
  console.error('Operation failed:', error)
  // エラー時の処理（ユーザーへの通知など）
} finally {
  // クリーンアップ処理（ローディング状態の解除など）
}
\`\`\`

## 3. コンポーネント開発

### 3.1 新しいコンポーネントの作成

新しいコンポーネントを作成する際は、以下のテンプレートを使用してください：

\`\`\`typescript
"use client"

import { useState } from 'react'
import type { ReactNode } from 'react'

interface ExampleComponentProps {
  title: string
  children?: ReactNode
  onClick?: () => void
}

export default function ExampleComponent({ title, children, onClick }: ExampleComponentProps) {
  const [isActive, setIsActive] = useState(false)
  
  const handleClick = () => {
    setIsActive(!isActive)
    if (onClick) onClick()
  }
  
  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold">{title}</h2>
      <button 
        onClick={handleClick}
        className={`mt-2 px-4 py-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
      >
        Toggle
      </button>
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
\`\`\`

### 3.2 コンポーネントのテスト

将来的には、Jest とReact Testing Libraryを使用してコンポーネントをテストすることを推奨します。

## 4. 状態管理

### 4.1 Zustandストアの拡張

新しい状態やアクションをZustandストアに追加する場合は、以下のパターンに従ってください：

\`\`\`typescript
// store/useStore.ts に追加

// 1. 型定義を拡張
interface StoreState {
  // 既存の型定義
  
  // 新しい状態
  newState: string
  
  // 新しいアクション
  setNewState: (value: string) => void
  performComplexAction: (param: number) => Promise<void>
}

// 2. ストア定義に追加
create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // 既存のストア定義
        
        // 新しい状態
        newState: 'initial',
        
        // 新しいアクション
        setNewState: (value) => set({ newState: value }),
        
        performComplexAction: async (param) => {
          try {
            set({ isLoading: true })
            // 複雑な処理
            const result = await someAsyncOperation(param)
            set({ newState: result, isLoading: false })
          } catch (error) {
            console.error('Action failed:', error)
            set({ error: String(error), isLoading: false })
          }
        },
      }),
      {
        name: "alpha-trader-storage",
        partialize: (state) => ({
          // 永続化する状態を指定
          // ...
          newState: state.newState,
        }),
      }
    ),
    { name: "alpha-trader-store" }
  )
)
\`\`\`

### 4.2 ストアの使用

コンポーネントでストアを使用する場合は、必要な状態とアクションのみを選択してください：

\`\`\`typescript
import { useStore } from '@/store/useStore'

export default function SomeComponent() {
  // 必要な状態とアクションのみを選択
  const { newState, setNewState, performComplexAction } = useStore()
  
  return (
    <div>
      <p>Current state: {newState}</p>
      <button onClick={() => setNewState('updated')}>Update State</button>
      <button onClick={() => performComplexAction(42)}>Perform Action</button>
    </div>
  )
}
\`\`\`

## 5. API統合

### 5.1 新しいAPIエンドポイントの追加

新しいAPIエンドポイントを追加する場合は、以下のパターンに従ってください：

\`\`\`typescript
// app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // クエリパラメータの取得
    const { searchParams } = new URL(req.url)
    const param = searchParams.get('param')
    
    // 処理
    const result = { data: `Processed ${param}` }
    
    // レスポンス
    return NextResponse.json(result)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの取得
    const body = await req.json()
    
    // バリデーション
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      )
    }
    
    // 処理
    const result = { success: true, data: body }
    
    // レスポンス
    return NextResponse.json(result)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
\`\`\`

### 5.2 APIクライアントの作成

外部APIと通信するためのクライアントを作成する場合は、以下のパターンに従ってください：

\`\`\`typescript
// lib/api/some-service.ts
interface ApiOptions {
  endpoint: string
  apiKey: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

export class ApiClient {
  private endpoint: string
  private apiKey: string
  
  constructor(options: ApiOptions) {
    this.endpoint = options.endpoint
    this.apiKey = options.apiKey
  }
  
  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.endpoint}${path}`
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      return { error: String(error) }
    }
  }
  
  async getData<T>(path: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const queryString = new URLSearchParams(params).toString()
    const fullPath = `${path}?${queryString}`
    return this.request<T>(fullPath)
  }
  
  async postData<T, U>(path: string, data: T): Promise<ApiResponse<U>> {
    return this.request<U>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// 使用例
const apiClient = new ApiClient({
  endpoint: process.env.API_ENDPOINT || '',
  apiKey: process.env.API_KEY || '',
})

export async function fetchSomeData(id: string) {
  return apiClient.getData(`/some-resource/${id}`)
}

export async function createSomeResource(data: any) {
  return apiClient.postData('/some-resource', data)
}
\`\`\`
### 5.3 WebSocket統合

WebSocketを使用してリアルタイムデータを取得する場合は、以下のパターンに従ってください：

#### 5.3.1 socketService.tsの使用方法

`socketService.ts`は、Socket.IOを使用してサーバーとのWebSocket接続を管理するサービスです：

```typescript
// services/socketService.ts
import { Socket, io } from 'socket.io-client';
import type { OrderBookData, OHLCData, TradeData, ExchangeType, Timeframe } from '@/types';

// Socket.IOの名前空間
const NAMESPACE = {
  MARKET: '/market'
};

// チャネル名の定数
const CHANNEL = {
  ORDERBOOK: 'orderbook',
  KLINE: 'kline',
  TRADE: 'trade',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe'
};

// マーケットデータ用のSocket.IO接続を初期化
export function initializeMarketSocket(): Socket | null {
  try {
    const socket = io(NAMESPACE.MARKET, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    socket.on('connect', () => {
      console.log('Market socket connected');
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Market socket disconnected: ${reason}`);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Market socket connection error:', error);
    });
    
    return socket;
  } catch (error) {
    console.error('Failed to initialize market socket:', error);
    return null;
  }
}

// オーダーブックデータを購読
export function subscribeOrderBook(
  symbol: string,
  callback: (data: OrderBookData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void {
  const socket = initializeMarketSocket();
  if (!socket) {
    console.error('Socket not initialized');
    return () => {};
  }
  
  const channelName = `${CHANNEL.ORDERBOOK}:${symbol}:${exchangeType}`;
  
  socket.emit(CHANNEL.SUBSCRIBE, { channel: channelName });
  socket.on(channelName, callback);
  
  return () => {
    socket.emit(CHANNEL.UNSUBSCRIBE, { channel: channelName });
    socket.off(channelName, callback);
    socket.disconnect();
  };
}

// ローソク足データを購読
export function subscribeKline(
  symbol: string,
  timeframe: Timeframe,
  callback: (data: OHLCData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void {
  const socket = initializeMarketSocket();
  if (!socket) {
    console.error('Socket not initialized');
    return () => {};
  }
  
  const channelName = `${CHANNEL.KLINE}:${symbol}:${timeframe}:${exchangeType}`;
  
  socket.emit(CHANNEL.SUBSCRIBE, { channel: channelName });
  socket.on(channelName, callback);
  
  return () => {
    socket.emit(CHANNEL.UNSUBSCRIBE, { channel: channelName });
    socket.off(channelName, callback);
    socket.disconnect();
  };
}
```

#### 5.3.2 WebSocketとRESTAPIのハイブリッド機能

`dataFetchService.ts`は、WebSocketとRESTAPIを組み合わせたハイブリッドアプローチを提供します：

```typescript
// services/dataFetchService.ts
import { socketService } from './socket';
import { bitgetApi } from './bitgetApi';
import type { OrderBookData, OHLCData, ExchangeType, Timeframe } from '@/types';

// WebSocketサブスクリプション管理
const subscriptions = new Map<string, () => void>();

// オーダーブックデータ取得（WebSocketとRESTAPIのハイブリッド）
export async function fetchOrderBook(
  symbol: string,
  exchangeType: ExchangeType,
  signal?: AbortSignal,
  useCache: boolean = true
): Promise<OrderBookData> {
  try {
    // WebSocketが接続されているか確認
    if (socketService.isConnected()) {
      // WebSocketからデータを取得
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // タイムアウト時はRESTAPIにフォールバック
          console.warn('WebSocket timeout, falling back to REST API');
          bitgetApi.getOrderBook(symbol, exchangeType, signal, useCache)
            .then(resolve)
            .catch(reject);
        }, 3000);
        
        const unsubscribe = socketService.subscribeOrderBook(
          symbol,
          (data) => {
            clearTimeout(timeout);
            resolve(data);
            unsubscribe();
          },
          exchangeType
        );
        
        // AbortSignalのハンドリング
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            unsubscribe();
            reject(new Error('Request aborted'));
          });
        }
      });
    } else {
      // WebSocketが接続されていない場合はRESTAPIを使用
      return bitgetApi.getOrderBook(symbol, exchangeType, signal, useCache);
    }
  } catch (error) {
    console.error('Error fetching order book:', error);
    // エラー時はRESTAPIにフォールバック
    return bitgetApi.getOrderBook(symbol, exchangeType, signal, useCache);
  }
}

// リアルタイムオーダーブック購読
export function subscribeOrderBookRealtime(
  symbol: string,
  callback: (data: OrderBookData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void {
  const key = `orderbook:${symbol}:${exchangeType}`;
  
  // 既存のサブスクリプションがあれば解除
  if (subscriptions.has(key)) {
    const unsubscribe = subscriptions.get(key)!;
    unsubscribe();
    subscriptions.delete(key);
  }
  
  // 新しいサブスクリプションを作成
  const unsubscribe = socketService.subscribeOrderBook(symbol, callback, exchangeType);
  subscriptions.set(key, unsubscribe);
  
  return () => {
    if (subscriptions.has(key)) {
      const unsubscribe = subscriptions.get(key)!;
      unsubscribe();
      subscriptions.delete(key);
    }
  };
}
```

#### 5.3.3 エラーハンドリングとフォールバック戦略

WebSocket接続で問題が発生した場合のエラーハンドリングとフォールバック戦略は以下のパターンに従ってください：

```typescript
// エラーハンドリングの例
try {
  // WebSocketを使用したデータ取得
  const data = await dataFetchService.fetchOrderBook(symbol, 'spot');
  // 成功時の処理
  updateUI(data);
} catch (error) {
  console.error('WebSocket error:', error);
  
  try {
    // RESTAPIにフォールバック
    const fallbackData = await bitgetApi.getOrderBook(symbol, 'spot');
    // フォールバック成功時の処理
    updateUI(fallbackData);
    // ユーザーに通知
    showNotification('リアルタイム接続に問題が発生しました。通常モードで動作しています。');
  } catch (fallbackError) {
    console.error('Fallback error:', fallbackError);
    // 完全に失敗した場合の処理
    showError('データの取得に失敗しました。後でもう一度お試しください。');
  }
} finally {
  // ローディング状態の解除など
  setLoading(false);
}
```

#### 5.3.4 WebSocketの再接続戦略

WebSocket接続が切断された場合の再接続戦略は以下のパターンに従ってください：

```typescript
// 指数バックオフ+ジッターによる再接続
function reconnectWithBackoff(attempt: number, maxAttempts: number = 10): void {
  if (attempt > maxAttempts) {
    console.error('Maximum reconnection attempts reached');
    return;
  }
  
  // 指数バックオフ（2^attempt * 1000ms）
  const backoff = Math.min(30000, Math.pow(2, attempt) * 1000);
  // ジッター（±30%）を追加
  const jitter = backoff * 0.3 * (Math.random() * 2 - 1);
  const delay = backoff + jitter;
  
  console.log(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${attempt}/${maxAttempts})`);
  
  setTimeout(() => {
    try {
      // 再接続を試みる
      const socket = initializeMarketSocket();
      
      socket.on('connect', () => {
        console.log('Reconnected successfully');
        // 再接続成功時の処理（サブスクリプションの再開など）
        resubscribeAll();
      });
      
      socket.on('connect_error', () => {
        // 再接続失敗時は次の試行をスケジュール
        reconnectWithBackoff(attempt + 1, maxAttempts);
      });
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      // 再接続失敗時は次の試行をスケジュール
      reconnectWithBackoff(attempt + 1, maxAttempts);
    }
  }, delay);
}
```

## 6. パフォーマンス最適化

### 6.1 メモ化

不要な再レンダリングを防ぐために、`useMemo`、`useCallback`、`React.memo`を適切に使用してください：

\`\`\`typescript
import { useMemo, useCallback } from 'react'

// 計算コストの高い処理をメモ化
const expensiveCalculation = useMemo(() => {
  return someExpensiveOperation(prop1, prop2)
}, [prop1, prop2])

// イベントハンドラをメモ化
const handleClick = useCallback(() => {
  doSomething(prop1, prop2)
}, [prop1, prop2])
\`\`\`

### 6.2 仮想化

大量のデータを表示する場合は、仮想化ライブラリ（例：`react-window`）の使用を検討してください。

### 6.3 画像最適化

Next.jsの`Image`コンポーネントを使用して画像を最適化してください：

\`\`\`typescript
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={isImportant}
  loading="lazy"
/>
\`\`\`

## 7. アクセシビリティ

### 7.1 セマンティックHTML

適切なセマンティックHTMLタグを使用してください：

- `<header>`, `<main>`, `<footer>` - ページ構造
- `<nav>` - ナビゲーション
- `<article>`, `<section>` - コンテンツ構造
- `<h1>` - `<h6>` - 見出し階層
- `<button>` - クリック可能な要素
- `<input>`, `<label>` - フォーム要素

### 7.2 ARIA属性

必要に応じてARIA属性を使用してください：

\`\`\`typescript
<button
  aria-label="Close dialog"
  aria-expanded={isExpanded}
  onClick={handleClose}
>
  <span className="sr-only">Close</span>
  <XIcon />
</button>
\`\`\`

### 7.3 キーボードナビゲーション

すべてのインタラクティブ要素がキーボードでアクセス可能であることを確認してください。

## 8. デバッグとトラブルシューティング

### 8.1 ロギング

開発中は`console.log`を使用してデバッグできますが、本番環境ではログレベルを適切に設定してください：

\`\`\`typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.warn : LOG_LEVEL.debug

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVEL.debug >= CURRENT_LOG_LEVEL) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVEL.info >= CURRENT_LOG_LEVEL) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVEL.warn >= CURRENT_LOG_LEVEL) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },
  error: (message: string, ...args: any[]) => {
    if (LOG_LEVEL.error >= CURRENT_LOG_LEVEL) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
}
\`\`\`