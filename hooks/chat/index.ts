/**
 * hooks/chat/index.ts
 * チャット関連フックのバレルファイル
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2023-06-25: ChatWindow.tsxのリファクタリングに伴いウィンドウ関連フックを追加
 * - 2023-06-30: バレルエクスポート更新
 * - 2025-05-14: useChatInteractionをエクスポート追加
 * - 2025-06-28: useScrollManagerをuseAutoScrollに置き換え
 */

// フックのエクスポート
export { useChatSectionStores } from "@/components/chat/section/hooks/useChatSectionStores";
export { useQuickCommands } from "@/components/chat/section/hooks/useQuickCommands";

// 型定義のエクスポート
export type { QuickCommand } from "@/components/chat/section/hooks/useQuickCommands";

export { default as useChatWindowStores } from '@/components/chat/window/hooks/useChatWindowStores';
<<<<<<< ours

=======
export { useAutoScroll } from '@/hooks/ui';
>>>>>>> theirs

// useChatInteractionフックのエクスポート
export { useChatInteraction } from './useChatInteraction';
export { useStreamingMessages } from './useStreamingMessages';
export { useSampleResponses } from './useSampleResponses';
export { useEntryManager } from './useEntryManager';
