/**
 * components/market/orderbook/ui/Header.tsx
 * 作成: オーダーブックのヘッダーUIコンポーネント
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { normalizeSymbol } from '@/utils/symbol';

interface HeaderProps {
  // タイトル
  title?: string;
  // 現在のシンボル
  currentSymbol: string;
  // AppStoreのシンボル（同期確認用）
  appStoreSymbol?: string;
  // WebSocketの状態
  wsStatus: {
    connected: boolean;
    subscriptions: {
      orderbook: boolean;
    };
  };
  // クライアントサイドレンダリング済みかどうか
  mounted: boolean;
}

/**
 * オーダーブックのヘッダーコンポーネント
 * WebSocketの接続状態とシンボルを表示
 */
const Header = memo(function Header({
  title = 'オーダーブック',
  currentSymbol,
  appStoreSymbol,
  wsStatus,
  mounted
}: HeaderProps) {
  return (
    <div className="p-2 bg-[#1E222D] border-b border-[#2A2E39] flex justify-between items-center">
      <div className="flex items-center">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {/* WebSocketの接続状態を表示 */}
        {mounted && (
          <div className="ml-2 flex items-center">
            <div
              className={cn(
                "w-2 h-2 rounded-full mr-1",
                wsStatus.connected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-[#9CA3AF]">
              {wsStatus.connected ? (
                wsStatus.subscriptions?.orderbook ? "WS" : "REST"
              ) : "REST"}
            </span>
          </div>
        )}
      </div>
      <span className="text-xs text-[#9CA3AF]">
        {mounted ? currentSymbol : ''}
        {/* デバッグ用：AppStoreとの同期状態を表示 */}
        {mounted && appStoreSymbol && 
          normalizeSymbol(currentSymbol) !== normalizeSymbol(appStoreSymbol) && (
          <span className="ml-1 text-red-500">(!)</span>
        )}
      </span>
    </div>
  );
});

export default Header; 