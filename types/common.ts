/**
 * @deprecated このファイルはT-5フェーズで非推奨となりました。代わりに types/common/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/common からインポートすることを推奨します。
 */

// types/common.ts
// 作成: アプリケーション全体で共通して使用される型定義
// 更新: API関連の型定義をtypes/api.tsに移動

// T-5フェーズ: 実装が types/common/base.ts に移動されました。
// 既存のインポートパスを壊さないように、新しいファイルから再エクスポートします。
export * from './common/base';

// 以下は旧定義（参照用）

/*
 * 日時関連の型
 */
// export type DateFormat = "iso" | "locale" | "relative";

/*
 * 価格フォーマットのオプション
 */
// export interface PriceFormatOptions {
//   currency?: string;     // 通貨単位（例: "USD", "JPY"）
//   precision?: number;    // 小数点以下の桁数
//   showSymbol?: boolean;  // 通貨記号を表示するか
// }

/*
 * アプリケーションの設定
 */
// export interface AppSettings {
//   language?: string;     // 言語設定
//   theme?: "light" | "dark" | "system"; // テーマ設定
//   notifications?: boolean; // 通知を有効にするか
//   defaultTimeframe?: string; // デフォルトのタイムフレーム
//   defaultChartType?: string; // デフォルトのチャートタイプ
// }

// APIレスポンスの型定義はtypes/api.tsに移動しました
// import { ApiResponse } from './api';

/*
 * ページネーション情報
 */
// export interface PaginationInfo {
//   page: number;
//   limit: number;
//   total: number;
//   hasMore: boolean;
// }
