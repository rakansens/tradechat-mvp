/**
 * services/data/index.ts
 * データサービスのエクスポート
 * 
 * 作成: データフェッチサービスのエクスポート
 * 更新: 2025-05-12 - オーダーブックサービスのエクスポートを追加
 * 更新: 2025-05-12 - チャートデータサービスとファクトリーのエクスポートを追加
 */

// インターフェースと型定義
export * from './interfaces';

// サービス
export * from './chart-data-service';
export * from './order-book-service';

// ファクトリー
export * from './factory';

// 非推奨のエクスポート
// @deprecated 代わりに新しいサービスを使用してください
// 重複しないようにインターフェースはエクスポートしない
export { dataFetchService } from './dataFetchService';
