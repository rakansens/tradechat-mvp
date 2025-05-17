/**
 * @deprecated このファイルはT-3フェーズのリファクタリングで非推奨になりました。
 * 代わりに types/network/api.ts を使用してください。
 * 
 * このファイルは後方互換性のために維持されていますが、将来のバージョンで削除される可能性があります。
 */

/**
 * types/api.ts
 * 作成: 2025-10-12 - S-12: ExchangeType互換性問題を解決するためのエクスポート
 * 
 * このファイルはネットワーク/APIの型をまとめて再エクスポートし、
 * ExchangeTypeの型の一元管理を実現します。
 */

// 標準的なAPI型をnetwork/apiからエクスポート
export * from './network/api';

// typesディレクトリの他の場所で定義されている型
import { 
  ExchangeType, 
  ExchangeProductType,
  ProductType,
  EXCHANGE_TYPES,
  EXCHANGE_PRODUCT_TYPES,
  PRODUCT_TYPES
} from './constants/enums';

// 型を再エクスポート
export type { ExchangeType, ExchangeProductType, ProductType };

// 定数も再エクスポート
export { EXCHANGE_TYPES, EXCHANGE_PRODUCT_TYPES, PRODUCT_TYPES };
