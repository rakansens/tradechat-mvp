// src/mastra/index.ts
// 変更：Mastraインスタンスを作成し、エージェントとLibSQLStoreでストレージを設定してエクスポート (マージコンフリクト解消)
import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { createChatAgent } from './agents'; // エージェント設定のためにインポート
import path from 'path';

// LibSQLStoreの設定 (環境変数などから取得するのが望ましい)
const libsqlConfig = {
  url: process.env.LIBSQL_DB_URL || `file:${path.resolve(process.cwd(), 'mastra.db')}`, // 環境変数またはデフォルト値
  authToken: process.env.LIBSQL_AUTH_TOKEN, // 環境変数から
};

// エージェントインスタンスを作成
const chatAgent = createChatAgent(); // ここでインスタンス化

// Mastraインスタンスを作成し、エージェントとストレージを設定
export const mastra = new Mastra({
  agents: { // エージェントを登録
    tradingAssistant: chatAgent
  },
  storage: new LibSQLStore(libsqlConfig),
});

// 既存のエクスポート (main ブランチのまま)
export * from './agents';
export * from './tools';
export { mem0 } from './integrations';
