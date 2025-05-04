// utils/socketUtils.ts
// Socket.ioを使用したチャートキャプチャ用のユーティリティ

/**
 * キャプチャリクエストとレスポンスの型定義
 */
export interface CaptureRequest {
  requestId: string;
}

export interface CaptureResponse {
  requestId: string;
  imageData: string;
}

export interface ErrorResponse {
  requestId: string;
  error: string;
}

// キャプチャリクエストとプロミスのマップ（サーバー側で使用）
export interface PendingRequest {
  clientId: string;
  timestamp: number;
  resolve?: (value: string | null) => void;
  reject?: (reason: any) => void;
  timeout?: NodeJS.Timeout;
}

/**
 * プロミスとタイムアウトを管理するリクエストトラッカー
 */
export class RequestTracker {
  private pendingRequests = new Map<string, PendingRequest>();
  
  /**
   * 新しいリクエストを登録
   * @param requestId リクエストID
   * @param clientId クライアントID
   * @param resolve 成功時コールバック
   * @param reject 失敗時コールバック
   * @param timeoutMs タイムアウト時間
   */
  registerRequest(
    requestId: string, 
    clientId: string,
    resolve: (value: string | null) => void,
    reject: (reason: any) => void,
    timeoutMs: number = 15000
  ): void {
    // タイムアウト設定
    const timeout = setTimeout(() => {
      const request = this.pendingRequests.get(requestId);
      if (request) {
        if (request.reject) {
          request.reject(new Error('キャプチャリクエストがタイムアウトしました'));
        }
        this.pendingRequests.delete(requestId);
      }
    }, timeoutMs);
    
    // 保留中リクエストに追加
    this.pendingRequests.set(requestId, {
      clientId,
      timestamp: Date.now(),
      resolve,
      reject,
      timeout
    });
  }
  
  /**
   * リクエストを解決
   * @param requestId リクエストID
   * @param data レスポンスデータ
   * @returns 成功したか
   */
  resolveRequest(requestId: string, data: string | null): boolean {
    const request = this.pendingRequests.get(requestId);
    if (!request) return false;
    
    if (request.timeout) {
      clearTimeout(request.timeout);
    }
    
    if (request.resolve) {
      request.resolve(data);
    }
    
    this.pendingRequests.delete(requestId);
    return true;
  }
  
  /**
   * リクエストをエラーで拒否
   * @param requestId リクエストID
   * @param error エラー
   * @returns 成功したか
   */
  rejectRequest(requestId: string, error: any): boolean {
    const request = this.pendingRequests.get(requestId);
    if (!request) return false;
    
    if (request.timeout) {
      clearTimeout(request.timeout);
    }
    
    if (request.reject) {
      request.reject(error);
    }
    
    this.pendingRequests.delete(requestId);
    return true;
  }
  
  /**
   * リクエストが存在するか確認
   * @param requestId リクエストID
   * @returns 存在するか
   */
  hasRequest(requestId: string): boolean {
    return this.pendingRequests.has(requestId);
  }
  
  /**
   * リクエストを取得
   * @param requestId リクエストID
   * @returns リクエスト情報
   */
  getRequest(requestId: string): PendingRequest | undefined {
    return this.pendingRequests.get(requestId);
  }
  
  /**
   * 古いリクエストをクリーンアップ
   * @param maxAgeMs 最大有効期間
   */
  cleanupOldRequests(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > maxAgeMs) {
        if (request.timeout) {
          clearTimeout(request.timeout);
        }
        
        if (request.reject) {
          request.reject(new Error('リクエストがタイムアウトしました'));
        }
        
        this.pendingRequests.delete(requestId);
      }
    }
  }
} 