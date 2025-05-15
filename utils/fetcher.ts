/**
 * utils/fetcher.ts
 * 
 * API呼び出し用の共通フェッチユーティリティ
 * - 401エラー時にサインインページへリダイレクト
 * - エラーレスポンスを適切に処理
 * - TypeScriptのジェネリック型対応
 * - AbortController対応（モバイルスクロール中のリクエスト破棄用）
 * - React Queryの`queryFn`として直接使用可能
 * - 204 No Content応答を適切に処理
 * 
 * 作成日: 2025/6/28
 * 更新日: 2025/6/29 - SPAリダイレクトの実装
 */

import { useRouter } from 'next/navigation';

// Routerをグローバルに設定するための変数
let globalRouter: ReturnType<typeof useRouter> | null = null;

// アプリ内で一度だけルーターをセットするためのヘルパー関数
export function setGlobalRouter(router: ReturnType<typeof useRouter>) {
  globalRouter = router;
}

/**
 * JSON APIからデータを取得する汎用関数
 * React QueryのqueryFnとして使用することを想定
 * 
 * @example
 * // React Queryでの使用例
 * const { data } = useQuery({
 *   queryKey: ['positions', tabId],
 *   queryFn: () => fetchJSON('/api/positions')
 * });
 */
export async function fetchJSON<T = unknown>(
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
      // 可能であればSPA遷移を使用
      if (globalRouter) {
        globalRouter.push('/signin');
      } else {
        // フォールバックとしてwindow.locationを使用
        window.location.href = '/signin';
      }
    }
    throw new Error('Unauthorized');
  }

  // 204 No Contentの場合は空のオブジェクトまたは配列を返す
  if (res.status === 204) {
    // 型に基づいて空の結果を返す
    // Genericsで配列型かどうか判断できないため、
    // 基本的に空のオブジェクトを返す
    return {} as T;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

// 後方互換性のため旧名でもエクスポート
export const fetcher = fetchJSON;

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
    return fetchJSON<T>(input, {
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