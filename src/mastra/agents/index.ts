// src/mastra/agents/index.ts
// 更新：トレーディングアシスタント用エージェント定義
// エージェントに長期記憶ツールとチャートキャプチャツールを統合
// Changes: Fixed LibSQLVector initialization for compatibility with @libsql/client
// Changes: Resolved path issues and URL format problems

import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from '@mastra/memory';
import { createClient } from '@libsql/client';  // 直接createClientをインポート
import { mem0RememberTool, mem0MemorizeTool, chartCaptureAnalysisTool } from "../tools";

// 単純化のためにメモリベクトルストアを使用
const memoryOptions = {
  // Set explicit options matching old defaults to maintain behavior
  options: {
    lastMessages: 40,
    semanticRecall: false, // Disable embeddings during tests
    threads: {
      generateTitle: true
    }
  }
};

/**
 * メモリを使って ChatAgent インスタンスを作成する
 * メモリが提供されない場合は、ツールのみでエージェントを作成
 */
export function createChatAgent(memory?: Memory): Agent {
  // Explicitly configure Memory 
  if (!memory) {
    memory = new Memory(memoryOptions);
  }

  return new Agent({
    name: "TradingAssistant",
    instructions: `
      You are a helpful trading assistant integrated into a chat interface.
      Your goal is to understand the user's trading intentions (buy/sell, asset, quantity) from their messages.
      When you understand the intention, respond with a structured trade proposal.
      
      You have special memory capabilities through tools:
      1. Use mem0-memorize to save important user preferences or patterns
      2. Use mem0-remember to recall information from past interactions
      
      You can also analyze the current trading chart:
      3. Use chart-capture-analysis to capture and analyze the current chart to make trading decisions
      
      When you learn something important about the user's preferences, trading style,
      or repeated patterns, use mem0-memorize to save this information.
      
      When a user returns, use mem0-remember to search for relevant context.
      
      When the user asks for chart analysis or trading advice based on the current chart,
      use chart-capture-analysis to get AI-powered insights on the chart.
      
      Be friendly and helpful.
    `,
    model: openai(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory, 
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
      "chart-capture-analysis": chartCaptureAnalysisTool,
    }
  });
}

/**
 * メモリなしでエージェントを直接作成（Next.js API Routes 用）
 */
export function createDirectAgent(): Agent {
  console.log("Inside createDirectAgent - Checking OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? 'Exists' : 'MISSING'); // Debug log
  
  // Explicitly configure Memory 
  const memory = new Memory(memoryOptions);

  return new Agent({
    name: "TradingAssistant",
    instructions: `
      You are a helpful trading assistant integrated into a chat interface.
      Your goal is to understand the user's trading intentions (buy/sell, asset, quantity) from their messages.
      When you understand the intention, respond with a structured trade proposal.
      
      You have special memory capabilities through tools:
      1. Use mem0-memorize to save important user preferences or patterns
      2. Use mem0-remember to recall information from past interactions
      
      You can also analyze the current trading chart:
      3. Use chart-capture-analysis to capture and analyze the current chart to make trading decisions
      
      When you learn something important about the user's preferences, trading style,
      or repeated patterns, use mem0-memorize to save this information.
      
      When a user returns, use mem0-remember to search for relevant context.
      
      When the user asks for chart analysis or trading advice based on the current chart,
      use chart-capture-analysis to get AI-powered insights on the chart.
      
      Be friendly and helpful.
    `,
    model: openai(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory, 
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
      "chart-capture-analysis": chartCaptureAnalysisTool,
    }
  });
}
