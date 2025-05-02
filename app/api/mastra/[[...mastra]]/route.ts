// app/api/mastra/[[...mastra]]/route.ts
// Changes: Added detailed logging and checks around agent/Mastra creation and retrieval.
import { Mastra } from "@mastra/core";
import { LibSQLStore } from '@mastra/libsql'; // Import LibSQLStore
import { createDirectAgent } from "../../../../src/mastra/agents"; 
import { Agent } from "@mastra/core/agent"; // Import Agent type for checking
import path from 'path';

console.log("API Route Handler: Starting initialization...");

// Construct database path consistently
const dbPath = path.resolve(process.cwd(), 'memory.db');
const dbConnectionUrl = `file:${dbPath}`;
console.log(`Using database store at: ${dbConnectionUrl}`);

// Basic check for API keys - enhance this with proper validation if needed
if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error("API Route Handler ERROR: At least one LLM API key (OPENAI_API_KEY or GOOGLE_API_KEY) must be set.");
  // Consider throwing an error or providing a fallback if essential
} else {
  console.log("API Route Handler: LLM API key found.");
}
if (!process.env.MEM0_API_KEY) {
  console.error("API Route Handler WARNING: MEM0_API_KEY not found. Memory tools might not function.");
} else {
  console.log("API Route Handler: MEM0_API_KEY found.");
}

let agentInstance: Agent | null = null;
try {
  console.log("API Route Handler: Attempting to create agent instance...");
  agentInstance = createDirectAgent();
  if (agentInstance instanceof Agent) {
    console.log("API Route Handler: Agent instance created successfully.");
  } else {
    console.error("API Route Handler ERROR: createDirectAgent did not return a valid Agent instance.");
    // Decide how to handle this - maybe throw?
    throw new Error("Failed to create agent instance.");
  }
} catch (error) {
  console.error("API Route Handler ERROR: Failed during createDirectAgent execution:", error);
  throw error; // Re-throw to prevent proceeding
}

let mastra: Mastra | null = null;
try {
  console.log("API Route Handler: Attempting to create Mastra instance...");
  mastra = new Mastra({
    agents: {
      chat: agentInstance, // agentInstance is guaranteed to be an Agent here
    },
    storage: new LibSQLStore({
      url: dbConnectionUrl, // Use the same connection URL
    }),
  });
  console.log("API Route Handler: Mastra instance created successfully.");
  // Check if getAgent exists immediately after creation
  if (typeof mastra.getAgent !== 'function') {
    console.error("API Route Handler ERROR: mastra.getAgent is not a function immediately after Mastra creation!");
    throw new Error("Mastra instance seems invalid - getAgent method missing.");
  } else {
    console.log("API Route Handler: mastra.getAgent method confirmed to exist.");
  }
} catch (error) {
  console.error("API Route Handler ERROR: Failed during Mastra instantiation:", error);
  throw error; // Re-throw
}

// Next.js Route Handlers

// POST /api/mastra/chat (body should include { messages, threadId?, resourceId? })
export async function POST(req: Request) {
  console.log("API Route Handler: POST request received.");
  if (!mastra) {
    console.error("API Route Handler POST ERROR: Mastra instance is not available.");
    return new Response("Internal Server Error: Mastra not initialized", { status: 500 });
  }

  const { messages, threadId, resourceId } = await req.json();

  // Basic validation
  if (!Array.isArray(messages)) {
    console.log("API Route Handler POST: Invalid request - messages not an array.");
    return new Response("messages must be an array", { status: 400 });
  }

  let agent;
  try {
    console.log("API Route Handler POST: Attempting to get 'chat' agent...");
    agent = mastra.getAgent("chat");
    if (!agent) {
      console.error("API Route Handler POST ERROR: mastra.getAgent('chat') returned undefined/null.");
      return new Response("Internal Server Error: Agent not found", { status: 500 });
    }
    console.log("API Route Handler POST: 'chat' agent retrieved successfully.");
  } catch (error) {
    console.error("API Route Handler POST ERROR: Error during mastra.getAgent('chat'):", error);
    return new Response("Internal Server Error: Could not retrieve agent", { status: 500 });
  }

  try {
    console.log("API Route Handler POST: Calling agent.stream...");
    const result = await agent.stream(messages, {
      threadId,
      resourceId,
    });
    console.log("API Route Handler POST: agent.stream completed.");
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("API Route Handler POST ERROR: Error during agent.stream or toDataStreamResponse:", error);
    return new Response("Internal Server Error during stream generation", { status: 500 });
  }
}

// GET handler (optional health-check)
export function GET() {
  console.log("API Route Handler: GET request received (health check).");
  return new Response("Mastra API is up", { status: 200 });
}

// export const runtime = 'edge'; // Uncomment if deploying to Edge Functions
