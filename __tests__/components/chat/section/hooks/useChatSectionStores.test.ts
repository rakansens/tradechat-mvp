/**
 * __tests__/components/chat/section/hooks/useChatSectionStores.test.ts
 * useChatSectionStoresフックのテストスイート
 */

import { useChatSectionStores } from '@/components/chat/section/hooks/useChatSectionStores';

// 各セレクターの戻り値をモック
const mockMessages = ['message1', 'message2'];
const mockIsLoading = false;
const mockInput = 'test input';
const mockSetInput = jest.fn();
const mockSendMessage = jest.fn();
const mockPendingEntry = { id: 'entry1' };
const mockHasPendingEntry = true;

// ストアをモック
jest.mock("@/store", () => ({
  useChatStore: (selector: any) => {
    // セレクターの名前を使ってモックの戻り値を返す
    switch (selector) {
      case 'selectMessages':
        return mockMessages;
      case 'selectIsSearching':
        return mockIsLoading;
      case 'selectInput':
        return mockInput;
      case 'selectSetInput':
        return mockSetInput;
      case 'selectSendMessage':
        return mockSendMessage;
      default:
        return null;
    }
  },
  useEntryStore: (selector: any) => {
    // セレクターの名前を使ってモックの戻り値を返す
    switch (selector) {
      case 'selectPendingEntry':
        return mockPendingEntry;
      case 'selectHasPendingEntry':
        return mockHasPendingEntry;
      default:
        return null;
    }
  },
  // セレクター関数自体もモック
  selectMessages: 'selectMessages',
  selectIsSearching: 'selectIsSearching',
  selectInput: 'selectInput',
  selectSetInput: 'selectSetInput',
  selectSendMessage: 'selectSendMessage',
  selectPendingEntry: 'selectPendingEntry',
  selectHasPendingEntry: 'selectHasPendingEntry'
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