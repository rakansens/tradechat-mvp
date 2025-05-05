// scripts/hybrid-analysis/utils/api-limiter.js
// OpenAI APIリクエストを最適化するためのユーティリティモジュール

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// OpenAI APIキー取得関数
const getOpenAIApiKey = () => {
  try {
    // .envファイルから直接読み込みを試みる
    const envPath = path.join(__dirname, '..', '..', '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/OPENAI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 環境変数から取得を試みる
    if (process.env.OPENAI_API_KEY) {
      return process.env.OPENAI_API_KEY;
    }
    
    // プロジェクトの設定ファイルから取得を試みる
    const configPath = path.join(__dirname, '..', '..', '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.openaiApiKey) {
        return config.openaiApiKey;
      }
    }
    
    return null;
  } catch (error) {
    console.error('エラー: OpenAI APIキーの取得に失敗しました:', error);
    return null;
  }
};

/**
 * OpenAI APIクライアントシングルトンを取得
 * @returns {OpenAI} OpenAI APIクライアント
 */
function getOpenAIClient() {
  if (!getOpenAIApiKey()) {
    throw new Error('OpenAI APIキーが設定されていません。');
  }
  
  return new OpenAI({
    apiKey: getOpenAIApiKey()
  });
}

/**
 * 並列APIリクエストを制限するためのリミッターを作成
 * @param {number} concurrency 同時リクエスト数
 * @returns {Function} 制限された並列実行関数
 */
