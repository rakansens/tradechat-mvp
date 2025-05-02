import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Mem0Integration } from '@mastra/mem0';

const mem0 = new Mem0Integration({
  config: {
    apiKey: process.env.MEM0_API_KEY,
    // TODO: 実運用ではログインユーザ ID などを渡す
    userId: "anon"
  }
});

const mem0RememberTool = createTool({
  id: "mem0-remember",
  description: "\u904E\u53BB\u306E\u30C1\u30E3\u30C3\u30C8\u3084\u53D6\u5F15\u5185\u5BB9\u304B\u3089\u95A2\u9023\u3059\u308B\u8A18\u61B6\u3092\u691C\u7D22\u3057\u307E\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u306E\u53D6\u5F15\u30B9\u30BF\u30A4\u30EB\u3084\u512A\u5148\u4E8B\u9805\u3092\u601D\u3044\u51FA\u3057\u305F\u3044\u5834\u5408\u306B\u5229\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  inputSchema: z.object({
    question: z.string().describe("\u691C\u7D22\u3057\u305F\u3044\u5185\u5BB9\u306B\u3064\u3044\u3066\u306E\u8CEA\u554F\u3084\u691C\u7D22\u30AD\u30FC\u30EF\u30FC\u30C9")
  }),
  outputSchema: z.object({
    answer: z.string().describe("\u691C\u7D22\u7D50\u679C\u3068\u3057\u3066\u898B\u3064\u304B\u3063\u305F\u8A18\u61B6\u5185\u5BB9")
  }),
  execute: async ({ context }) => {
    const memory = await mem0.searchMemory(context.question);
    return {
      answer: memory || "\u95A2\u9023\u3059\u308B\u8A18\u61B6\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002"
    };
  }
});
const mem0MemorizeTool = createTool({
  id: "mem0-memorize",
  description: "\u91CD\u8981\u306A\u53D6\u5F15\u60C5\u5831\u3084\u50BE\u5411\u3001\u30E6\u30FC\u30B6\u30FC\u512A\u5148\u4E8B\u9805\u3092\u9577\u671F\u8A18\u61B6\u306B\u4FDD\u5B58\u3057\u307E\u3059\u3002\u5F8C\u3067\u300Cmem0-remember\u300D\u30C4\u30FC\u30EB\u3067\u691C\u7D22\u3067\u304D\u307E\u3059\u3002",
  inputSchema: z.object({
    statement: z.string().describe("\u8A18\u61B6\u3068\u3057\u3066\u4FDD\u5B58\u3057\u305F\u3044\u91CD\u8981\u306A\u60C5\u5831")
  }),
  outputSchema: z.object({
    success: z.boolean().describe("\u4FDD\u5B58\u304C\u6210\u529F\u3057\u305F\u304B\u3069\u3046\u304B")
  }),
  execute: async ({ context }) => {
    try {
      await mem0.createMemory(context.statement);
      return { success: true };
    } catch (error) {
      console.error("Memory creation failed:", error);
      return { success: false };
    }
  }
});

function createChatAgent(memory) {
  return new Agent({
    name: "TradingAssistant",
    instructions: `
      You are a helpful trading assistant integrated into a chat interface.
      Your goal is to understand the user's trading intentions (buy/sell, asset, quantity) from their messages.
      When you understand the intention, respond with a structured trade proposal.
      
      You have special memory capabilities through tools:
      1. Use mem0-memorize to save important user preferences or patterns
      2. Use mem0-remember to recall information from past interactions
      
      When you learn something important about the user's preferences, trading style,
      or repeated patterns, use mem0-memorize to save this information.
      
      When a user returns, use mem0-remember to search for relevant context.
      
      Be friendly and helpful.
    `,
    model: openai(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory,
    // オプショナル - 提供されれば使用
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool
    }
  });
}
function createDirectAgent() {
  return new Agent({
    name: "TradingAssistant",
    instructions: `
      You are a helpful trading assistant integrated into a chat interface.
      Your goal is to understand the user's trading intentions (buy/sell, asset, quantity) from their messages.
      When you understand the intention, respond with a structured trade proposal.
      
      You have special memory capabilities through tools:
      1. Use mem0-memorize to save important user preferences or patterns
      2. Use mem0-remember to recall information from past interactions
      
      When you learn something important about the user's preferences, trading style,
      or repeated patterns, use mem0-memorize to save this information.
      
      When a user returns, use mem0-remember to search for relevant context.
      
      Be friendly and helpful.
    `,
    model: openai(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool
    }
  });
}

export { createChatAgent, createDirectAgent, mem0MemorizeTool, mem0RememberTool };
