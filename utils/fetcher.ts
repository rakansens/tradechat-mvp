/**
 * utils/fetcher.ts
 * 
 * API呼び出し用の共通フェッチユーティリティ
 * - 401エラー時にサインインページへリダイレクト
 * - エラーレスポンスを適切に処理
 * - TypeScriptのジェネリック型対応
 * - AbortController対応（モバイルスクロール中のリクエスト破棄用）
 * 
 * 作成日: 2025/6/28
 */

export async function fetcher<T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

/**
 * AbortControllerを使用したfetcherのラッパー
 * モバイルでのスクロール中などにリクエストを破棄するために使用
 * 
 * @example
 * const { data, error, isLoading, abort } = useFetchWithAbort('/api/positions');
 * // コンポーネントのクリーンアップ時やスクロール開始時などに
 * abort();
 */
export function createAbortableFetcher() {
  // AbortControllerのインスタンスを作成
  const controller = new AbortController();
  const { signal } = controller;

  // 拡張されたfetcher関数
  const fetchWithAbort = async <T = unknown>(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<T> => {
    return fetcher<T>(input, {
      ...init,
      signal, // AbortControllerのsignalを渡す
    });
  };

  // 中断関数
  const abort = () => {
    controller.abort();
  };

  return {
    fetch: fetchWithAbort,
    abort,
  };
} 