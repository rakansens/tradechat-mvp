/**
 * __tests__/components/chat/section/hooks/__mocks__/useQuickCommands.ts
 * useQuickCommandsフックのモック実装
 */

import { logger } from '@/utils/logger';

// クイックコマンドの型定義（オリジナルと一致させる）
export interface QuickCommand {
  label: string;
  value: string;
  icon: any; // JSXを使わないためany型に
  action: () => void;
}

/**
 * クイックコマンドのモック実装
 * 
 * JSXを使わずにテスト可能な形式で実装
 */
export const useQuickCommands = (): QuickCommand[] => {
  // コマンドのログ出力を行うハンドラー
  const logCommandAction = (commandLabel: string) => {
    logger.info(`Quick command: ${commandLabel}`, {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  };
  
  // クイックコマンドのモックを定義
  return [
    {
      label: "Entry Point",
      value: "Entry Point",
      icon: "TrendingUpIcon", // JSXの代わりに文字列を使用
      action: () => logCommandAction("Entry Point"),
    },
    {
      label: "Market News",
      value: "Market News",
      icon: "BarChart2Icon", // JSXの代わりに文字列を使用
      action: () => logCommandAction("Market News"),
    },
    { 
      label: "AI Signal", 
      value: "AI Signal", 
      icon: "ZapIcon", // JSXの代わりに文字列を使用
      action: () => logCommandAction("AI Signal"),
    },
  ];
};

export default useQuickCommands; 