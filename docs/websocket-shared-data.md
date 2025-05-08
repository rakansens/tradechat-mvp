# WebSocketの共有データ方式

## 概要

WebSocketの共有データ方式は、サーバーとクライアント間でリアルタイムデータを効率的に共有するためのアーキテクチャです。この方式では、サーバーが外部APIからデータを取得し、接続されたすべてのクライアントにリアルタイムで配信します。これにより、各クライアントが個別にAPIリクエストを行う必要がなくなり、以下の利点があります：

1. **APIリクエスト数の削減**: 複数クライアントからの重複リクエストを排除
2. **レイテンシの低減**: クライアントはWebSocketを通じて即座にデータを受信
3. **帯域幅の節約**: 必要なデータのみが転送される
4. **サーバー負荷の分散**: 外部APIへのリクエストが一元管理される
5. **一貫性の確保**: すべてのクライアントが同じデータを受信

## アーキテクチャ

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│             │     │                                     │     │             │
│  外部API    │◄────┤  サーバー                          │◄────┤  クライアント │
│ (Bitget等)  │     │  ┌─────────────┐  ┌──────────────┐ │     │             │
│             │     │  │WebSocketMgr │  │CacheManager  │ │     │             │
└─────────────┘     │  └─────────────┘  └──────────────┘ │     └─────────────┘
                    │          │               │         │            ▲
                    │          ▼               ▼         │            │
                    │  ┌────────────────────────────────┐│            │
                    │  │   SocketDataBroadcaster       ││            │
                    │  └────────────────────────────────┘│            │
                    └───────────────────┬─────────────────┘            │
                                        │                              │
                                        ▼                              │
                                    ┌───────────┐                      │
                                    │Socket.IO  │──────────────────────┘
                                    └───────────┘
```

### コンポーネントの役割

1. **BitgetWebSocketManager**
   - 外部APIのWebSocket接続を管理
   - 市場データのサブスクリプションを処理
   - 受信したデータをSocketDataBroadcasterに転送

2. **CacheManager**
   - 市場データをメモリ内にキャッシュ
   - LRU（Least Recently Used）アルゴリズムでキャッシュを管理
   - データの有効期限（TTL）を管理

3. **SocketDataBroadcaster**
   - クライアントへのデータ配信を管理
   - Socket.IOサーバーとの連携
   - データフォーマットの変換と最適化

4. **Socket.IOサーバー**
   - クライアント接続の管理
   - 双方向通信の提供
   - イベントベースの通信モデル

5. **クライアント側SocketService**
   - サーバーとのWebSocket接続を管理
   - データの購読と受信
   - 接続状態の監視と再接続処理

## データフロー

1. **初期化フェーズ**
   - サーバー起動時にBitgetWebSocketManagerが外部APIに接続
   - Socket.IOサーバーがクライアント接続の待機を開始
   - CacheManagerが初期化され、空のキャッシュを準備

2. **クライアント接続フェーズ**
   - クライアントがSocket.IOを通じてサーバーに接続
   - クライアントが必要なデータチャネル（オーダーブック、ローソク足など）を購読
   - サーバーがクライアントIDを発行し、接続を確立

3. **データ配信フェーズ**
   - BitgetWebSocketManagerが外部APIからリアルタイムデータを受信
   - 受信データがCacheManagerによってキャッシュに保存
   - SocketDataBroadcasterが購読中のクライアントにデータを配信
   - クライアントがデータを受信し、UIを更新

4. **フォールバックフェーズ**
   - WebSocket接続が切断された場合、クライアントは自動的にRESTAPIにフォールバック
   - 接続が回復すると、WebSocketデータストリームに戻る
   - サーバー側でも同様のフォールバックメカニズムが実装されている

## APIリファレンス

### サーバーサイド

#### BitgetWebSocketManager

```typescript
// 接続を開始
connect(): void

// 接続を終了
disconnect(): void

// チャンネルを購読
subscribe(symbol: string, channelType: ChannelType, timeframe?: string, exchangeType: ExchangeType = 'spot'): boolean

// 購読を解除
unsubscribe(symbol: string, channelType: ChannelType, timeframe?: string, exchangeType: ExchangeType = 'spot'): boolean

// 現在の購読リストを取得
getSubscriptions(): SubscriptionArg[]

// 接続状態を取得
getConnectionState(): ConnectionState

// 接続されているかどうかを確認
isConnected(): boolean
```

#### CacheManager

```typescript
// キャッシュからデータを取得
get<T>(key: string): T | null

// キャッシュにデータを設定
set<T>(key: string, value: T, ttl?: number): void

// キャッシュからデータを削除
delete(key: string): boolean

// キャッシュをクリア
clear(): void

// 期限切れのエントリをクリーンアップ
cleanup(): number

// 統計情報を取得
getStats(): CacheStats
```

#### SocketDataBroadcaster

```typescript
// データをブロードキャスト
broadcastOrderBook(symbol: string, data: OrderBookData, exchangeType: ExchangeType): void

// ローソク足データをブロードキャスト
broadcastKline(symbol: string, timeframe: string, data: OHLCData, exchangeType: ExchangeType): void

