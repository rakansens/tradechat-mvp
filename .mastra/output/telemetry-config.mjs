import { Agent } from '@mastra/core/agent';
import { openai as openai$1 } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Mem0Integration } from '@mastra/mem0';
import { OpenAI } from 'openai';

const mem0 = new Mem0Integration({
  config: {
    apiKey: process.env.MEM0_API_KEY,
    // TODO: 実運用ではログインユーザ ID などを渡す
    userId: "anon"
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
  // クライアントサイドでの使用を許可
});
const analyzeChartWithAI = async (imageBase64, focusOn) => {
  try {
    const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `
      \u4EE5\u4E0B\u306E\u30C8\u30EC\u30FC\u30C7\u30A3\u30F3\u30B0\u30C1\u30E3\u30FC\u30C8\u753B\u50CF\u3092\u8A73\u7D30\u306B\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\u3002
      ${focusOn ? `\u7279\u306B${focusOn}\u306B\u6CE8\u76EE\u3057\u3066\u304F\u3060\u3055\u3044\u3002` : ""}
      
      \u4EE5\u4E0B\u3092\u542B\u3080\u5206\u6790\u7D50\u679C\u3092\u63D0\u4F9B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
      1. \u73FE\u5728\u306E\u30C8\u30EC\u30F3\u30C9\u65B9\u5411\uFF08\u4E0A\u6607/\u4E0B\u964D/\u6A2A\u3070\u3044\uFF09
      2. \u4E3B\u8981\u306A\u6307\u6A19\u306E\u72B6\u614B\uFF08RSI\u3001MACD\u3001\u79FB\u52D5\u5E73\u5747\u7DDA\u306A\u3069\u898B\u3048\u308B\u6307\u6A19\uFF09
      3. \u91CD\u8981\u306A\u30B5\u30DD\u30FC\u30C8/\u30EC\u30B8\u30B9\u30BF\u30F3\u30B9\u30EC\u30D9\u30EB
      4. \u660E\u78BA\u306A\u30D1\u30BF\u30FC\u30F3\u3084\u5F62\u6210\uFF08\u30D8\u30C3\u30C9\u30A2\u30F3\u30C9\u30B7\u30E7\u30EB\u30C0\u30FC\u3001\u4E09\u89D2\u5F62\u306A\u3069\uFF09
      5. \u53D6\u5F15\u63A8\u5968\uFF08\u8CB7\u3044/\u58F2\u308A/\u69D8\u5B50\u898B\uFF09
      6. \u63A8\u5968\u306E\u78BA\u4FE1\u5EA6\uFF080-100\u306E\u6570\u5024\uFF09
      
      \u5206\u6790\u306F\u65E5\u672C\u8A9E\u3067\u3001\u30C8\u30EC\u30FC\u30C0\u30FC\u304C\u7406\u89E3\u3057\u3084\u3059\u3044\u5C02\u9580\u7528\u8A9E\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1e3
    });
    const analysisText = response.choices[0]?.message.content || "";
    const confidenceMatch = analysisText.match(/確信度[:：]\s*(\d+)/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
    let recommendation = "\u5224\u65AD\u4FDD\u7559";
    if (analysisText.includes("\u8CB7\u3044\u63A8\u5968") || analysisText.includes("\u8CB7\u3044\u3092\u63A8\u5968") || analysisText.includes("\u8CB7\u3044\u6CE8\u6587")) {
      recommendation = "\u8CB7\u3044\u30DD\u30B8\u30B7\u30E7\u30F3\u306E\u691C\u8A0E\u3092\u63A8\u5968";
    } else if (analysisText.includes("\u58F2\u308A\u63A8\u5968") || analysisText.includes("\u58F2\u308A\u3092\u63A8\u5968") || analysisText.includes("\u58F2\u308A\u6CE8\u6587")) {
      recommendation = "\u58F2\u308A\u30DD\u30B8\u30B7\u30E7\u30F3\u306E\u691C\u8A0E\u3092\u63A8\u5968";
    } else if (analysisText.includes("\u69D8\u5B50\u898B") || analysisText.includes("\u5F85\u6A5F")) {
      recommendation = "\u69D8\u5B50\u898B\u3092\u63A8\u5968";
    }
    return {
      analysis: analysisText,
      recommendation,
      confidence: Math.min(100, Math.max(0, confidence))
      // 0-100の範囲に収める
    };
  } catch (error) {
    console.error("AI\u5206\u6790\u30A8\u30E9\u30FC:", error);
    return {
      analysis: "\u5206\u6790\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002OpenAI API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u308B\u304B\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      recommendation: "\u30A8\u30E9\u30FC\u306E\u305F\u3081\u5224\u65AD\u4FDD\u7559",
      confidence: 0
    };
  }
};

const chartCaptureAnalysisTool = createTool({
  id: "chart-capture-analysis",
  description: "\u73FE\u5728\u8868\u793A\u3055\u308C\u3066\u3044\u308B\u30C1\u30E3\u30FC\u30C8\u3092\u30AD\u30E3\u30D7\u30C1\u30E3\u3057\u3066\u5206\u6790\u3057\u307E\u3059\u3002\u30C8\u30EC\u30F3\u30C9\u3084\u30D1\u30BF\u30FC\u30F3\u3001\u6307\u6A19\u306E\u72B6\u614B\u306A\u3069\u3092\u8AAD\u307F\u53D6\u308A\u3001\u53D6\u5F15\u5224\u65AD\u306E\u6750\u6599\u3068\u3057\u3066\u4F7F\u7528\u3057\u307E\u3059\u3002",
  inputSchema: z.object({
    // 追加のパラメータを設定可能（例：分析の焦点）
    focusOn: z.string().optional().describe("\u5206\u6790\u306E\u7126\u70B9\uFF08\u4F8B: '\u30C8\u30EC\u30F3\u30C9', '\u30D1\u30BF\u30FC\u30F3', '\u30B5\u30DD\u30FC\u30C8\u30E9\u30A4\u30F3', '\u30EC\u30B8\u30B9\u30BF\u30F3\u30B9\u30E9\u30A4\u30F3'\uFF09")
  }),
  outputSchema: z.object({
    analysis: z.string().describe("\u30C1\u30E3\u30FC\u30C8\u306E\u5206\u6790\u7D50\u679C"),
    recommendation: z.string().describe("\u5206\u6790\u306B\u57FA\u3065\u304F\u53D6\u5F15\u63A8\u5968"),
    confidence: z.number().describe("\u63A8\u5968\u306E\u78BA\u4FE1\u5EA6\uFF080-100\uFF09")
  }),
  execute: async ({ context }) => {
    try {
      console.log("\u30C1\u30E3\u30FC\u30C8\u30AD\u30E3\u30D7\u30C1\u30E3\u30C4\u30FC\u30EB\u5B9F\u884C\u958B\u59CB", context);
      let imageData = null;
      const fallbackAnalysis = {
        analysis: "\u30C1\u30E3\u30FC\u30C8\u306E\u30AD\u30E3\u30D7\u30C1\u30E3\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30EA\u30ED\u30FC\u30C9\u3059\u308B\u304B\u3001\u5225\u306E\u30D6\u30E9\u30A6\u30B6\u3067\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        recommendation: "\u6280\u8853\u7684\u306A\u554F\u984C\u306E\u305F\u3081\u5206\u6790\u3067\u304D\u307E\u305B\u3093\u3002\u30C8\u30EC\u30FC\u30C9\u306E\u5224\u65AD\u306F\u63A7\u3048\u3066\u304F\u3060\u3055\u3044\u3002",
        confidence: 0
      };
      if (typeof global.requestCapture === "function") {
        console.log("Socket.io\u3067\u30AD\u30E3\u30D7\u30C1\u30E3\u3092\u30EA\u30AF\u30A8\u30B9\u30C8\u958B\u59CB");
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            console.log(`\u30AD\u30E3\u30D7\u30C1\u30E3\u8A66\u884C ${attempt}/5`);
            imageData = await global.requestCapture(3e4);
            if (imageData) {
              console.log("\u30AD\u30E3\u30D7\u30C1\u30E3\u6210\u529F\u3001\u30EA\u30C8\u30E9\u30A4\u7D42\u4E86");
              break;
            }
          } catch (captureError) {
            console.error(`\u30AD\u30E3\u30D7\u30C1\u30E3\u8A66\u884C ${attempt} \u5931\u6557:`, captureError);
            if (attempt < 5) {
              const waitTime = Math.min(2e3 * Math.pow(2, attempt - 1), 1e4);
              console.log(`${waitTime}ms\u5F85\u6A5F\u3057\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u307E\u3059`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }
        }
        if (!imageData) {
          console.error("\u30EA\u30C8\u30E9\u30A4\u5F8C\u3082\u30AD\u30E3\u30D7\u30C1\u30E3\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
          return fallbackAnalysis;
        }
        console.log("\u30AD\u30E3\u30D7\u30C1\u30E3\u6210\u529F\u3001AI\u3067\u306E\u5206\u6790\u3092\u958B\u59CB");
        const aiAnalysis = await analyzeChartWithAI(imageData, context.focusOn);
        return {
          analysis: aiAnalysis.analysis,
          recommendation: aiAnalysis.recommendation,
          confidence: aiAnalysis.confidence
        };
      } else {
        console.error("Socket.io\u30AD\u30E3\u30D7\u30C1\u30E3\u6A5F\u80FD\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093");
        return {
          ...fallbackAnalysis,
          analysis: "Socket.io\u30AD\u30E3\u30D7\u30C1\u30E3\u6A5F\u80FD\u304C\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u30B5\u30FC\u30D0\u30FC\u5074\u306E\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
        };
      }
    } catch (error) {
      console.error("\u30C1\u30E3\u30FC\u30C8\u30AD\u30E3\u30D7\u30C1\u30E3\u5206\u6790\u30A8\u30E9\u30FC:", error);
      return {
        analysis: `\u30C1\u30E3\u30FC\u30C8\u5206\u6790\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ${error}`,
        recommendation: "\u73FE\u5728\u30C7\u30FC\u30BF\u304C\u53D6\u5F97\u3067\u304D\u306A\u3044\u305F\u3081\u3001\u53D6\u5F15\u5224\u65AD\u306F\u4FDD\u7559\u3059\u308B\u3053\u3068\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002",
        confidence: 0
      };
    }
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

const memoryOptions = {
  // Set explicit options matching old defaults to maintain behavior
  options: {
    lastMessages: 40,
    semanticRecall: false,
    // Disable embeddings during tests
    threads: {
      generateTitle: true
    }
  }
};
function createChatAgent(memory) {
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
    model: openai$1(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory,
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
      "chart-capture-analysis": chartCaptureAnalysisTool
    }
  });
}
function createDirectAgent() {
  console.log("Inside createDirectAgent - Checking OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Exists" : "MISSING");
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
    model: openai$1(process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-3.5-turbo"),
    memory,
    tools: {
      "mem0-remember": mem0RememberTool,
      "mem0-memorize": mem0MemorizeTool,
      "chart-capture-analysis": chartCaptureAnalysisTool
    }
  });
}

const telemetry = {};

export { chartCaptureAnalysisTool, createChatAgent, createDirectAgent, mem0MemorizeTool, mem0RememberTool, telemetry };
