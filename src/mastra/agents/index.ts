// src/mastra/agents/index.ts
// 新規作成：トレーディングアシスタント用エージェント定義
// エージェントに長期記憶ツールを統合

import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import type { Memory } from '@mastra/memory';
import { mem0RememberTool, mem0MemorizeTool } from "../tools";

/**
 * メモリを使って ChatAgent インスタンスを作成する
 * メモリが提供されない場合は、ツールのみでエージェントを作成
 */
export function createChatAgent(memory?: Memory): Agent {
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
    memory: memory, // オプショナル - 提供されれば使用
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
    }
  });
}

/**
 * メモリなしでエージェントを直接作成（Next.js API Routes 用）
 */
export function createDirectAgent(): Agent {
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
      "mem0-memorize": mem0MemorizeTool,
    }
  });
}