// 取引データをブロードキャスト
broadcastTrade(symbol: string, data: TradeData, exchangeType: ExchangeType): void

// 接続状態を取得
getConnectionStats(): ConnectionStats
```

### クライアントサイド

#### SocketService

```typescript
// マーケットデータ用のSocket.IO接続を初期化
initializeMarketSocket(): Socket | null

// オーダーブックデータを購読
subscribeOrderBook(
  symbol: string,
  callback: (data: OrderBookData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void

// ローソク足データを購読
subscribeKline(
  symbol: string,
  timeframe: Timeframe,
  callback: (data: OHLCData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void

// 取引データを購読
subscribeTrade(
  symbol: string,
  callback: (data: TradeData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void

// すべての接続を切断
disconnectAll(): void

// 接続状態を確認
isConnected(): boolean

// 時間足変更イベントを発行
emitTimeframeChange(timeframe: string): Promise<boolean>

// 銘柄変更イベントを発行
emitSymbolChange(symbol: string): Promise<boolean>
```

#### DataFetchService

```typescript
// オーダーブックデータを取得（WebSocketとRESTAPIのハイブリッド）
fetchOrderBook(
  symbol: string,
  exchangeType: ExchangeType,
  signal?: AbortSignal,
  useCache: boolean = true
): Promise<OrderBookData>

// チャートデータを取得（WebSocketとRESTAPIのハイブリッド）
fetchChartData(
  symbol: string,
  timeFrame: Timeframe,
  exchangeType: ExchangeType,
  signal?: AbortSignal,
  useCache: boolean = true
): Promise<OHLCData[]>

// オーダーブックデータをリアルタイム購読
subscribeOrderBookRealtime(
  symbol: string,
  callback: (data: OrderBookData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void

// ローソク足データをリアルタイム購読
subscribeKlineRealtime(
  symbol: string,
  timeFrame: Timeframe,
  callback: (data: OHLCData) => void,
  exchangeType: ExchangeType = 'spot'
): () => void
```

## パフォーマンス特性

### メモリ使用量

- **サーバーサイド**: 
  - 標準的な使用シナリオ（10シンボル、100クライアント）: 約50-100MB
  - 高負荷シナリオ（50シンボル、500クライアント）: 約200-300MB

- **クライアントサイド**:
  - 単一シンボルの購読: 約10-20MB
  - 複数シンボルの購読（5シンボル）: 約30-50MB

### CPU使用率

- **サーバーサイド**:
  - アイドル状態: <1%
  - 標準的な負荷: 5-10%
  - 高負荷（多数のクライアント接続時）: 15-25%

- **クライアントサイド**:
  - アイドル状態: <1%
  - データ受信時: 2-5%
  - UI更新時: 5-10%

### ネットワーク使用量

- **初期接続**: 約5-10KB
- **オーダーブックデータ（1回の更新）**: 約1-2KB
- **ローソク足データ（1回の更新）**: 約0.5-1KB
- **1時間あたりの平均データ転送量**: 約1-5MB（購読内容による）

## ベストプラクティス

1. **エラーハンドリング**
   - WebSocket接続が切断された場合は自動的に再接続を試みる
   - 再接続時には指数バックオフアルゴリズムを使用する
   - 接続が回復するまでRESTAPIにフォールバックする

2. **メモリ管理**
   - 不要なデータは積極的にキャッシュから削除する
   - 大量のデータを保持する場合はページネーションを使用する
   - メモリリークを防ぐため、購読解除時にはコールバック関数を適切に削除する

3. **パフォーマンス最適化**
   - 必要なデータのみを購読する
   - データの更新頻度を適切に設定する
   - UIの更新頻度を制限する（スロットリング/デバウンシング）

4. **セキュリティ**
   - WebSocket接続にはTLSを使用する
   - 認証情報は安全に管理する
   - クライアントからの入力は常にバリデーションする

## トラブルシューティング

1. **接続の問題**
   - ネットワーク接続を確認する
   - ファイアウォール設定を確認する
   - WebSocketプロトコルがプロキシで許可されているか確認する

2. **データの遅延**
   - サーバーの負荷を確認する
   - ネットワークレイテンシを確認する
   - クライアント側の処理が重くないか確認する

3. **メモリリーク**
   - 未使用の購読を解除する
   - イベントリスナーを適切に削除する
   - 大きなデータ構造を適切に破棄する

4. **高CPU使用率**
   - データ処理ロジックを最適化する
   - UIの更新頻度を下げる
   - バックグラウンド処理を最小限に抑える

## 今後の改善点

1. **スケーラビリティの向上**
   - マイクロサービスアーキテクチャへの移行
   - 水平スケーリングのサポート
   - 負荷分散の実装

2. **機能拡張**
   - 複数取引所のサポート
   - カスタムアラート機能
   - 高度なデータフィルタリング

3. **パフォーマンス最適化**
   - データ圧縮の導入
   - バイナリプロトコルへの移行
   - エッジキャッシングの実装

4. **セキュリティ強化**
   - エンドツーエンド暗号化
   - レート制限の実装
   - 異常検知システムの導入