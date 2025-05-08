# WebSocketの共有データ方式

## 概要

WebSocketの共有データ方式は、サーバーとクライアント間でリアルタイムデータを効率的に共有するためのアーキテクチャです。この方式では、サーバーが外部APIからデータを取得し、接続されたすべてのクライアントにリアルタイムで配信します。

### 移行の背景

従来のポーリングベースのシステムから、WebSocketベースのシステムへの移行を実施しました。この移行により、以下の課題を解決しています：

**移行前の課題（ポーリングベース）**:
- 各クライアントが個別にBitget REST APIにリクエストを送信
- サーバー側（5秒）とクライアント側（30秒）のキャッシュで負荷軽減を試みるも限界あり
- 同じデータに対する重複リクエストが多発
- APIレートリミットに達するリスク

**移行後の利点（WebSocketベース）**:
1. **APIリクエスト数の削減**: 複数クライアントからの重複リクエストを排除
2. **レイテンシの低減**: ポーリング間隔による遅延がなくなり、リアルタイム性が向上
3. **帯域幅の節約**: 必要なデータのみが転送される
4. **サーバー負荷の分散**: 外部APIへのリクエストが一元管理される
5. **一貫性の確保**: すべてのクライアントが同じデータを受信
6. **信頼性の向上**: 自動再接続機能とRESTAPIフォールバック機能を実装

## アーキテクチャ

### 移行前のアーキテクチャ（ポーリングベース）

```
クライアント1 → BitgetApiClient → サーバーキャッシュ → Bitget REST API
クライアント2 → BitgetApiClient → サーバーキャッシュ → Bitget REST API
クライアント3 → BitgetApiClient → サーバーキャッシュ → Bitget REST API
```

### 移行後のアーキテクチャ（WebSocketベース）

```
                                 ┌→ socketService1 → dataFetchService1 → クライアント1
Bitget WebSocket → BitgetWebSocketManager → SocketDataBroadcaster →  socketService2 → dataFetchService2 → クライアント2
                                 └→ socketService3 → dataFetchService3 → クライアント3
```

### 詳細アーキテクチャ

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
   - Bitget WebSocketとの単一接続を管理
   - サブスクリプション管理と自動再接続機能
   - 指数バックオフ+ジッターによる再接続戦略
   - データ受信時にイベントを発行
   - 接続状態監視と障害検出

2. **CacheManager**
   - LRUキャッシュによるデータの効率的な管理
   - キャッシュサイズの制限と有効期限管理
   - 新規接続クライアントへの即時データ提供
   - キャッシュ統計情報の提供
   - メモリ使用量の最適化

3. **SocketDataBroadcaster**
   - Socket.IOを使用したデータ配信
   - シンボルごとのデータ配信チャネル管理
   - クライアント購読管理とバックプレッシャー制御
   - データフォーマットの変換と最適化
   - 接続統計情報の提供

4. **Socket.IOサーバー**
   - クライアント接続の管理
   - 双方向通信の提供
   - イベントベースの通信モデル
   - 接続状態の監視

5. **クライアント側socketService**
   - Socket.IO接続の管理とデータの購読
   - 接続状態の監視と再接続処理
   - 購読解除機能の提供
   - イベント発行機能

6. **クライアント側dataFetchService**
   - WebSocketとRESTAPIのハイブリッド機能
   - WebSocket接続が切断された場合のフォールバック
   - キャッシュ戦略の実装
   - データ変換と正規化

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

## 実装による改善効果

### 1. APIレートリミット回避
- Bitgetとの接続は1本のみになり、API制限を回避
- 複数クライアントからの重複リクエストを排除
- 安定したデータ取得が可能に

### 2. レイテンシ低減
- ポーリング間隔による遅延がなくなり、リアルタイム性が向上
- クライアントはSocket.IO経由で即座にデータを受信
- UIの応答性が向上

### 3. スケーラビリティ向上
- サーバー側で接続を一元管理することで、水平スケールが容易に
- 将来的にEdge/Serverlessへの対応も可能
- クライアント数の増加に対して堅牢

### 4. コード責務分離
- 「取引所↔サーバ」と「サーバ↔クライアント」の明確な分離
- 各コンポーネントの変更が他に影響しにくい設計
- テスト容易性の向上

### 5. 信頼性向上
- 自動再接続機能
- RESTAPIへのフォールバック機能
- バックプレッシャー制御
- エラーハンドリングの強化

## 今後の改善点と推奨事項

1. **スケーラビリティの向上**
   - Redis Pub/Subを使用したインスタンス間通信の実装
   - マイクロサービスアーキテクチャへの移行
   - 水平スケーリングのサポート強化
   - 負荷分散の実装

2. **機能拡張**
   - 複数取引所のサポート
   - カスタムアラート機能
   - 高度なデータフィルタリング
   - ユーザー別データ購読の最適化

3. **パフォーマンス最適化**
   - データ圧縮の導入
   - バイナリプロトコルへの移行
   - エッジキャッシングの実装
   - メモリ使用量のさらなる最適化

4. **セキュリティ強化**
   - エンドツーエンド暗号化
   - レート制限の実装
   - 異常検知システムの導入
   - アクセス制御の強化

5. **モニタリングと運用**
   - 詳細なパフォーマンスメトリクスの収集
   - アラート機能の強化
   - 自動スケーリングの実装
   - 障害復旧プロセスの自動化