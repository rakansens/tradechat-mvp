/**
 * services/index.ts
 * サービスのエクスポート
 * 
 * 作成: リファクタリングされたサービスのエクスポート
 */

// 既存のサービス
export * from './bitgetApi';
export * from './socketService';
export * from './errorHandler';
export * from './api';
export * from './apiClientFactory';

// リファクタリングされたサービス
export * from './cache';
export * from './history';
export * from './data';

// 後方互換性のために既存のdataFetchServiceもエクスポート
// @deprecated このエクスポートは後方互換性のためだけに残されています。
// 新しいコードでは services/data から直接インポートしてください。
// 例: import { dataFetchService } from '@/services/data';
// このエクスポートは将来のバージョンで削除される予定です。
export { dataFetchService as legacyDataFetchService } from './dataFetchService';
