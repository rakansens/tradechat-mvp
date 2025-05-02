// src/mastra/index.ts
// 更新：メインエントリポイント
// Mastra標準プロジェクト構造に準拠したエクスポート
// 警告修正：LibSQLStoreを追加してストレージ設定を明示的に指定

import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { mem0 } from './integrations';
import { createChatAgent } from './agents';
import path from 'path';

// エージェントインスタンスを作成する
// メモリはパラメータとして渡さずにエージェント内部で作成されるようにする
export const chatAgent = createChatAgent();

// データベースパスをプロジェクトルートからの相対パスで指定
const dbPath = path.resolve(process.cwd(), 'mastra.db');
const dbUrl = `file:${dbPath}`;

// Mastraインスタンスを作成してエクスポート
export const mastra = new Mastra({
  agents: {
    tradingAssistant: chatAgent
  },
  // 明示的にストレージを設定して警告を解消
  storage: new LibSQLStore({
    url: dbUrl
  })
});

// エージェント
export * from './agents';

// ツール
export * from './tools';

// 統合
export { mem0 } from './integrations';