function createAPILimiter(concurrency = 2) {
  // p-limitのインポートと利用を同じスコープ内で行う
  // CommonJSとESMの互換性問題を回避
  const limiterFunction = require('p-limit');
  const limiter = typeof limiterFunction === 'function' ? limiterFunction(concurrency) : limiterFunction.default(concurrency);
  const openai = getOpenAIClient();
  
  /**
   * 制限付きOpenAI APIリクエスト実行関数
   * @param {Object} params OpenAI APIリクエストパラメータ
   * @param {string} taskName タスク名（ログ用）
   * @returns {Promise<Object>} APIレスポンス
   */
  return async function limitedAPIRequest(params, taskName = 'APIリクエスト') {
    return limiter(async () => {
      console.log(`${taskName} - APIリクエスト開始...`);
      try {
        const startTime = Date.now();
        const response = await openai.chat.completions.create(params);
        const endTime = Date.now();
        console.log(`${taskName} - APIリクエスト完了 (${endTime - startTime}ms)`);
        return response;
      } catch (error) {
        console.error(`${taskName} - APIリクエストエラー:`, error);
        
        // レート制限エラーの場合、待機して再試行
        if (error.status === 429) {
          const retryAfter = error.headers?.['retry-after'] || 60;
          console.log(`${taskName} - レート制限のため${retryAfter}秒後に再試行...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return limitedAPIRequest(params, `${taskName} (再試行)`);
        }
        
        throw error;
      }
    });
  };
}

/**
 * チャート分析のためのAPIプロンプトを作成
 * @param {string} timeframe タイムフレーム
 * @param {Object} analysisData 分析用データ
 * @param {string} chartImage チャート画像（Base64）
 * @returns {Array} APIリクエスト用のメッセージ
 */
function createAnalysisPrompt(timeframe, analysisData, chartImage = null) {
  // APIデータをテキスト形式に変換
  const apiDataText = JSON.stringify(analysisData, null, 2);
  
  // システムプロンプト
  const systemPrompt = `あなたはトレーディングチャートとデータを分析する専門家AGENTです。
チャート画像と数値データの両方を分析して、以下の情報を含むレポートを作成してください：

1. 基本情報分析:
   - 通貨ペア/銘柄
   - 現在の価格レベル
   - チャートのタイムフレーム

2. 各テクニカルインジケーターの詳細分析:
   - RSI: 現在の値、過買い/過売り状態、トレンド方向との一致/不一致
   - MACD: シグナルラインとの関係、ヒストグラムの傾向、クロスオーバーポイント
   - ボリンジャーバンド: 価格のバンド内での位置、スクイーズの有無、突破/反発パターン
   - 移動平均線: 短期/長期線の位置関係、ゴールデン/デッドクロスの有無、サポート/レジスタンスとしての機能
   - その他の利用可能なインジケーター

3. トレンド分析:
   - 主流トレンド方向（上昇/下降/レンジ相場）
   - トレンド強度の評価
   - 主要なサポート/レジスタンスレベル
   - チャートパターン（三角形、ヘッドアンドショルダー等）の検出と完成度

4. ボリューム分析:
   - 取引量の傾向
   - 特筆すべきボリュームスパイク
   - ボリュームと価格の関係性

5. トレード推奨:
   - エントリーポイントの提案（価格レベル）
   - 利確目標（複数のターゲット）
   - ストップロス推奨レベル
   - リスク/リワード比

6. 確信度評価:
   - 分析の確信度（低/中/高）
   - 確信度スコア（0-100）
   - 考慮すべきリスク要因

7. タイムフレーム固有の特徴:
   - このタイムフレーム特有のパターンや注目点
   - 長期/短期投資家へのアドバイス

8. 代替シナリオ:
   - 主要な見解が間違っていた場合の代替シナリオ
   - 警戒すべき価格レベル

このレポートはタイムフレーム「${timeframe}」に特化した分析であることを明記してください。
レポートは簡潔かつ具体的な数値を含め、トレーダーが即座に行動できる情報を提供してください。
チャート画像とAPIデータの両方を考慮して、より正確な分析を行ってください。
最後に、このタイムフレームに対するトレード推奨（買い/売り/様子見）を明確に示してください。

重要: レポートは日本語で回答してください。文章、分析内容、推奨すべてを日本語で書いてください。`;

  // ユーザープロンプト
  const userContent = [
    { 
      type: "text", 
      text: `このトレーディングチャートとAPIデータを分析し、タイムフレーム ${timeframe} の詳細なレポートを作成してください。特に各インジケーターの示唆を詳しく分析してください。

APIデータ:
${apiDataText}` 
    }
  ];
  
  // 画像がある場合は追加
  if (chartImage) {
    userContent.push({ 
      type: "image_url", 
      image_url: {
        url: `data:image/png;base64,${chartImage}`,
        detail: "high"
      }
    });
  }
  
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent }
  ];
}

/**
 * 複数タイムフレームの総合分析用プロンプトを作成
 * @param {string} symbol 通貨ペア
 * @param {Array<string>} timeframes タイムフレーム配列
 * @param {Object} timeframeResults 各タイムフレームの分析結果
 * @returns {Array} APIリクエスト用のメッセージ
 */
function createCombinedAnalysisPrompt(symbol, timeframes, timeframeResults) {
  // 総合分析用のプロンプト
  const combinedSystemPrompt = `あなたはトレーディングチャートとデータを分析する専門家AGENTです。
以下の複数のタイムフレーム（${timeframes.join(', ')}）のデータと分析結果を総合的に評価し、包括的なレポートを作成してください。

1. 総合市場分析:
   - 通貨ペア/銘柄の全体的な状況
   - 異なるタイムフレーム間のトレンドの一致性/不一致
   - 最も強いシグナルを示すタイムフレーム

2. 各タイムフレームの要約比較:
   - 各タイムフレームのトレンド方向とその強さ
   - 各タイムフレームのインジケーターが示す主要シグナル
   - 不一致や矛盾がある場合はそれを明記

3. 複数タイムフレーム分析:
   - より大きなタイムフレームの方向性と小さなタイムフレームのエントリーポイント
   - マルチタイムフレーム・コンフルエンス（複数の時間軸での一致点）
   - ネステッド・パターン（入れ子状のパターン）の分析

4. 主要インジケーターの複合分析:
   - 各タイムフレームでのRSI、MACD、ボリンジャーバンドなどの一致/不一致
   - 複数タイムフレームでの確認シグナル
   - 最も信頼できるインジケーターシグナルの特定

5. 総合トレード戦略:
   - 短期（数時間～数日）、中期（数日～数週間）、長期（数週間～数ヶ月）のトレード推奨
   - 理想的なエントリーポイント、ストップロス、利確レベル
   - リスク/リワード評価
   - ポジションサイジングの提案

6. 総合確信度評価:
   - トレード推奨の総合的な確信度スコア（0-100）
   - 最も確度の高いシナリオと代替シナリオ
   - リスク要因とその対処法

7. タイムフレーム選択アドバイス:
   - トレーダーのタイプ別（デイトレーダー、スイングトレーダー、投資家）推奨タイムフレーム
   - 現在の市場状況に最適なタイムフレームの提案

8. 現在のシグナルまとめ:
   - 買い: 強さ（0-10）と根拠
   - 売り: 強さ（0-10）と根拠
   - 様子見: 条件と再評価ポイント

この総合分析レポートは、トレーダーがより包括的な視点で市場を理解し、異なる時間軸における最適なトレード機会を特定するのに役立つものにしてください。具体的な数値、価格レベル、パーセンテージを含め、実用的な内容にしてください。

重要: レポートは日本語で回答してください。文章、分析内容、推奨すべてを日本語で書いてください。`;

  // 各タイムフレームの分析結果を短いサマリーに変換
  const timeframeAnalysisSummaries = Object.keys(timeframeResults).map(tf => {
    const fullAnalysis = timeframeResults[tf].analysis;
    // 最初の500文字程度を抽出（要約として）
    const summarizedAnalysis = fullAnalysis.length > 500 
      ? `${fullAnalysis.substring(0, 500)}...（省略）` 
      : fullAnalysis;
    
    return `===== ${tf} タイムフレーム分析 =====\n${summarizedAnalysis}`;
  }).join('\n\n');

  return [
    { role: "system", content: combinedSystemPrompt },
    { 
      role: "user", 
      content: `これらの複数タイムフレーム（${timeframes.join(', ')}）の分析結果を総合的に評価し、
${symbol}の包括的なトレードレポートを作成してください。

各タイムフレームの分析:
${timeframeAnalysisSummaries}

これらの分析を統合して、短期・中期・長期の見通しと最適なトレード戦略を提示してください。`
    }
  ];
}

module.exports = {
  getOpenAIClient,
  createAPILimiter,
  createAnalysisPrompt,
  createCombinedAnalysisPrompt
};
