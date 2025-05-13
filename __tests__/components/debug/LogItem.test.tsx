import { render, screen, fireEvent } from '@testing-library/react';
import { LogItem } from '@/components/debug/LogItem';
import { StoredLog } from '@/utils/logStorage';

// 追加
jest.mock('@/utils/logStorage', () => ({
  StoredLog: {},
}));

describe('LogItem', () => {
  const mockLog: StoredLog = {
    level: 'error' as const,
    message: 'テストエラーメッセージ',
    timestamp: new Date().toISOString(),
    context: { test: 'context' },
    error: 'テストエラー詳細'
  };

  it('ログメッセージと時間を表示する', () => {
    render(<LogItem log={mockLog} />);
    
    // メッセージが表示されることを確認
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
    
    // ログレベルが表示されることを確認
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    
    // タイムスタンプが表示されることを確認（日付形式なので一部だけチェック）
    const dateString = new Date(mockLog.timestamp).toLocaleString();
    expect(screen.getByText(dateString)).toBeInTheDocument();
  });

  it('詳細表示の切り替えができる', () => {
    render(<LogItem log={mockLog} />);
    
    // 最初は詳細が非表示
    expect(screen.queryByText('コンテキスト:')).not.toBeInTheDocument();
    
    // 詳細を表示ボタンをクリック
    fireEvent.click(screen.getByText('詳細を表示'));
    
    // 詳細が表示される
    expect(screen.getByText('コンテキスト:')).toBeInTheDocument();
    expect(screen.getByText('エラー詳細:')).toBeInTheDocument();
    
    // コンテキストとエラー詳細の内容が表示される
    expect(screen.getByText(/test/)).toBeInTheDocument();
    expect(screen.getByText('テストエラー詳細')).toBeInTheDocument();
    
    // 詳細を隠すボタンをクリック
    fireEvent.click(screen.getByText('詳細を隠す'));
    
    // 詳細が再び非表示になる
    expect(screen.queryByText('コンテキスト:')).not.toBeInTheDocument();
  });

  it('コンテキストとエラーがない場合は詳細表示ボタンが表示されない', () => {
    const logWithoutDetails: StoredLog = {
      level: 'info' as const,
      message: '情報メッセージ',
      timestamp: new Date().toISOString()
    };
    
    render(<LogItem log={logWithoutDetails} />);
    
    // 詳細表示ボタンが存在しないことを確認
    expect(screen.queryByText('詳細を表示')).not.toBeInTheDocument();
  });
}); 