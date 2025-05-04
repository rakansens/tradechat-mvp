// utils/socketUtils.ts
// チャートキャプチャ用のWebSocket通信インターフェース

/**
 * ソケットメッセージのタイプ定義
 */
export enum SocketMessageType {
  // サーバーからのキャプチャリクエスト
  CAPTURE_REQUEST = 'CAPTURE_REQUEST',
  // クライアントからのキャプチャレスポンス
  CAPTURE_RESPONSE = 'CAPTURE_RESPONSE',
  // エラーメッセージ
  ERROR = 'ERROR'
}

/**
 * ソケットメッセージのインターフェース
 */
export interface SocketMessage {
  type: SocketMessageType;
  payload: any;
  requestId?: string; // リクエストとレスポンスを紐付けるためのID
}

// クライアント側のキャプチャリクエストハンドラ
let captureRequestHandler: ((requestId: string) => Promise<string | null>) | null = null;

/**
 * クライアント側でキャプチャリクエストを処理するハンドラを登録
 * @param handler キャプチャを実行して結果を返す関数
 */
export function registerCaptureHandler(handler: (requestId: string) => Promise<string | null>) {
  captureRequestHandler = handler;
}

/**
 * クライアント側でソケットメッセージを処理
 * @param message 受信したメッセージ
 * @param sendResponse レスポンスを送信するコールバック
 */
export async function handleSocketMessage(
  message: SocketMessage,
  sendResponse: (response: SocketMessage) => void
) {
  if (message.type === SocketMessageType.CAPTURE_REQUEST) {
    if (!captureRequestHandler) {
      sendResponse({
        type: SocketMessageType.ERROR,
        payload: 'キャプチャハンドラが登録されていません',
        requestId: message.requestId
      });
      return;
    }

    try {
      const imageData = await captureRequestHandler(message.requestId || '');
      sendResponse({
        type: SocketMessageType.CAPTURE_RESPONSE,
        payload: imageData, 
        requestId: message.requestId
      });
    } catch (error) {
      sendResponse({
        type: SocketMessageType.ERROR,
        payload: `キャプチャエラー: ${error}`,
        requestId: message.requestId
      });
    }
  }
}

// リクエストとプロミスを保持するマップ
type RequestResolver = {
  resolve: (value: string | null) => void;
  reject: (reason: any) => void;
  timeout: NodeJS.Timeout;
};

const pendingRequests = new Map<string, RequestResolver>();

/**
 * サーバー側でキャプチャをリクエスト
 * @param requestId リクエストID
 * @param sendRequest リクエストを送信するコールバック
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @returns キャプチャしたBase64画像データ
 */
export function requestCapture(
  requestId: string,
  sendRequest: (request: SocketMessage) => void,
  timeoutMs: number = 10000
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // リクエスト送信
    sendRequest({
      type: SocketMessageType.CAPTURE_REQUEST,
      payload: null,
      requestId
    });

    // タイムアウト設定
    const timeout = setTimeout(() => {
      const request = pendingRequests.get(requestId);
      if (request) {
        request.reject(new Error('キャプチャリクエストがタイムアウトしました'));
        pendingRequests.delete(requestId);
      }
    }, timeoutMs);

    // 保留中リクエストに追加
    pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout
    });
  });
}

/**
 * サーバー側でソケットメッセージを処理
 * @param message 受信したメッセージ
 */
export function handleServerSocketMessage(message: SocketMessage) {
  const { type, payload, requestId } = message;

  if (!requestId) return;

  const request = pendingRequests.get(requestId);
  if (!request) return;

  clearTimeout(request.timeout);
  
  if (type === SocketMessageType.CAPTURE_RESPONSE) {
    request.resolve(payload);
  } else if (type === SocketMessageType.ERROR) {
    request.reject(new Error(payload));
  }
  
  pendingRequests.delete(requestId);
} 