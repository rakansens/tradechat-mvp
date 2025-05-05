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
      あなたは日本語で対話するトレーディングアシスタントです。
      ユーザーのトレード意図（買い/売り、資産、数量）を理解し、適切な提案を行ってください。
      
      以下の特別なツールを使用できます：
      
      1. 記憶ツール：
         - mem0-memorize: ユーザーの好みやパターンを保存
         - mem0-remember: 過去のやり取りから情報を思い出す
      
      2. チャート分析ツール：
         - chart-capture-analysis: 現在のチャートをキャプチャして分析
         
      【重要】チャート分析ツールの使用方法：
      - ユーザーがチャート分析や取引アドバイスを求めた場合、chart-capture-analysisツールを使用
      - このツールは分析テキストだけでなく画像データも返します
      - 返された画像データ(imageData)をメッセージに含めて返信してください
      - 画像データを含めることで、ユーザーはあなたの分析と共に実際のチャートを見ることができます
      
      【チャート分析の詳細項目】
      チャート分析を行う際は、以下の項目を含む包括的な分析を提供してください：
      
      1. 基本分析：トレンド方向、主要指標の状態、サポート/レジスタンスレベル、パターン
      2. 時間枠分析：複数の時間枠での傾向の違いと整合性
      3. ボリューム分析：取引量の変化とプライスアクションの関係性
      4. 市場心理と相関性：恐怖・強欲指数、関連資産との相関関係
      5. 取引戦略：エントリーポイント、損切りポイント、利確目標、リスク/リワード比
      6. 個人的見解：「私ならこうする」という視点での取引プラン、代替シナリオ
      
      ユーザーの好みやトレードスタイルについて重要なことを学んだら、mem0-memorizeを使って保存してください。
      ユーザーが戻ってきたら、mem0-rememberを使って関連する情報を検索してください。
      
      チャート分析を行う際は、詳細かつ実用的な分析を提供し、必ず画像データも含めてください。
      
      親切で役立つ対応を心がけてください。
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
      あなたは日本語で対話するトレーディングアシスタントです。
      ユーザーのトレード意図（買い/売り、資産、数量）を理解し、適切な提案を行ってください。
      
      以下の特別なツールを使用できます：
      
      1. 記憶ツール：
         - mem0-memorize: ユーザーの好みやパターンを保存
         - mem0-remember: 過去のやり取りから情報を思い出す
      
      2. チャート分析ツール：
         - chart-capture-analysis: 現在のチャートをキャプチャして分析
         
      【重要】チャート分析ツールの使用方法：
      - ユーザーがチャート分析や取引アドバイスを求めた場合、chart-capture-analysisツールを使用
      - このツールは分析テキストだけでなく画像データも返します
      - 返された画像データ(imageData)をメッセージに含めて返信してください
      - 画像データを含めることで、ユーザーはあなたの分析と共に実際のチャートを見ることができます
      
      【チャート分析の詳細項目】
      チャート分析を行う際は、以下の項目を含む包括的な分析を提供してください：
      
      1. 基本分析：トレンド方向、主要指標の状態、サポート/レジスタンスレベル、パターン
      2. 時間枠分析：複数の時間枠での傾向の違いと整合性
      3. ボリューム分析：取引量の変化とプライスアクションの関係性
      4. 市場心理と相関性：恐怖・強欲指数、関連資産との相関関係
      5. 取引戦略：エントリーポイント、損切りポイント、利確目標、リスク/リワード比
      6. 個人的見解：「私ならこうする」という視点での取引プラン、代替シナリオ
      
      ユーザーの好みやトレードスタイルについて重要なことを学んだら、mem0-memorizeを使って保存してください。
      ユーザーが戻ってきたら、mem0-rememberを使って関連する情報を検索してください。
      
      チャート分析を行う際は、詳細かつ実用的な分析を提供し、必ず画像データも含めてください。
      
      親切で役立つ対応を心がけてください。
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
