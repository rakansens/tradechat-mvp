/**
 * components/chat/section/hooks/useQuickCommands.tsx
 * クイックコマンドの定義とハンドラーを提供するフック
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: ファイル拡張子を.tsから.tsxに変更（JSX構文使用のため）
 */

import React, { ReactNode } from 'react';
import { TrendingUp, BarChart2, Zap } from 'lucide-react';
import { logger } from '@/utils/logger';

// クイックコマンドの型定義
export interface QuickCommand {
  label: string;
  value: string;
  icon: ReactNode;
  action: () => void;
}

/**
 * クイックコマンドの定義とハンドラーを提供するフック
 * 
 * プリセットされたコマンドとそのアクションハンドラーを返します。
 * ログ出力は内部でカプセル化されています。
 * 
 * @returns クイックコマンドの配列
 */
export const useQuickCommands = () => {
  // コマンドのログ出力を行うハンドラー
  const logCommandAction = (commandLabel: string) => {
    logger.info(`Quick command: ${commandLabel}`, {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  };
  
  // クイックコマンドを定義
  const quickCommands: QuickCommand[] = [
    {
      label: "Entry Point",
      value: "Entry Point",
      icon: <TrendingUp className="h-3 w-3 mr-1" />,
      action: () => logCommandAction("Entry Point"),
    },
    {
      label: "Market News",
      value: "Market News",
      icon: <BarChart2 className="h-3 w-3 mr-1" />,
      action: () => logCommandAction("Market News"),
    },
    { 
      label: "AI Signal", 
      value: "AI Signal", 
      icon: <Zap className="h-3 w-3 mr-1" />, 
      action: () => logCommandAction("AI Signal"),
    },
  ];
  
  return quickCommands;
};

export default useQuickCommands; 