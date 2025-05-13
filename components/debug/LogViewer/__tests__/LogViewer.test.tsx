import { render, screen, fireEvent } from '@testing-library/react';
import LogViewer from '../LogViewer';
import { useLogs, useDebugStores, useDebugPolling } from '@/hooks/debug';

// モックの設定
jest.mock('@/hooks/debug', () => ({
  useLogs: jest.fn(),
  useDebugStores: jest.fn(),
  useDebugPolling: jest.fn()
}));

// UIコンポーネントをモック
jest.mock('../ui/LogsPanel', () => ({
  LogsPanel: jest.fn(() => <div data-testid="logs-panel">LogsPanel Mock</div>)
}));

jest.mock('../ui/FetchesPanel', () => ({
  FetchesPanel: jest.fn(() => <div data-testid="fetches-panel">FetchesPanel Mock</div>)
}));

jest.mock('../ui/PollingStatusPanel', () => ({
  PollingStatusPanel: jest.fn(() => <div data-testid="polling-panel">PollingStatusPanel Mock</div>)
}));

jest.mock('../ui/SymbolHistoryPanel', () => ({
  SymbolHistoryPanel: jest.fn(() => <div data-testid="symbol-history-panel">SymbolHistoryPanel Mock</div>)
}));

jest.mock('../ui/CacheStatsPanel', () => ({
  CacheStatsPanel: jest.fn(() => <div data-testid="cache-stats-panel">CacheStatsPanel Mock</div>)
}));

jest.mock('../ui/DebugModeSwitch', () => ({
  DebugModeSwitch: jest.fn(() => <div data-testid="debug-mode-switch">DebugModeSwitch Mock</div>)
}));

describe('LogViewer', () => {
  // デフォルトのモック値を設定
  beforeEach(() => {
    // useLogsのモック
    (useLogs as jest.Mock).mockReturnValue({
      logs: [],
      refreshLogs: jest.fn(),
      handleClearLogs: jest.fn()
    });
    
    // useDebugStoresのモック
    (useDebugStores as jest.Mock).mockReturnValue({
      isDebugMode: true,
      toggleDebugMode: jest.fn(),
      refreshDebugInfo: jest.fn().mockReturnValue({
        activeFetches: [],
        pollingStatus: {},
        symbolHistory: [],
        cacheStats: {},
        requestHistory: []
      })
    });
    
    // useDebugPollingのモック
    (useDebugPolling as jest.Mock).mockReturnValue({
      isPolling: true,
      refreshInterval: 1234
    });
  });
  
  it('コンポーネントが正しくレンダリングされること', () => {
    render(<LogViewer />);
    
    // タブが存在することを確認
    expect(screen.getByText('ログ')).toBeInTheDocument();
    expect(screen.getByText('フェッチリクエスト')).toBeInTheDocument();
    expect(screen.getByText('ポーリング状態')).toBeInTheDocument();
    expect(screen.getByText('シンボル履歴')).toBeInTheDocument();
    expect(screen.getByText('キャッシュ')).toBeInTheDocument();
    
    // デバッグモードスイッチが表示されることを確認
    expect(screen.getByTestId('debug-mode-switch')).toBeInTheDocument();
    
    // デフォルトでログパネルが表示されることを確認
    expect(screen.getByTestId('logs-panel')).toBeInTheDocument();
  });
  
  it('タブ切り替えですべてのパネルが表示されること', () => {
    render(<LogViewer />);
    
    // デフォルトでログパネルが表示されていることを確認
    expect(screen.getByTestId('logs-panel')).toBeInTheDocument();
    
    // フェッチリクエストタブへ切り替え
    fireEvent.click(screen.getByText('フェッチリクエスト'));
    expect(screen.getByTestId('fetches-panel')).toBeInTheDocument();
    
    // ポーリング状態タブへ切り替え
    fireEvent.click(screen.getByText('ポーリング状態'));
    expect(screen.getByTestId('polling-panel')).toBeInTheDocument();
    
    // シンボル履歴タブへ切り替え
    fireEvent.click(screen.getByText('シンボル履歴'));
    expect(screen.getByTestId('symbol-history-panel')).toBeInTheDocument();
    
    // キャッシュタブへ切り替え
    fireEvent.click(screen.getByText('キャッシュ'));
    expect(screen.getByTestId('cache-stats-panel')).toBeInTheDocument();
  });
  
  it('初期化時にデバッグ情報を取得すること', () => {
    const refreshLogsMock = jest.fn();
    const refreshDebugInfoMock = jest.fn().mockReturnValue({
      activeFetches: [],
      pollingStatus: {},
      symbolHistory: [],
      cacheStats: {},
      requestHistory: []
    });
    
    (useLogs as jest.Mock).mockReturnValue({
      logs: [],
      refreshLogs: refreshLogsMock,
      handleClearLogs: jest.fn()
    });
    
    (useDebugStores as jest.Mock).mockReturnValue({
      isDebugMode: true,
      toggleDebugMode: jest.fn(),
      refreshDebugInfo: refreshDebugInfoMock
    });
    
    render(<LogViewer />);
    
    // コンポーネントマウント時にrefreshLogsとrefreshDebugInfoが呼ばれることを確認
    expect(refreshLogsMock).toHaveBeenCalled();
    expect(refreshDebugInfoMock).toHaveBeenCalled();
  });
}); 