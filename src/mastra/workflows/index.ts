// src/mastra/workflows/index.ts
// 作成: すべてのワークフローをエクスポート

/**
 * チャート分析ワークフロー
 * 単一時間足のチャートを分析するワークフロー
 */
export { analyzeTimeframeWorkflow } from './chart-analysis';

/**
 * 複数時間足分析ワークフロー
 * 複数の時間足でチャートを分析し、総合的な見解を提供するワークフロー
 */
export { multiTimeframeAnalysisWorkflow } from './timeframe-analysis';

/**
 * エントリー提案ワークフロー
 * 複数時間足分析に基づいてエントリーポイントを提案するワークフロー
 */
export { entrySuggestionWorkflow } from './entry-suggestion';
