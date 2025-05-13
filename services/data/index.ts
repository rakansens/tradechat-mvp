/**
 * services/data/index.ts
 * データサービスのエクスポート
 * 
 * 作成: データフェッチサービスのエクスポート
 * 更新: 2025-05-12 - オーダーブックサービスのエクスポートを追加
 * 更新: 2025-05-12 - チャートデータサービスとファクトリーのエクスポートを追加
 * 更新: 2025-05-30 - dataFetchServiceの非推奨メッセージを更新
 */

// インターフェースと型定義
export * from './interfaces';

// サービス
export * from './chart-data-service';
export * from './order-book-service';

// ファクトリー
export * from './factory';

// 非推奨のエクスポート
/**
 * @deprecated dataFetchServiceは非推奨です。代わりに専用サービスとDataFetchSliceを使用してください：
 * - データ取得状態管理: useRootStore(selectActiveFetchesInfo)
 * - データ取得登録: useRootStore(state => state.addFetch({ ... }))
 * - チャートデータ: chartDataService
 * - オーダーブック: orderBookService
 */
export { dataFetchService } from './dataFetchService';
