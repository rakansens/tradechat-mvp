// src/mastra/agents/index.ts
// 新規作成：トレーディングアシスタント用エージェント定義
// エージェントに長期記憶ツールを統合
// Changes: Updated Memory config for deprecation warnings.
// Changes: Fixed Memory import to be a value import.
// Changes: Use process.cwd() for LibSQLVector path.

import path from 'path'; // Import path module
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { Memory } from '@mastra/memory';
import { LibSQLVector } from '@mastra/libsql'; // Import LibSQLVector
import { mem0RememberTool, mem0MemorizeTool } from "../tools";

// Construct database path relative to project root
const dbPath = path.resolve(process.cwd(), 'memory.db');
const dbConnectionUrl = `file:${dbPath}`;
console.log(`Using LibSQL database at: ${dbConnectionUrl}`); // Log the path for debugging

/**
 * メモリを使って ChatAgent インスタンスを作成する
 * メモリが提供されない場合は、ツールのみでエージェントを作成
 */
export function createChatAgent(memory?: Memory): Agent {
  // Explicitly configure Memory to address deprecation warnings
  if (!memory) {
    memory = new Memory({
      // Add explicit vector store configuration
      vector: new LibSQLVector({
        // Use the constructed path
        connectionUrl: dbConnectionUrl 
      }),
      // Set explicit options matching old defaults to maintain behavior
      options: {
        lastMessages: 40,
        semanticRecall: false, // Disable embeddings during tests
        threads: {
          generateTitle: true
        }
      }
    });
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
      
      When you learn something important about the user's preferences, trading style,
      or repeated patterns, use mem0-memorize to save this information.
      
      When a user returns, use mem0-remember to search for relevant context.
      
      Be friendly and helpful.
    `,
    model: openai(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory, 
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
  console.log("Inside createDirectAgent - Checking OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? 'Exists' : 'MISSING'); // Debug log
  // Explicitly configure Memory to address deprecation warnings
  const memory = new Memory({
    // Add explicit vector store configuration
    vector: new LibSQLVector({
      // Use the constructed path
      connectionUrl: dbConnectionUrl 
    }),
    // Set explicit options matching old defaults to maintain behavior
    options: {
      lastMessages: 40,
      semanticRecall: false, // Disable embeddings during tests
      threads: {
        generateTitle: true
      }
    }
  });

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
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
    }
  });
}
