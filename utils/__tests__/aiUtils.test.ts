// utils/__tests__/aiUtils.test.ts
// AI画像分析機能のテスト

import { analyzeChartWithAI } from '../aiUtils';
import { OpenAI } from 'openai';

// OpenAIのモック
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn()
          }
        }
      };
    })
  };
});

describe('aiUtils', () => {
  let mockOpenAI: any;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    // モックのセットアップ
    mockCreate = jest.fn();
    mockOpenAI = new OpenAI();
    mockOpenAI.chat.completions.create = mockCreate;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeChartWithAI', () => {
    const mockBase64Image = 'data:image/png;base64,mockImageData';

    it('成功時に分析結果を返す', async () => {
      // セットアップ: OpenAI APIの応答をモック
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: `
                トレンド分析：上昇トレンド
                RSI: 68 (やや過買い)
                MACD: 上向き、シグナルラインを上回る
                サポート: 64200ドル
                レジスタンス: 65800ドル
                パターン: 上昇三角形
                取引推奨: 買いを推奨
                確信度: 85
              `
            }
          }
        ]
      });

      // 実行
      const result = await analyzeChartWithAI(mockBase64Image, 'トレンド');

      // 検証
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: "gpt-4-vision-preview",
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({
                type: "text",
                text: expect.stringContaining('トレーディングチャート画像')
              }),
              expect.objectContaining({
                type: "image_url",
                image_url: expect.objectContaining({
                  url: expect.stringContaining('base64,mockImageData')
                })
              })
            ])
          })
        ])
      }));

      // 分析結果の検証
      expect(result).toEqual({
        analysis: expect.stringContaining('トレンド分析'),
        recommendation: "買いポジションの検討を推奨",
        confidence: 85
      });
    });

    it('売り推奨を正しく解析する', async () => {
      // セットアップ: 売り推奨のAPIレスポンス
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: `
                トレンド分析：下降トレンド
                RSI: 30 (過売り)
                MACD: 下向き
                分析：市場は下降トレンドにあります。
                売り推奨します。
                確信度: 70
              `
            }
          }
        ]
      });

      // 実行
      const result = await analyzeChartWithAI(mockBase64Image);

      // 検証
      expect(result.recommendation).toBe("売りポジションの検討を推奨");
      expect(result.confidence).toBe(70);
    });

    it('様子見推奨を正しく解析する', async () => {
      // セットアップ: 様子見推奨のAPIレスポンス
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: `
                トレンド分析：横ばい
                RSI: 50 (中立)
                MACD: フラット
                分析：明確な方向性が見られません。
                様子見を推奨します。
                確信度: 60
              `
            }
          }
        ]
      });

      // 実行
      const result = await analyzeChartWithAI(mockBase64Image);

      // 検証
      expect(result.recommendation).toBe("様子見を推奨");
      expect(result.confidence).toBe(60);
    });

    it('確信度の抽出に失敗した場合はデフォルト値を使用', async () => {
      // セットアップ: 確信度なしのAPIレスポンス
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '分析結果テキスト（確信度の記載なし）'
            }
          }
        ]
      });

      // 実行
      const result = await analyzeChartWithAI(mockBase64Image);

      // 検証
      expect(result.confidence).toBe(50); // デフォルト値
    });

    it('APIエラー発生時にエラーメッセージを返す', async () => {
      // セットアップ: APIエラー
      mockCreate.mockRejectedValueOnce(new Error('API error'));

      // 実行
      const result = await analyzeChartWithAI(mockBase64Image);

      // 検証
      expect(result).toEqual({
        analysis: expect.stringContaining('エラーが発生しました'),
        recommendation: "エラーのため判断保留",
        confidence: 0
      });
    });
  });
}); 