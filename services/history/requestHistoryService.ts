/**
 * services/history/requestHistoryService.ts
 * リクエスト履歴サービスの実装
 * 
 * 作成: リクエスト履歴サービスの実装
 */

import { IRequestHistoryService, RequestHistoryEntry } from './requestHistoryTypes';

export class RequestHistoryService implements IRequestHistoryService {
  private history: RequestHistoryEntry[] = [];
  private readonly MAX_ENTRIES = 100; // 最大保持エントリ数
  
  /**
   * リクエスト履歴を追加
   * @param entry 追加するリクエスト履歴エントリ
   */
  addEntry(entry: RequestHistoryEntry): void {
    this.history.push(entry);
    
    // 履歴が最大数を超えた場合、古いものから削除
    if (this.history.length > this.MAX_ENTRIES) {
      this.history.shift();
    }
  }
  
  /**
   * リクエスト履歴を取得
   * @returns リクエスト履歴の配列
   */
  getHistory(): RequestHistoryEntry[] {
    return [...this.history];
  }
  
  /**
   * リクエスト履歴をクリア
   */
  clearHistory(): void {
    this.history = [];
  }
}

// シングルトンインスタンスをエクスポート
export const requestHistoryService = new RequestHistoryService();
