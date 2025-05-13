/**
 * hooks/chat/index.ts
 * チャット関連フックのバレルエクスポート
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2023-06-25: ChatWindow.tsxのリファクタリングに伴いウィンドウ関連フックを追加
 * - 2023-06-30: バレルエクスポート更新
 */

export { default as useChatSectionStores } from '@/components/chat/section/hooks/useChatSectionStores';
export { default as useChatWindowStores } from '@/components/chat/window/hooks/useChatWindowStores';
export { default as useScrollManager } from '@/components/chat/window/hooks/useScrollManager';
export { default as useQuickCommands, type QuickCommand } from '@/components/chat/section/hooks/useQuickCommands'; 