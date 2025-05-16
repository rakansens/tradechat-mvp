import { renderHook, act } from '@testing-library/react';
import { useLogs } from '../logs/useLogs';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';

// モックの設定
jest.mock('@/utils/logStorage', () => ({
  getStoredLogs: jest.fn(),
  clearStoredLogs: jest.fn(),
  StoredLog: {}
}));

describe('useLogs', () => {
  // テストの前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // テストデータ
  const mockLogs: StoredLog[] = [
    { level: 'error', message: 'エラーメッセージ', timestamp: Date.now().toString() },
    { level: 'warn', message: '警告メッセージ', timestamp: Date.now().toString() },
    { level: 'info', message: '情報メッセージ', timestamp: Date.now().toString() },
    { level: 'debug', message: 'デバッグメッセージ', timestamp: Date.now().toString() }
  ];

  test('デフォルトで全てのログを返す', () => {
    // モックの実装
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // フックをレンダリング
    const { result } = renderHook(() => useLogs());
    
    // 結果を検証
    expect(result.current.logs).toEqual(mockLogs);
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
  });

  test('activeTab=errorでエラーログのみをフィルタリングする', () => {
    // モックの実装
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // フックをレンダリング（errorタブ指定）
    const { result } = renderHook(() => useLogs('error'));
    
    // 結果を検証 - エラーログのみが返されるべき
    expect(result.current.logs).toEqual([mockLogs[0]]);
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
  });

  test('activeTab=warnで警告ログのみをフィルタリングする', () => {
    // モックの実装
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // フックをレンダリング（warnタブ指定）
    const { result } = renderHook(() => useLogs('warn'));
    
    // 結果を検証 - 警告ログのみが返されるべき
    expect(result.current.logs).toEqual([mockLogs[1]]);
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
  });

  test('activeTab=debugでデバッグログのみをフィルタリングする', () => {
    // モックの実装
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // フックをレンダリング（debugタブ指定）
    const { result } = renderHook(() => useLogs('debug'));
    
    // 結果を検証 - デバッグログのみが返されるべき
    expect(result.current.logs).toEqual([mockLogs[3]]);
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
  });

  test('handleClearLogsでログをクリアする', () => {
    // モックの実装
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // フックをレンダリング
    const { result } = renderHook(() => useLogs());
    
    // クリア前にログがあることを確認
    expect(result.current.logs).toEqual(mockLogs);
    
    // クリア関数を実行
    act(() => {
      result.current.handleClearLogs();
    });
    
    // クリア後にclearStoredLogsが呼ばれたことを確認
    expect(clearStoredLogs).toHaveBeenCalledTimes(1);
    // ログが空になったことを確認
    expect(result.current.logs).toEqual([]);
  });

  test('activeTabが変更されたときにログを再フェッチする', () => {
    // 初期はすべてのログを返す
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // 最初にallタブでレンダリング
    const { result, rerender } = renderHook(
      ({ activeTab }: { activeTab: LogLevel }) => useLogs(activeTab),
      { initialProps: { activeTab: 'all' } }
    );
    
    // 全てのログが返されることを確認
    expect(result.current.logs).toEqual(mockLogs);
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
    
    // errorタブに変更
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs); // モックをリセット
    rerender({ activeTab: 'error' });
    
    // エラーログのみが返されることを確認
    expect(result.current.logs).toEqual([mockLogs[0]]);
    expect(getStoredLogs).toHaveBeenCalledTimes(2); // 2回目の呼び出し
  });

  it('should return logs filtered by activeTab', () => {
    // モックデータ設定
    const mockLogs = [
      { id: '1', message: 'Error log', level: 'error', timestamp: Date.now() },
      { id: '2', message: 'Warning log', level: 'warn', timestamp: Date.now() },
      { id: '3', message: 'Debug log', level: 'debug', timestamp: Date.now() }
    ];
    
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    // 'all' タブでレンダリング
    const { result, rerender } = renderHook(() => useLogs('all'));
    
    // すべてのログが表示されるはず
    expect(result.current.logs).toHaveLength(3);
    
    // 'error' タブに変更
    rerender(() => useLogs('error'));
    
    // エラーログのみが表示されるはず
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].level).toBe('error');
  });

  it('should clear logs when handleClearLogs is called', () => {
    const { result } = renderHook(() => useLogs());
    
    act(() => {
      result.current.handleClearLogs();
    });
    
    // clearStoredLogsが呼ばれたはず
    expect(clearStoredLogs).toHaveBeenCalled();
    // logsが空になったはず
    expect(result.current.logs).toHaveLength(0);
  });

  it('should refresh logs when refreshLogs is called', () => {
    const mockLogs = [
      { id: '1', message: 'Test log', level: 'debug', timestamp: Date.now() }
    ];
    
    (getStoredLogs as jest.Mock).mockReturnValue(mockLogs);
    
    const { result } = renderHook(() => useLogs());
    
    // 初回レンダリングで一度呼ばれている
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
    
    // refreshLogsを呼び出す
    act(() => {
      result.current.refreshLogs();
    });
    
    // さらにもう一度呼ばれたはず
    expect(getStoredLogs).toHaveBeenCalledTimes(2);
    expect(result.current.logs).toEqual(mockLogs);
  });
}); 