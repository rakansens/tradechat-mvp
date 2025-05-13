import { render, screen, fireEvent } from '@testing-library/react';
import LogViewer from '@/components/debug/LogViewer';
import { useDebugPanel } from '@/hooks/useDebugPanel';
import { StoredLog } from '@/utils/logStorage';

// 型定義を追加
type MockLog = {
  level: 'error' | 'info' | 'warn' | 'debug';
  message: string;
  timestamp: string;
  context?: any;
  error?: string;
};

// useDebugPanelフックをモックする
jest.mock('@/hooks/useDebugPanel', () => ({
  useDebugPanel: jest.fn(),
}));

jest.mock('@/utils/logStorage', () => ({
  StoredLog: {},
}));

describe('LogViewer', () => {
  // モックのセットアップ関数
  const setupMock = (overrides = {}) => {
    const mockLog: MockLog = {
      level: 'error',
      message: 'テストエラー',
      timestamp: new Date().toISOString()
    };
    
    const mockValues = {
      logs: [mockLog] as StoredLog[],
      activeTab: 'all',
      setActiveTab: jest.fn(),
      activeFetches: [],
      pollingStatus: {
        orderbook: { active: true, interval: 5000, lastPollTime: new Date().toISOString() },
        chart: { active: false, interval: 10000 }
      },
      symbolHistory: [
        { from: 'BTC/USD', to: 'ETH/USD', reason: 'テスト', timestamp: new Date().toISOString() }
      ],
      cacheStats: { totalEntries: 2, entries: [
        { key: 'test-key', age: 1000, isExpired: false, expiresIn: 10000 }
      ] },
      requestHistory: [
        { key: 'request-1', status: 'completed', duration: 150 }
      ],
      isDebugMode: true,
      toggleDebugMode: jest.fn(),
      refreshLogs: jest.fn(),
      refreshDebugInfo: jest.fn(),
      handleClearLogs: jest.fn(),
      ...overrides
    };
    
    (useDebugPanel as jest.Mock).mockReturnValue(mockValues);
    return mockValues;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('デバッグパネルのタイトルとデバッグモードスイッチが表示される', () => {
    setupMock();
    render(<LogViewer />);
    
    expect(screen.getByText('デバッグパネル')).toBeInTheDocument();
    expect(screen.getByText('デバッグモード')).toBeInTheDocument();
  });
  
  it('タブを切り替えるとタブコンテンツが切り替わる', () => {
    const mockValues = setupMock();
    render(<LogViewer />);
    
    // デフォルトではログタブが表示される
    expect(screen.getByText('ログをクリア')).toBeInTheDocument();
    
    // フェッチリクエストタブをクリック
    fireEvent.click(screen.getByText('フェッチリクエスト'));
    
    // フェッチリクエストタブの内容が表示される
    expect(screen.getByText('アクティブなフェッチリクエスト')).toBeInTheDocument();
    
    // ポーリング状態タブをクリック
    fireEvent.click(screen.getByText('ポーリング状態'));
    
    // ポーリング状態タブの内容が表示される
    expect(screen.getByText('自動更新の状態')).toBeInTheDocument();
    
    // refreshDebugInfoが呼ばれることを確認
    expect(mockValues.refreshDebugInfo).toHaveBeenCalled();
  });
  
  it('デバッグモードスイッチを切り替えるとtoggleDebugModeが呼ばれる', () => {
    const mockValues = setupMock();
    render(<LogViewer />);
    
    // スイッチ要素を取得
    const switchElement = screen.getByRole('switch');
    
    // スイッチをクリック
    fireEvent.click(switchElement);
    
    // toggleDebugModeが呼ばれることを確認
    expect(mockValues.toggleDebugMode).toHaveBeenCalled();
  });
  
  it('ログタブでログをクリアボタンをクリックするとhandleClearLogsが呼ばれる', () => {
    const mockValues = setupMock();
    render(<LogViewer />);
    
    // ログをクリアボタンをクリック
    fireEvent.click(screen.getByText('ログをクリア'));
    
    // handleClearLogsが呼ばれることを確認
    expect(mockValues.handleClearLogs).toHaveBeenCalled();
  });
  
  it('ログがない場合は「保存されたログはありません」と表示される', () => {
    setupMock({ logs: [] });
    render(<LogViewer />);
    
    expect(screen.getByText('保存されたログはありません')).toBeInTheDocument();
  });
  
  it('ポーリング状態が正しく表示される', () => {
    setupMock();
    render(<LogViewer />);
    
    // ポーリング状態タブをクリック
    fireEvent.click(screen.getByText('ポーリング状態'));
    
    // オーダーブックポーリングがアクティブと表示される
    expect(screen.getByText('アクティブ')).toBeInTheDocument();
    
    // チャートデータポーリングが停止中と表示される
    expect(screen.getByText('停止中')).toBeInTheDocument();
  });
}); 