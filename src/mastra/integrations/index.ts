// src/mastra/integrations/index.ts
// 新規作成：Mem0統合のエクスポートファイル
// Mem0Integration を構成して長期記憶機能を提供

import { Mem0Integration } from "@mastra/mem0";

export const mem0 = new Mem0Integration({
  config: {
    apiKey: process.env.MEM0_API_KEY!,
    // TODO: 実運用ではログインユーザ ID などを渡す
    userId: "anon",
  },
});
