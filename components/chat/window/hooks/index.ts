/**
 * components/chat/window/hooks/index.ts
 * 作成: ChatWindowフックのバレルエクスポート
 * 更新: 2025-06-28 - useScrollManagerをuseAutoScrollに置き換え
 */

import useAutoScroll from '@/hooks/ui';

export { default as useChatWindowStores } from './useChatWindowStores';
export { useAutoScroll }; 