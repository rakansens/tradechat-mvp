// lib/openai/index.ts
// OpenAI APIクライアントユーティリティ
// 作成日: 2025/6/1

import OpenAI from 'openai';

// シングルトンパターンでOpenAIクライアントを提供
let openaiInstance: OpenAI | null = null;

/**
 * OpenAIクライアントインスタンスを取得
 * @returns OpenAIインスタンス
 */
export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません');
    }
    
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  return openaiInstance;
}

/**
 * テキストからembeddingを生成する
 * @param text 入力テキスト
 * @param model 使用するモデル（デフォルト: text-embedding-3-small）
 * @returns 生成されたembedding
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[]> {
  const openai = getOpenAI();
  
  try {
    const response = await openai.embeddings.create({
      input: text,
      model,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding生成エラー:', error);
    throw new Error('テキストからEmbeddingを生成できませんでした');
  }
}

/**
 * ベクトル間のコサイン類似度を計算
 * @param a 1つ目のベクトル
 * @param b 2つ目のベクトル
 * @returns コサイン類似度 (-1 から 1 の範囲)
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('ベクトルの次元数が一致しません');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
} 