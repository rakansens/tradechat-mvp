// components/ErrorBoundary.tsx
// 作成: Reactコンポーネントのエラーをキャッチするエラーバウンダリ
// 
// このコンポーネントはReactコンポーネントツリー内で発生したエラーをキャッチし、
// アプリケーション全体がクラッシュするのを防ぎます。

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/common';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // エラー発生時に状態を更新
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラーをロギング - エラーオブジェクトの適切な処理を追加
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      name: error.name,
      componentStack: errorInfo.componentStack
    };
    
    logger.error('コンポーネントエラー', errorDetails, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo.componentStack
    });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error);
      }
      
      if (fallback) {
        return fallback;
      }

      // デフォルトのフォールバックUI（開発用）
      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-300 rounded-md">
          <h2 className="text-lg font-semibold text-red-700">コンポーネントエラー</h2>
          <p className="text-red-600 mt-1">開発者向け: コンポーネントでエラーが発生しました</p>
          <div className="mt-2 p-2 bg-red-100 rounded overflow-auto text-sm">
            <p><strong>エラー:</strong> {error.message}</p>
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
          <button 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return children;
  }
}
