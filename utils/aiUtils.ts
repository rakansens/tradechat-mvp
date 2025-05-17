// utils/aiUtils.ts
// AI画像分析機能の実装

import { OpenAI } from 'openai';
import { createHash } from 'crypto';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // クライアントサイドでの使用を許可
});

// -------------------------
// 簡易キャッシュ実装
// -------------------------

/** 分析結果の型 */
export interface AnalysisResult {
  analysis: string;
  recommendation: string;
  confidence: number;
  imageData?: string;
  imageCaption?: string;
}

const CACHE_TTL = 10 * 60 * 1000; // 10分
const analysisCache = new Map<string, { result: AnalysisResult; timestamp: number }>();

// 定期的に期限切れエントリを削除
const PRUNE_INTERVAL = 5 * 60 * 1000; // 5分
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
}, PRUNE_INTERVAL);

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
  imageData?: string;
  imageCaption?: string;
}> => {
  try {
    // ハッシュを計算してキャッシュを確認
    const hash = createHash('sha256').update(imageBase64).digest('hex');
    const cached = analysisCache.get(hash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    // Base64文字列からURLプレフィックスを削除
    const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // OpenAI Vision APIの呼び出し - 具体的な数値を含むように改善
    const prompt = `
      以下のトレーディングチャート画像を詳細に分析してください。
      ${focusOn ? `特に${focusOn}に注目してください。` : ''}
      
      重要: 必ず具体的な数値を含めてください。価格レベル、パーセンテージ、指標値など、可能な限り正確な数値を含めて分析してください。
      
      以下を含む包括的な分析結果を提供してください：

      【基本分析】
      1. 現在のトレンド方向（上昇/下降/横ばい）: 直近の価格変動率や期間を含めて具体的に記述
      2. 主要な指標の状態: 具体的な数値を含めて記述（例: RSI=70.5、MACD=0.0023など）
      3. 重要なサポート/レジスタンスレベル: 正確な価格レベルを記述
      4. 明確なパターンや形成: パターンの完成度や信頼度をパーセンテージで記述

      【時間枚分析】
      5. 複数の時間枚での傾向: 各時間枚（例: 1時間足、日足、週足）の具体的なトレンドと変動率を記述
      6. 重要なレベル: 各時間枚のキーとなる価格レベルを正確な数値で記述

      【ボリューム分析】
      7. 取引量の変化: 平均取引量と比較したパーセンテージ変化を記述
      8. ボリュームと価格の関係: 具体的な事例と数値を含めて記述

      【市場心理と相関性】
      9. 市場心理指標: 恐怖・強欲指数の具体的な数値（例: 恐怖・強欲指数=65/100）とその意味
      10. 相関関係: 主要資産間の相関係数（例: BTC/ETHの相関係数=0.85）とその影響

      【取引戦略】
      11. エントリーポイント: 正確な価格レベル（例: 買いエントリー=$45,200）と具体的な条件
      12. ストップロス: 正確な価格レベルとリスクパーセンテージ（例: $44,100、リスク=2.4%）
      13. 利確目標: 複数の正確な価格レベルと利益率（例: TP1=$47,500/+5.1%、TP2=$49,800/+10.2%）
      14. リスク/リワード比: 正確な数値で計算（例: R/R比=1:3.5）
      15. ポジションサイズ: 具体的なパーセンテージや金額（例: 資産の2%、または$1,000）

      【個人的見解】
      16. 取引プラン: 正確な価格レベルと時間軸を含む具体的なプラン
      17. 代替シナリオ: 具体的な価格レベルと確率を含む代替シナリオ（例: 30%の確率で$Xまで下落）
      18. 取引推奨: 明確なポジション推奨と具体的な根拠
      19. 確信度: 0-100の数値と具体的な根拠（例: 確信度=75/100）

      分析は日本語で、トレーダーが理解しやすい専門用語を使用してください。
      具体的な数値と明確な根拠を示し、実際に行動できる情報を提供してください。
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
      max_tokens: 4000, // トークン数を増やして詳細な分析を可能に
    });

    // レスポンスからテキストを抽出
    const analysisText = response.choices[0]?.message.content || "";
    
    // テキストから情報を抽出
    const confidenceMatch = analysisText.match(/確信度[:：]\s*(\d+)/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 50;
    
    // サーバーログに分析結果を出力
    console.log('\n======== AIチャート分析結果 ========');
    
    // 分析テキストをセクションごとに分割して出力
    const sections = [
      { title: '基本分析', pattern: /【基本分析】[\s\S]*?(?=【|分析結果|結論|$)/ },
      { title: '時間枚分析', pattern: /【時間枚分析】[\s\S]*?(?=【|分析結果|結論|$)/ },
      { title: 'ボリューム分析', pattern: /【ボリューム分析】[\s\S]*?(?=【|分析結果|結論|$)/ },
      { title: '市場心理と相関性', pattern: /【市場心理と相関性】[\s\S]*?(?=【|分析結果|結論|$)/ },
      { title: '取引戦略', pattern: /【取引戦略】[\s\S]*?(?=【|分析結果|結論|$)/ },
      { title: '個人的見解', pattern: /【個人的見解】[\s\S]*?(?=【|分析結果|結論|$)/ },
    ];
    
    // 各セクションを出力
    for (const section of sections) {
      const match = analysisText.match(section.pattern);
      if (match) {
        console.log(`\n----- ${section.title} -----`);
        console.log(match[0].replace(/\u3010.*?\u3011\s*/, '').trim());
      }
    }
    
    // 推奨抽出ロジック
    let recommendation = "判断保留";
    if (analysisText.includes("買い推奨") || analysisText.includes("買いを推奨") || analysisText.includes("買い注文")) {
      recommendation = "買いポジションの検討を推奨";
    } else if (analysisText.includes("売り推奨") || analysisText.includes("売りを推奨") || analysisText.includes("売り注文")) {
      recommendation = "売りポジションの検討を推奨";
    } else if (analysisText.includes("様子見") || analysisText.includes("待機")) {
      recommendation = "様子見を推奨";
    }
    
    // サマリーを出力
    console.log('\n----- 分析サマリー -----');
    console.log(`推奨: ${recommendation}`);
    console.log(`確信度: ${confidence}%`);
    console.log('======== 分析終了 ========\n');
    
    // 分析結果がチャットに表示されるように、フルテキストを返す
    // サマリーを分析結果の最後に追加
    const fullAnalysisText = `${analysisText}\n\n----- 分析サマリー -----\n推奨: ${recommendation}\n確信度: ${confidence}%\n`;
    
    // ログに分析結果を記録
    console.log('\nチャットに表示される分析結果:');
    console.log(fullAnalysisText);

    const result: AnalysisResult = {
      analysis: fullAnalysisText, // 完全な分析結果を返す
      recommendation,
      confidence: Math.min(100, Math.max(0, confidence)), // 0-100の範囲に収める
      imageData: imageBase64, // 画像データを返す
      imageCaption: "チャート分析", // キャプション
    };

    analysisCache.set(hash, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("AI分析エラー:", error);
    return {
      analysis: "分析中にエラーが発生しました。OpenAI APIキーが設定されているか確認してください。",
      recommendation: "エラーのため判断保留",
      confidence: 0,
    };
  }
};
