// components/common/ErrorDisplay.tsx
// 作成: 共通のエラーハンドリングコンポーネントを実装
"use client"

import React from 'react';

export interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  alternativeActions?: {
    label: string;
    action: () => void;
  }[];
}

/**
 * 共通のエラーハンドリングコンポーネント
 * 
 * @param error エラーメッセージ
 * @param onRetry 再試行ボタンのクリックハンドラ
 * @param alternativeActions 代替アクションのリスト（例：現物取引に切り替えるなど）
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  alternativeActions
}) => {
  if (!error) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
      <div className="text-center p-4">
        <p className="text-2xl font-semibold text-red-500">エラーが発生しました</p>
        <p className="text-base mt-2 mb-4">{error}</p>
        
        {alternativeActions && alternativeActions.length > 0 && (
          <div className="flex flex-col space-y-2 items-center">
            {alternativeActions.map((action, index) => (
              <button 
                key={index}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
            {onRetry && <span className="text-sm text-gray-400 mt-1">または</span>}
          </div>
        )}
        
        {onRetry && (
          <button 
            className="mt-2 px-6 py-3 bg-[#2962FF] text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={onRetry}
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;