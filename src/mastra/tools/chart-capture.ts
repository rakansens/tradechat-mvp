// src/mastra/tools/chart-capture.ts
// チャートキャプチャツールの実装 - Socket.ioを使用 - 画像表示対応版

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { analyzeChartWithAI } from "@/utils/aiUtils";

// グローバル関数の型定義
declare global {
  var requestCapture: (timeoutMs?: number) => Promise<string | null>;
  var storeChartImage: (imageData: string) => string; // 画像を保存して画像IDを返す関数
  var chartImages: Map<string, string>; // 画像データを一時的に保存するマップ
}

// NodeJSの型定義を拡張
declare namespace NodeJS {
  interface Global {
    chartImages: Map<string, string>;
    requestCapture: (timeoutMs?: number) => Promise<string | null>;
    storeChartImage: (imageData: string) => string;
  }
}

/**
 * 現在表示中のチャートをキャプチャし、AIに分析させるツール
 */
export const chartCaptureAnalysisTool = createTool({
  id: "chart-capture-analysis",
  description: `現在表示されているチャートをキャプチャして分析します。トレンドやパターン、指標の状態などを読み取り、取引判断の材料として使用します。
  
  分析には以下の項目が含まれます：
  【基本分析】トレンド方向、主要指標の状態、サポート/レジスタンスレベル、パターン
  【時間枠分析】複数の時間枠での傾向の違いと整合性
  【ボリューム分析】取引量の変化とプライスアクションの関係性
  【市場心理と相関性】恐怖・強欲指数、関連資産との相関関係
  【取引戦略】エントリーポイント、損切りポイント、利確目標、リスク/リワード比
  【個人的見解】「私ならこうする」という視点での取引プラン、代替シナリオ
  
  分析結果と共に画像も表示されます。`,
  inputSchema: z.object({
    // 追加のパラメータを設定可能（例：分析の焦点）
    focusOn: z
      .string()
      .optional()
      .describe("分析の焦点（例: 'トレンド', 'パターン', 'サポートライン', 'レジスタンスライン'）"),
  }),
  outputSchema: z.object({
    analysis: z.string().describe("チャートの分析結果"),
    recommendation: z.string().describe("分析に基づく取引推奨"),
    confidence: z.number().describe("推奨の確信度（0-100）"),
    imageId: z.string().describe("チャート画像のID"),
    imageCaption: z.string().describe("画像の説明"),
  }),

  execute: async ({ context }) => {
    try {
      console.log("チャートキャプチャツール実行開始", context);
      
      // Socket.ioを使ってクライアントにキャプチャをリクエスト
      let imageData: string | null = null;
      
      // キャプチャ失敗時のフォールバック
      const fallbackAnalysis = {
        analysis: "チャートのキャプチャに失敗しました。リロードするか、別のブラウザで試してください。",
        recommendation: "技術的な問題のため分析できません。トレードの判断は控えてください。",
        confidence: 0,
        imageId: "",
        imageCaption: "画像なし"
      };
      
      if (typeof global.requestCapture === 'function') {
        console.log("Socket.ioでキャプチャをリクエスト開始");
        
        // 最大5回リトライ（より多くのリトライ）
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            console.log(`キャプチャ試行 ${attempt}/5`);
            // タイムアウトを長めに設定（30秒）
            imageData = await global.requestCapture(30000);
            
            if (imageData) {
              console.log("キャプチャ成功、リトライ終了");
              break;
            }
          } catch (captureError) {
            console.error(`キャプチャ試行 ${attempt} 失敗:`, captureError);
            
            if (attempt < 5) {
              // 待機時間を徐々に増やす（指数バックオフ）
              const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
              console.log(`${waitTime}ms待機してから再試行します`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // キャプチャに失敗した場合
        if (!imageData) {
          console.error("リトライ後もキャプチャに失敗しました");
          return fallbackAnalysis;
        }
        
        console.log("キャプチャ成功、AIでの分析を開始");
        
        // 画像データを保存し、IDを取得（ログに画像データを出力しない）
        let imageId = "";
        if (typeof global.storeChartImage === 'function') {
          // 画像を保存してIDを取得
          imageId = global.storeChartImage(imageData);
          console.log(`画像を保存しました。ID: ${imageId}`);
          
          // 指定された形式でも画像を保存
          try {
            const fs = require('fs');
            const path = require('path');
            const appCapturesDir = path.join(process.cwd(), 'public', 'app-chart-captures');
            
            // ディレクトリが存在しない場合は作成
            if (!fs.existsSync(appCapturesDir)) {
              fs.mkdirSync(appCapturesDir, { recursive: true });
            }
            
            // Base64データをバイナリに変換
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // フルページとして保存
            const fullPagePath = path.join(appCapturesDir, 'app-full-page.png');
            fs.writeFileSync(fullPagePath, buffer);
            console.log(`フルページ画像を保存しました: ${fullPagePath}`);
            
            // チャート要素としても保存
            const chartElementPath = path.join(appCapturesDir, `element-1-radix--Rl3ql7--content-chart.png`);
            fs.writeFileSync(chartElementPath, buffer);
            console.log(`チャート要素画像を保存しました: ${chartElementPath}`);
          } catch (saveError) {
            console.error('指定形式での画像保存に失敗しました:', saveError);
          }
        } else {
          // フォールバック: UUIDを生成して一時的に使用
          imageId = `chart-${uuidv4()}`;
          // グローバルオブジェクトに一時的に保存
          if (!global.chartImages) {
            global.chartImages = new Map<string, string>();
          }
          global.chartImages.set(imageId, imageData);
          console.log(`一時的な画像IDを生成: ${imageId}`);
        }
        
        // OpenAI Vision APIで画像を分析
        const aiAnalysis = await analyzeChartWithAI(imageData, context.focusOn);
        
        return {
          analysis: aiAnalysis.analysis,
          recommendation: aiAnalysis.recommendation,
          confidence: aiAnalysis.confidence,
          imageId: imageId, // 画像データの代わりにIDを返す
          imageCaption: "チャート分析", // キャプション
        };
      } else {
        console.error("Socket.ioキャプチャ機能が利用できません");
        return {
          ...fallbackAnalysis,
          analysis: "Socket.ioキャプチャ機能が利用できません。サーバー側の設定を確認してください。"
        };
      }
    } catch (error) {
      console.error("チャートキャプチャ分析エラー:", error);
      
      // エラー時は一般的な分析結果を返す
      return {
        analysis: `チャート分析中にエラーが発生しました: ${error}`,
        recommendation: "現在データが取得できないため、取引判断は保留することをお勧めします。",
        confidence: 0,
        imageId: "",
        imageCaption: "エラーのため画像なし"
      };
    }
  },
});
