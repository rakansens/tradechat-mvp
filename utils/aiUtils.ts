// utils/aiUtils.ts
// AI画像分析機能の実装

import { OpenAI } from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // クライアントサイドでの使用を許可
});

/**
 * OpenAI Vision APIを使用してチャート画像を分析する
 * @param imageBase64 Base64エンコードされた画像データ
 * @param focusOn 分析の焦点
 * @returns 分析結果
 */
export const analyzeChartWithAI = async (
  imageBase64: string, 
  focusOn?: string
): Promise<{
  analysis: string;
  recommendation: string;
  confidence: number;
}> => {
  try {
    // Base64文字列からURLプレフィックスを削除
    const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // OpenAI Vision APIの呼び出し
    const prompt = `
      以下のトレーディングチャート画像を詳細に分析してください。
      ${focusOn ? `特に${focusOn}に注目してください。` : ''}
      
      以下を含む分析結果を提供してください：
      1. 現在のトレンド方向（上昇/下降/横ばい）
      2. 主要な指標の状態（RSI、MACD、移動平均線など見える指標）
      3. 重要なサポート/レジスタンスレベル
      4. 明確なパターンや形成（ヘッドアンドショルダー、三角形など）
      5. 取引推奨（買い/売り/様子見）
      6. 推奨の確信度（0-100の数値）
      
      分析は日本語で、トレーダーが理解しやすい専門用語を使用してください。
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
          ],
        },
      ],
      max_tokens: 1000,
    });

    // レスポンスからテキストを抽出
    const analysisText = response.choices[0]?.message.content || "";
    
    // テキストから情報を抽出
    const confidenceMatch = analysisText.match(/確信度[:：]\s*(\d+)/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
    
    // 推奨抽出ロジック
    let recommendation = "判断保留";
    if (analysisText.includes("買い推奨") || analysisText.includes("買いを推奨") || analysisText.includes("買い注文")) {
      recommendation = "買いポジションの検討を推奨";
    } else if (analysisText.includes("売り推奨") || analysisText.includes("売りを推奨") || analysisText.includes("売り注文")) {
      recommendation = "売りポジションの検討を推奨";
    } else if (analysisText.includes("様子見") || analysisText.includes("待機")) {
      recommendation = "様子見を推奨";
    }

    return {
      analysis: analysisText,
      recommendation,
      confidence: Math.min(100, Math.max(0, confidence)), // 0-100の範囲に収める
    };
  } catch (error) {
    console.error("AI分析エラー:", error);
    return {
      analysis: "分析中にエラーが発生しました。OpenAI APIキーが設定されているか確認してください。",
      recommendation: "エラーのため判断保留",
      confidence: 0,
    };
  }
}; 