/**
 * services/index.ts
 * サービスのエクスポート
 * 
 * 作成: リファクタリングされたサービスのエクスポート
 * 更新: 2025-05-12 - BitgetApiClientのリファクタリングに伴い参照を更新
 */

// 既存のサービス
export * from './socket';

// Bitget APIクライアント
export * from './api/bitget/client';
export * from './api/bitget/interfaces';
export * from './api/bitget/rest-client';
export * from './api/bitget/websocket-client';
export * from './api/bitget/data-transformer';

// 新しいAPIサービスパス
export * from './api/common/request';
export * from './api/client-factory';
export * from './errors/handler';
export * from './api/common/environment';

// リファクタリングされたサービス
export * from './cache';
export * from './history';
export * from './data';
export * from './reset';

// 古いdataFetchServiceのエクスポートは削除されました
