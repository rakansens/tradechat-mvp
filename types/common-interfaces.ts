/**
 * @deprecated このファイルはT-5フェーズで非推奨となりました。代わりに types/common/interfaces.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/common からインポートすることを推奨します。
 */

// types/common-interfaces.ts
// 作成: コンポーネント間で共有される共通インターフェース
// 更新: 型定義を整理し、コメントを追加
//
// このファイルは主にコンポーネントのプロップス型を定義しています。
// データモデルの型定義は各ドメイン固有のファイル（chart.ts、market.tsなど）に配置されています。

// T-5フェーズ: 実装が types/common/interfaces.ts に移動されました。
// 既存のインポートパスを壊さないように、新しいファイルから再エクスポートします。
export * from './common/interfaces';

// 以下は旧定義（参照用）

// import type { Entry } from "./entry";
// import type { ChartType, Timeframe, OHLCData } from "./chart";
// import type { ExtendedMessage } from "./chat";

/*
 * タイムフレーム制御に関する共通プロパティ
 */
// export interface TimeframeControlProps {
//   timeframe: Timeframe;
//   onTimeframeChange: (timeframe: Timeframe) => void;
// }

/*
 * チャートタイプ制御に関する共通プロパティ
 */
// export interface ChartTypeControlProps {
//   chartType: ChartType;
//   onChartTypeChange: (type: ChartType) => void;
// }

/*
 * チャート表示に関する共通プロパティ
 */
// export interface ChartViewProps {
//   ohlcData: OHLCData[];
//   entries: Entry[];
// }

/*
 * トレード実行に関する共通プロパティ
 */
// export interface TradeActionProps {
//   onExecuteEntry?: () => void;
//   onClosePosition?: (entryId: string, exitPrice: number) => void;
//   onCancelPosition?: (entryId: string) => void;
// }

/*
 * ポジション操作に関する必須プロパティ
 */
// export interface PositionActionProps {
//   onClosePosition: (entryId: string, exitPrice: number) => void;
//   onCancelPosition: (entryId: string) => void;
// }

/*
 * メッセージ表示に関する共通プロパティ
 */
// export interface MessageDisplayProps {
//   messages: ExtendedMessage[];
//   isSearching?: boolean;
// }

/*
 * テーマ設定に関する共通プロパティ
 */
// export interface ThemeProps {
//   isDarkMode: boolean;
//   toggleTheme: () => void;
// }
