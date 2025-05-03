// types/chart.ts
// 作成: チャート関連の型定義
// 更新: 一目均衡表とフィボナッチリトレースメントの型を追加

/**
 * チャートのタイムフレーム
 */
export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

/**
 * チャートの表示タイプ
 */
export type ChartType = "candles" | "line" | "bar" | "area";

/**
 * OHLC（始値・高値・安値・終値）データの型
 */
export interface OHLCData {
  time: number;        // UNIXタイムスタンプ (ミリ秒)
  open: number;        // 始値
  high: number;        // 高値
  low: number;         // 安値
  close: number;       // 終値
  volume?: number;     // 取引量（オプション）
}

/**
 * チャート上のマーカー（注釈）の型
 */
export interface ChartMarker {
  time: number;                              // マーカーの時間位置（Unix タイムスタンプ）
  position: "aboveBar" | "belowBar" | "inBar"; // マーカーの位置
  color: string;                             // マーカーの色
  shape: "circle" | "square" | "arrowUp" | "arrowDown"; // マーカーの形状
  text: string;                              // マーカーのテキスト
  size: number;                              // マーカーのサイズ
}

/**
 * チャートの設定オプション
 */
export interface ChartOptions {
  showVolume?: boolean;        // ボリュームを表示するか
  showGrid?: boolean;          // グリッドを表示するか
  showLegend?: boolean;        // 凡例を表示するか
  theme?: "light" | "dark";    // チャートのテーマ
}

/**
 * テクニカル指標の型
 */
export interface TechnicalIndicator {
  type: "ma" | "ema" | "rsi" | "macd" | "bollinger" | "ichimoku" | "fibonacci"; // 指標の種類
  params: Record<string, number>;                    // 指標のパラメータ
  color?: string;                                    // 表示色
  visible: boolean;                                  // 表示するか
}

/**
 * 一目均衡表の設定オプション
 */
export interface IchimokuOptions {
  tenkan?: number;   // 転換線の期間 (デフォルト: 9)
  kijun?: number;    // 基準線の期間 (デフォルト: 26)
  senkou?: number;   // 先行スパンBの期間 (デフォルト: 52)
}

/**
 * フィボナッチリトレースメントの方向
 */
export type FibonacciDirection = 'up' | 'down';

/**
 * フィボナッチリトレースメントの設定オプション
 */
export interface FibonacciOptions {
  startPrice: number;      // 開始価格（高値または安値）
  endPrice: number;        // 終了価格（安値または高値）
  direction: FibonacciDirection; // リトレースメントの方向
}

/**
 * チャートストアの状態型
 */
/**
 * タイムフレームマッピング（スポット取引用）
 */
export const TIMEFRAME_MAP_SPOT: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W',
};

/**
 * タイムフレームマッピング（先物取引用・WebSocket/REST 共通）
 */
export const TIMEFRAME_MAP_FUTURES: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W',
};

export interface ChartState {
  // 状態
  timeframe: Timeframe;
  chartType: ChartType;
  ohlcData: OHLCData[];
  indicators?: TechnicalIndicator[];
  options?: ChartOptions;

  // アクション
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (type: ChartType) => void;
  refreshOhlcData: () => void;
  toggleIndicator?: (type: TechnicalIndicator["type"]) => void;
  updateOptions?: (options: Partial<ChartOptions>) => void;
}
