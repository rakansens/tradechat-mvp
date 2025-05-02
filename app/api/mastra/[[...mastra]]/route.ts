// app/api/mastra/[[...mastra]]/route.ts
// Changes: 標準ディレクトリ構造に合わせたインポートに修正
import { Mastra } from "@mastra/core";
// 標準化したパスから直接エージェントをインポート
import { createDirectAgent } from "../../../../src/mastra/agents"; 

// Basic check for API keys - enhance this with proper validation if needed
if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error("ERROR: At least one LLM API key (OPENAI_API_KEY or GOOGLE_API_KEY) must be set.");
  // Consider throwing an error or providing a fallback if essential
}
if (!process.env.MEM0_API_KEY) {
  console.error("ERROR: MEM0_API_KEY is required for Mastra Memory but not set.");
  // Throw error as Memory is crucial here
  throw new Error("MEM0_API_KEY environment variable is not set."); 
}

// LibSQLのバンドリング問題を避けるためMemoryなしで動作
// エージェントファクトリ関数を使用して作成
const agentInstance = createDirectAgent();

// Create Mastra instance (server included)
const mastra = new Mastra({
  agents: {
    chat: agentInstance,
  },
});

// Next.js Route Handlers

// POST /api/mastra/chat (body should include { messages, threadId?, resourceId? })
export async function POST(req: Request) {
  const { messages, threadId, resourceId } = await req.json();

  // Basic validation
  if (!Array.isArray(messages)) {
    return new Response("messages must be an array", { status: 400 });
  }

  const agent = mastra.getAgent("chat");

  // Stream response back to client
  const result = await agent.stream(messages, {
    threadId,
    resourceId,
  });

  return result.toDataStreamResponse();
}

// GET handler (optional health-check)
export function GET() {
  return new Response("Mastra API is up", { status: 200 });
}

// export const runtime = 'edge'; // Uncomment if deploying to Edge Functions
