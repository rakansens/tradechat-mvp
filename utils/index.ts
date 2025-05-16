/**
 * utils/index.ts
 * ユーティリティ関数のバレルエクスポート
 * 
 * 変更履歴:
 * - T-7.5フェーズ: 再エクスポート衝突を回避
 */

/**
 * @deprecated このファイルは以下のサブモジュールへの直接インポートを推奨します：
 * - import { formatDate } from '@/utils/date';
 * - import { sanitizeTimeframe } from '@/utils/chart/sanitizers';
 * - import { formatTimeframe } from '@/utils/chart/formatters';
 * - import { isString, isNumber } from '@/utils/typeGuards';
 */

// ワイルドカードエクスポートは意図的に使用可能な状態を保持
// これは一部の既存コードが動作するようにするためのものです
export * from './typeGuards';
export * from './formatUtils'; 