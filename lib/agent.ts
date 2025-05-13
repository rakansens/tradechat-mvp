// lib/agent.ts
// Mastraエージェントとの対話ヘルパー関数
// 作成日: 2025/5/20

// /api/mastra/chat エンドポイントを使ってAIエージェントからの応答を取得する

import type { Message } from 'ai';

interface AskOptions {
  threadId?: string;      // 会話ID（スレッドごとのコンテキスト用）
  instructions?: string;  // システムプロンプト
  resourceId?: string;    // リソースID
}

interface AgentResponse {
  content: string;
  role: 'assistant';
  imageData?: string;
  imageCaption?: string;
}

/**
 * Mastraエージェントに問い合わせるヘルパー関数
 * @param messages メッセージ履歴
 * @param options オプション（threadId, instructions, resourceId）
 * @returns AIからの応答
 */
export async function askAgent(
  messages: Pick<Message, 'role' | 'content'>[],
  options: AskOptions = {}
): Promise<AgentResponse> {
  try {
    // メッセージのバリデーション
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    // オプションの展開
    const { threadId, instructions, resourceId } = options;

    // /api/mastra/chat エンドポイントにリクエスト
    const response = await fetch('/api/mastra/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        threadId,
        resourceId,
        instructions, // システムプロンプトを渡す
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    // 応答データの処理
    let content = '';
    let imageData: string | undefined;
    let imageCaption: string | undefined;

    // 応答テキストを取得
    if (typeof data.content === 'string') {
      content = data.content;
    } else if (data.choices && data.choices[0]?.message) {
      content = data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format');
    }

    // 画像データの抽出（存在する場合）
    const imageMatch = content.match(/!\[.*?\]\(data:image\/[^;]+;base64,([^)]+)\)/);
    if (imageMatch && imageMatch[1]) {
      imageData = imageMatch[1];
      content = content.replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/, '');
      imageCaption = 'Chart analysis';
    }

    return {
      content,
      role: 'assistant',
      ...(imageData && { imageData, imageCaption }),
    };
  } catch (error) {
    console.error('Error in askAgent:', error);
    return {
      content: 'エラーが発生しました。もう一度お試しください。',
      role: 'assistant',
    };
  }
}