/**
 * hooks/ui/useLongPress.ts
 * 作成: 2025-06-26 - モバイルデバイス向けlong-press検出フック
 * 更新: 2025-06-27 - デフォルトdelayを定数化
 */

import { useCallback, useRef } from 'react';

// デフォルト設定値
const DEFAULT_DELAY = 500; // ミリ秒

interface LongPressOptions {
  delay?: number;
  preventContextMenu?: boolean;
  preventDefault?: boolean;
}

interface LongPressResult {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

/**
 * 長押し（long-press）を検出するカスタムフック
 * モバイルデバイスでの長押しメニュー表示などに使用
 * 
 * @param callback 長押し検出時に実行するコールバック関数
 * @param options 設定オプション（遅延時間など）
 * @returns ポインターイベントハンドラーオブジェクト
 * 
 * 使用例:
 * ```tsx
 * const handleLongPress = () => setIsMenuOpen(true);
 * const { onPointerDown, onPointerUp, onPointerCancel } = useLongPress(handleLongPress);
 * 
 * return (
 *   <div 
 *     onPointerDown={onPointerDown}
 *     onPointerUp={onPointerUp}
 *     onPointerCancel={onPointerCancel}
 *     onPointerLeave={onPointerCancel}
 *   >
 *     長押しで操作するコンテンツ
 *   </div>
 * );
 * ```
 */
export function useLongPress(
  callback: () => void, 
  options: LongPressOptions = {}
): LongPressResult {
  const { 
    delay = DEFAULT_DELAY,
    preventContextMenu = true,
    preventDefault = true 
  } = options;
  
  // タイマーIDを保持するref
  const timeoutRef = useRef<number | null>(null);
  // ポインターIDを保持するref（マルチタッチ対応）
  const pointerIdRef = useRef<number | null>(null);
  
  // タイマーをクリアする関数
  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // ポインタダウンイベントハンドラー
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    // 別のポインターがアクティブな場合は無視
    if (pointerIdRef.current !== null && pointerIdRef.current !== e.pointerId) {
      return;
    }
    
    // ポインターIDを記録
    pointerIdRef.current = e.pointerId;
    
    // 既存のタイマーをクリア
    clearTimer();
    
    // 新しいタイマーを設定
    timeoutRef.current = window.setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, delay);
  }, [callback, delay, clearTimer, preventDefault]);
  
  // ポインタアップイベントハンドラー
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    // 記録したポインターIDと一致する場合のみ処理
    if (pointerIdRef.current === e.pointerId) {
      clearTimer();
      pointerIdRef.current = null;
    }
  }, [clearTimer, preventDefault]);
  
  // ポインタキャンセルイベントハンドラー（タッチキャンセルなど）
  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    // 記録したポインターIDと一致する場合のみ処理
    if (pointerIdRef.current === e.pointerId) {
      clearTimer();
      pointerIdRef.current = null;
    }
  }, [clearTimer, preventDefault]);
  
  // コンテキストメニュー抑制ハンドラー
  // 注: ハンドラーを結合するときに、このハンドラーも適用する必要があります
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    if (preventContextMenu) {
      e.preventDefault();
    }
  }, [preventContextMenu]);
  
  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave: onPointerCancel,
    onContextMenu
  };
} 