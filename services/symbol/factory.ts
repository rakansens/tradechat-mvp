// services/symbol/factory.ts
// 作成: symbolServiceのインスタンスを提供するファクトリー

import { symbolService } from './symbol-service';

/**
 * シンボルサービスのシングルトンインスタンスを取得
 * @returns symbolServiceのインスタンス
 */
export function getSymbolService() {
  return symbolService;
}

// デフォルトエクスポート
export default getSymbolService; 