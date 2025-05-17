# ストア構造ドキュメント

このドキュメントでは、TradeChat MVPのZustandストア構造について説明します。

## 概要

アプリケーションのストア構造は、関心の分離に基づいて設計されています。各ストアは特定の機能領域に責任を持ち、型安全性を確保しています。

## チャートストア

チャート関連の状態は、以下の専門的なストアに分割されています：

### 1. チャートデータストア (`useChartDataStore`)

チャートのデータと取得状態を管理します。

```typescript
import { useChartDataStore } from '@/store';

// 使用例
const { 
  data,                // チャートデータ
  currentSymbol,       // 現在のシンボル
  currentTimeFrame,    // 現在のタイムフレーム
  isLoading,           // ローディング状態
  error,               // エラー状態
  fetchData,           // データ取得関数
  updateTimeFrame,     // タイムフレーム更新関数
  updateSymbol         // シンボル更新関数
} = useChartDataStore();

// データ取得
fetchData('BTC/USDT', '1d');
```

### 2. チャート設定ストア (`useChartConfigStore`)

チャートの表示設定を管理します。

```typescript
import { useChartConfigStore } from '@/store';

// 使用例
const {
  chartType,           // チャートタイプ（ローソク足、ライン、エリア）
  exchangeType,        // 取引種別（スポット、先物）
  setChartType,        // チャートタイプ設定関数
  setProductType      // 取引種別設定関数
} = useChartConfigStore();

// チャートタイプの変更
setChartType('candles');
```

### 3. インジケーターストア (`useIndicatorStore`)

テクニカルインジケーターの表示状態を管理します。

```typescript
import { useIndicatorStore } from '@/store';

// 使用例
const { 
  activeIndicators,    // アクティブなインジケーター
  toggleIndicator,     // インジケーター切替関数
  clearAllIndicators   // すべてのインジケーターをクリア
} = useIndicatorStore();

// RSIインジケーターの切替
toggleIndicator('rsi');
```

### 4. 描画ツールストア (`useDrawingToolStore`)

チャート上の描画ツールの状態を管理します。

```typescript
import { useDrawingToolStore } from '@/store';

// 使用例
const {
  activeDrawingTool,   // アクティブな描画ツール
  toggleDrawingTool,    // 描画ツール切替関数
  clearAllDrawingTools  // すべての描画ツールをクリア
} = useDrawingToolStore();

// フィボナッチツールの切替
toggleDrawingTool('fibonacci');
```

### 5. リアルタイム更新ストア (`useRealTimeStore`)

リアルタイムデータの更新設定とWebSocket接続を管理します。

```typescript
import { useRealTimeStore } from '@/store';

// 使用例
const { 
  useRealTimeData,      // リアルタイムデータを使用するかのフラグ
  toggleRealTimeData,   // リアルタイムデータの使用を切り替える
  startRealTimeUpdates, // リアルタイム更新を開始
  stopRealTimeUpdates   // リアルタイム更新を停止
} = useRealTimeStore();

// リアルタイムデータの切替
toggleRealTimeData();
```

## その他のストア

### UIストア (`useUIStore`)

UIの状態（アクティブなタブなど）を管理します。

```typescript
import { useUIStore } from '@/store';

// 使用例
const { 
  activeTab,           // アクティブなタブ
  setActiveTab         // タブ切替関数
} = useUIStore();

// タブの切替
setActiveTab('chart');
```

### エントリーストア (`useEntryStore`)

トレードエントリーの状態を管理します。

```typescript
import { useEntryStore } from '@/store';

// 使用例
const { 
  entries,             // エントリーリスト
  pendingEntry,        // 保留中のエントリー
  executeEntry,        // エントリー実行関数
  closePosition        // ポジションクローズ関数
} = useEntryStore();
```

### チャットストア (`useChatStore`)

チャットの状態とメッセージを管理します。

```typescript
import { useChatStore } from '@/store';

// 使用例
const { 
  messages,            // メッセージリスト
  isSearching,         // 検索中フラグ
  addMessage,          // メッセージ追加関数
  handleAIProposalQuery // AIプロポーザルクエリ処理関数
} = useChatStore();
```

## ベストプラクティス

1. **セレクターの使用**
   - パフォーマンスのために、必要な状態のみを選択してください
   ```typescript
   const data = useChartDataStore(state => state.data);
   ```

2. **アクション呼び出し**
   - ストアのアクションを使用して状態を更新してください
   ```typescript
   const updateTimeFrame = useChartDataStore(state => state.updateTimeFrame);
   updateTimeFrame('1h');
   ```

3. **型安全性**
   - 型定義を活用して、型安全性を確保してください
   ```typescript
   import type { TabType } from '@/types/store';
   const setActiveTab = useUIStore(state => state.setActiveTab);
   setActiveTab('chart' as TabType);
   ```

## 注意点

- 各ストアは独立しているため、ストア間で状態を共有する場合は、他のストアから状態を取得する必要があります
- パフォーマンスのために、必要な状態のみを選択してください
- 大きな状態変更は、バッチ処理するか、トランザクション内で行ってください
