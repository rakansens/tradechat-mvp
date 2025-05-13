/**
 * 基本的な共通型定義
 * 
 * このファイルはアプリケーション全体で共通して使用される基本的な型定義を集約しています。
 * T-5フェーズでtypes/common.tsから移動されました。
 */

/**
 * 日時関連の型
 */
export type DateFormat = "iso" | "locale" | "relative";

/**
 * 価格フォーマットのオプション
 */
export interface PriceFormatOptions {
  currency?: string;     // 通貨単位（例: "USD", "JPY"）
  precision?: number;    // 小数点以下の桁数
  showSymbol?: boolean;  // 通貨記号を表示するか
}

/**
 * アプリケーションの設定
 */
export interface AppSettings {
  language?: string;     // 言語設定
  theme?: "light" | "dark" | "system"; // テーマ設定
  notifications?: boolean; // 通知を有効にするか
  defaultTimeframe?: string; // デフォルトのタイムフレーム
  defaultChartType?: string; // デフォルトのチャートタイプ
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
} 