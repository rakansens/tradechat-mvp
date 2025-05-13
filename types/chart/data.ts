// types/chart/data.ts
// チャートの基本データ型定義

import { z } from "zod";
import {
  ohlcDataSchema,
  chartDataStateSchema
} from "@/lib/validations/chart";
import { Time, Timeframe, ChartType } from "../chart/time";

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
 * ZodスキーマからのOHLCデータの型
 */
export type OHLCDataSchema = z.infer<typeof ohlcDataSchema>;

/**
 * Zodスキーマからのチャートデータステートの型
 */
export type ChartDataStateSchema = z.infer<typeof chartDataStateSchema>;

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
 * チャートストアの状態型
 */
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
 * タイムフレームマッピング（スポット取引用）
 */
export const TIMEFRAME_MAP_SPOT: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '8h': '8H',
  '12h': '12H',
  '1d': '1D',
  '3d': '3D',
  '1w': '1W',
  '1M': '1M',
};

/**
 * タイムフレームマッピング（先物取引用・WebSocket/REST 共通）
 */
export const TIMEFRAME_MAP_FUTURES: Record<string, string> = {
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '2h': '2H',
  '4h': '4H',
  '6h': '6H',
  '8h': '8H',
  '12h': '12H',
  '1d': '1D',
  '3d': '3D',
  '1w': '1W',
  '1M': '1M',
}; 