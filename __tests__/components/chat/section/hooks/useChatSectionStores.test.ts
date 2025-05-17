/**
 * __tests__/components/chat/section/hooks/useChatSectionStores.test.ts
 * useChatSectionStoresフックのテストスイート
 */

import { useChatSectionStores } from '@/components/chat/section/hooks/useChatSectionStores';

// 各セレクターの戻り値をモック
const mockMessages = ['message1', 'message2'];
const mockIsLoading = false;
const mockInput = 'test input';
const mockConnection = { status: 'CONNECTED', error: null };
const mockSetInput = jest.fn();
const mockSendMessage = jest.fn();
const mockPendingEntry = { id: 'entry1' };
const mockHasPendingEntry = true;

// セレクター関数のダミー
const selectActiveMessages = jest.fn();
const selectActiveIsSearching = jest.fn();
const selectActiveInput = jest.fn();
const selectConversationConnection = jest.fn();
const selectPendingEntry = jest.fn();
const selectHasPendingEntry = jest.fn();

// useRootStoreのモック実装
const useRootStoreMock = jest.fn((selector?: any) => {
  switch (selector) {
    case selectActiveMessages:
      return mockMessages;
    case selectActiveIsSearching:
      return mockIsLoading;
    case selectActiveInput:
      return mockInput;
    case selectConversationConnection:
      return mockConnection;
    case selectPendingEntry:
      return mockPendingEntry;
    case selectHasPendingEntry:
      return mockHasPendingEntry;
    case undefined:
      return {
        setInput: mockSetInput,
        sendMessage: mockSendMessage,
      };
    default:
      return null;
  }
});

// ストアをモック
jest.mock('@/store', () => ({
  useRootStore: (...args: any[]) => useRootStoreMock(...args),
  selectActiveMessages,
  selectActiveIsSearching,
  selectActiveInput,
  selectConversationConnection,
  selectPendingEntry,
  selectHasPendingEntry,
}));

// renderHookモックを回避
jest.mock('@testing-library/react-hooks', () => ({
  renderHook: (callback: () => any) => {
    const result = { current: callback() };
    return { result };
  }
}));

describe('useChatSectionStores', () => {
  // テスト前のモックリセット
  beforeEach(() => {
    mockSetInput.mockClear();
    mockSendMessage.mockClear();
  });

  test('チャットとエントリーの状態とアクションを返すこと', () => {
    // 直接フックを呼び出してテスト
    const result = useChatSectionStores();
    
    // 戻り値が期待する構造を持っていることを確認
    expect(result).toHaveProperty('chat');
    expect(result).toHaveProperty('entry');
    
    // chatプロパティの内容を確認
    expect(result.chat).toHaveProperty('messages');
    expect(result.chat).toHaveProperty('isLoading');
    expect(result.chat).toHaveProperty('input');
    expect(result.chat).toHaveProperty('setInput');
    expect(result.chat).toHaveProperty('sendMessage');
    
    // 値が正しく設定されていることを確認
    expect(result.chat.messages).toEqual(mockMessages);
    expect(result.chat.isLoading).toBe(mockIsLoading);
    expect(result.chat.input).toBe(mockInput);
    expect(result.chat.setInput).toBe(mockSetInput);
    expect(result.chat.sendMessage).toBe(mockSendMessage);
    
    // entryプロパティの内容を確認
    expect(result.entry).toHaveProperty('pendingEntry');
    expect(result.entry).toHaveProperty('hasPendingEntry');
    expect(result.entry.pendingEntry).toEqual(mockPendingEntry);
    expect(result.entry.hasPendingEntry).toBe(mockHasPendingEntry);
  });
}); 