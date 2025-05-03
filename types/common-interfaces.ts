// types/common-interfaces.ts
// 作成: コンポーネント間で共有される共通インターフェース
// 更新: 型定義を整理し、コメントを追加
//
// このファイルは主にコンポーネントのプロップス型を定義しています。
// データモデルの型定義は各ドメイン固有のファイル（chart.ts、market.tsなど）に配置されています。

import type { Entry } from "./entry";
import type { ChartType, Timeframe, OHLCData } from "./chart";
import type { ExtendedMessage } from "./chat";

/**
 * タイムフレーム制御に関する共通プロパティ
 */
export interface TimeframeControlProps {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

/**
 * チャートタイプ制御に関する共通プロパティ
 */
export interface ChartTypeControlProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

/**
 * チャート表示に関する共通プロパティ
 */
export interface ChartViewProps {
  ohlcData: OHLCData[];
  entries: Entry[];
}

/**
 * トレード実行に関する共通プロパティ
 */
export interface TradeActionProps {
  onExecuteEntry?: () => void;
  onClosePosition?: (entryId: string, exitPrice: number) => void;
  onCancelPosition?: (entryId: string) => void;
}

/**
 * ポジション操作に関する必須プロパティ
 */
export interface PositionActionProps {
  onClosePosition: (entryId: string, exitPrice: number) => void;
  onCancelPosition: (entryId: string) => void;
}

/**
 * メッセージ表示に関する共通プロパティ
 */
export interface MessageDisplayProps {
  messages: ExtendedMessage[];
  isSearching?: boolean;
}

/**
 * テーマ設定に関する共通プロパティ
 */
export interface ThemeProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}
