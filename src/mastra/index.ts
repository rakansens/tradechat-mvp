// src/mastra/index.ts
// 変更：Mastraインスタンスを作成し、LibSQLStoreでストレージを設定してエクスポート

// Mastraインスタンスを作成し、LibSQLStoreでストレージを設定してエクスポート
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';

// LibSQLStoreの設定 (環境変数などから取得するのが望ましい)
const libsqlConfig = {
  url: process.env.LIBSQL_DB_URL || 'file:local.db', // 環境変数またはデフォルト値
  authToken: process.env.LIBSQL_AUTH_TOKEN, // 環境変数から
};

// Mastraインスタンスを作成し、ストレージを設定
export const mastra = new Mastra({
  storage: new LibSQLStore(libsqlConfig),
});

// 既存のエクスポート
export * from './agents';
export * from './tools';
export { mem0 } from './integrations';
