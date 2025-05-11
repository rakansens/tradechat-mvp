/**
 * services/history/requestHistoryTypes.ts
 * リクエスト履歴サービスの型定義
 * 
 * 作成: リクエスト履歴サービスのインターフェースと型定義
 */

export interface RequestHistoryEntry {
  url: string;
  method: string;
  timestamp: number;
  duration: number;
  status: number;
  success: boolean;
}

export interface IRequestHistoryService {
  /**
   * リクエスト履歴を追加
   * @param entry 追加するリクエスト履歴エントリ
   */
  addEntry(entry: RequestHistoryEntry): void;
  
  /**
   * リクエスト履歴を取得
   * @returns リクエスト履歴の配列
   */
  getHistory(): RequestHistoryEntry[];
  
  /**
   * リクエスト履歴をクリア
   */
  clearHistory(): void;
}
