/**
 * components/position/history/hooks/usePriceSimulator.ts
 * 
 * SSR安全な価格シミュレーションを提供するフック
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxからロジックを抽出
 */

import { useCallback } from "react"

/**
 * SSR安全な価格シミュレーションを提供するフック
 * 
 * サーバーサイドレンダリング時には元の価格を返し、
 * クライアントサイドでは±5%のランダムな変動を加えた価格を返します。
 * 
 * @returns 価格をシミュレーションする関数
 */
export function usePriceSimulator() {
  // 価格シミュレーション関数
  const getCurrentPrice = useCallback((entryPrice: number) => {
    if (typeof window === "undefined") {
      // サーバーサイドでは決定論的に元の価格を返す
      return entryPrice
    }

    // クライアントサイドでのみ、ランダムな変動（±5%）を追加
    const randomChange = (Math.random() - 0.5) * 0.1
    return entryPrice * (1 + randomChange)
  }, [])

  return getCurrentPrice
}

export default usePriceSimulator 