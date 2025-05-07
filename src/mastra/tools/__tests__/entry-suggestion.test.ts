// src/mastra/tools/__tests__/entry-suggestion.test.ts
// 作成: エントリー提案ツールのテスト

import { entrySuggestionTool } from "../entry-suggestion";
import { multiTimeframeAnalysisTool } from "../multi-timeframe-tools";

// multiTimeframeAnalysisToolのモック
jest.mock("../multi-timeframe-tools", () => ({
  multiTimeframeAnalysisTool: {
    execute: jest.fn().mockResolvedValue({
      analyses: [
        {
          timeframe: "15m",
          analysis: "15分足では下降トレンドが続いています。RSIは30を下回り、売られすぎの状態です。",
          recommendation: "短期的な反発を狙った買いを検討",
          confidence: 60,
          imageId: "chart-15m-123456",
        },
        {
          timeframe: "1h",
          analysis: "1時間足では下降トレンドが続いていますが、サポートラインに近づいています。",
          recommendation: "様子見",
          confidence: 50,
          imageId: "chart-1h-123456",
        },
        {
          timeframe: "4h",
          analysis: "4時間足では下降トレンドが続いていますが、ダイバージェンスが見られます。",
          recommendation: "様子見",
          confidence: 40,
          imageId: "chart-4h-123456",
        },
        {
          timeframe: "1d",
          analysis: "日足では長期的な下降トレンドが続いています。重要なサポートラインが49000付近にあります。",
          recommendation: "売り",
          confidence: 70,
          imageId: "chart-1d-123456",
        },
      ],
      summary: "複数時間足の分析結果から、短期的には反発の可能性がありますが、中長期的には下降トレンドが続いています。現在価格は50000付近で取引されており、重要なサポートラインは49000付近にあります。",
      overallRecommendation: "短期トレーダーは反発を狙った買いを検討、中長期トレーダーは売りを検討",
      overallConfidence: 65,
    }),
  },
}));

// OpenAIのモック
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      side: "buy",
                      price: 50000,
                      stopLoss: 49000,
                      takeProfit: 52000,
                      riskRewardRatio: 2.0,
                      rationale: "短期的な反発を狙った買いエントリー。RSIが売られすぎの状態で、重要なサポートラインに近づいています。",
                      confidence: 65,
                    }),
                  },
                },
              ],
            }),
          },
        },
      };
    }),
  };
});

// uuidのモック
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-entry-id-123456"),
}));

describe("entrySuggestionTool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(entrySuggestionTool).toBeDefined();
  });

  it("should have correct id and description", () => {
    expect(entrySuggestionTool.id).toBe("entry-suggestion");
    expect(entrySuggestionTool.description).toContain("チャート分析結果に基づいてエントリー提案を生成します");
  });

  it("should have correct input and output schemas", () => {
    expect(entrySuggestionTool.inputSchema).toBeDefined();
    expect(entrySuggestionTool.outputSchema).toBeDefined();
  });

  it("should generate entry suggestion from analysis result", async () => {
    // 分析結果を直接提供するケース
    const mockAnalysisResult = {
      analyses: [
        {
          timeframe: "15m",
          analysis: "15分足では下降トレンドが続いています。RSIは30を下回り、売られすぎの状態です。",
          recommendation: "短期的な反発を狙った買いを検討",
          confidence: 60,
          imageId: "chart-15m-123456",
        },
        {
          timeframe: "1h",
          analysis: "1時間足では下降トレンドが続いていますが、サポートラインに近づいています。",
          recommendation: "様子見",
          confidence: 50,
          imageId: "chart-1h-123456",
        },
      ],
      summary: "複数時間足の分析結果から、短期的には反発の可能性があります。",
      overallRecommendation: "短期トレーダーは反発を狙った買いを検討",
      overallConfidence: 60,
    };

    const result = await entrySuggestionTool.execute({
      context: {
        analysisResult: mockAnalysisResult,
        currentPrice: 50000,
      },
    } as any);

    expect(result).toEqual({
      side: "buy",
      price: 50000,
      stopLoss: 49000,
      takeProfit: 52000,
      riskRewardRatio: 2.0,
      rationale: "短期的な反発を狙った買いエントリー。RSIが売られすぎの状態で、重要なサポートラインに近づいています。",
      confidence: 65,
      imageId: "chart-15m-123456",
      entryId: "test-entry-id-123456",
    });
  });

  it("should run multiTimeframeAnalysis if no analysis result is provided", async () => {
    const result = await entrySuggestionTool.execute({
      context: {
        timeframes: ["15m", "1h", "4h", "1d"],
        symbol: "BTCUSDT",
      },
    } as any);

    expect(multiTimeframeAnalysisTool.execute).toHaveBeenCalledWith({
      context: {
        timeframes: ["15m", "1h", "4h", "1d"],
        symbol: "BTCUSDT",
      },
    });

    expect(result).toEqual({
      side: "buy",
      price: 50000,
      stopLoss: 49000,
      takeProfit: 52000,
      riskRewardRatio: 2.0,
      rationale: "短期的な反発を狙った買いエントリー。RSIが売られすぎの状態で、重要なサポートラインに近づいています。",
      confidence: 65,
      imageId: "chart-15m-123456",
      entryId: "test-entry-id-123456",
    });
  });

  it("should handle errors gracefully", async () => {
    // multiTimeframeAnalysisToolがエラーを投げるようにモック
    (multiTimeframeAnalysisTool.execute as jest.Mock).mockRejectedValueOnce(new Error("分析エラー"));

    const result = await entrySuggestionTool.execute({
      context: {
        timeframes: ["15m", "1h", "4h", "1d"],
        symbol: "BTCUSDT",
      },
    } as any);

    expect(result).toEqual({
      side: "buy",
      price: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskRewardRatio: 0,
      rationale: "エントリー提案の生成中にエラーが発生しました。",
      confidence: 0,
      entryId: "test-entry-id-123456",
    });
  });
});
