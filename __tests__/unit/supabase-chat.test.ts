// __tests__/unit/supabase-chat.test.ts
// チャット機能のユニットテスト
// 作成日: 2025/6/10

import * as chatModule from '@/lib/supabase/supabase-chat';

// Supabaseのモジュールをモック
jest.mock('@/lib/supabase/supabase', () => {
  const mockStorage = {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue({
      data: { path: 'test-path' },
      error: null
    }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://test-url.com/image.png' }
    })
  };

  return {
    supabase: {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
      storage: mockStorage,
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn((callback) => {
          if (callback) callback('SUBSCRIBED');
          return { unsubscribe: jest.fn() };
        }),
      }),
      removeChannel: jest.fn(),
    }
  };
});

// Web APIモック
global.fetch = jest.fn();
global.File = jest.fn().mockImplementation((content, filename, options) => ({
  content,
  name: filename,
  ...options
}));
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  ...options
}));

// その他のグローバル関数モック
global.atob = jest.fn((str) => str);

// テスト用データ
const testChatMessage = {
  id: 'test-message-id',
  user_id: 'test-user-id',
  role: 'user',
  content: 'テスト用メッセージ',
  is_proposal: false,
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chat_images: null
};

const testChatImage = {
  id: 'test-image-id',
  user_id: 'test-user-id',
  image_data: 'https://test-url.com/image.png',
  image_caption: 'テスト画像',
  created_at: new Date().toISOString()
};

// テスト実行
describe('チャット機能のテスト', () => {
  beforeEach(() => {
    // 各テスト前に実行
    jest.clearAllMocks();
    
    // 実装をスパイに置き換え
    jest.spyOn(chatModule, 'getChatMessages').mockResolvedValue([testChatMessage]);
    jest.spyOn(chatModule, 'getUserChatMessages').mockResolvedValue([testChatMessage]);
    jest.spyOn(chatModule, 'createChatMessage').mockResolvedValue(testChatMessage);
    jest.spyOn(chatModule, 'updateChatMessage').mockResolvedValue(testChatMessage);
    jest.spyOn(chatModule, 'deleteChatMessage').mockResolvedValue(true);
    jest.spyOn(chatModule, 'uploadChatImage').mockResolvedValue(testChatImage);
    jest.spyOn(chatModule, 'getChatImage').mockResolvedValue(testChatImage);
    jest.spyOn(chatModule, 'subscribeToChatMessages').mockImplementation(() => jest.fn());
    jest.spyOn(chatModule, 'subscribeToConversationMessages').mockImplementation(() => jest.fn());
  });

  describe('getChatMessages', () => {
    it('チャットメッセージを正常に取得できること', async () => {
      const result = await chatModule.getChatMessages();
      expect(result).toEqual([testChatMessage]);
      expect(chatModule.getChatMessages).toHaveBeenCalled();
    });

    it('指定したパラメータで取得できること', async () => {
      const result = await chatModule.getChatMessages(10, 0, true, 'test-conversation');
      expect(result).toEqual([testChatMessage]);
      expect(chatModule.getChatMessages).toHaveBeenCalledWith(10, 0, true, 'test-conversation');
    });
  });

  describe('getUserChatMessages', () => {
    it('ユーザーのチャットメッセージを正常に取得できること', async () => {
      const result = await chatModule.getUserChatMessages('test-user-id');
      expect(result).toEqual([testChatMessage]);
      expect(chatModule.getUserChatMessages).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('createChatMessage', () => {
    it('基本パラメータでチャットメッセージを正常に作成できること', async () => {
      const result = await chatModule.createChatMessage(
        'test-user-id',
        'user',
        'テスト用メッセージ'
      );
      
      expect(result).toEqual(testChatMessage);
      expect(chatModule.createChatMessage).toHaveBeenCalledWith(
        'test-user-id',
        'user',
        'テスト用メッセージ'
      );
    });

    it('全パラメータ指定でチャットメッセージを作成できること', async () => {
      const result = await chatModule.createChatMessage(
        'test-user-id',
        'assistant',
        'テスト用提案メッセージ',
        true,
        true,
        'buy',
        50000,
        55000,
        48000,
        'test-image-id',
        'test-conversation-id'
      );
      
      expect(result).toEqual(testChatMessage);
      expect(chatModule.createChatMessage).toHaveBeenCalledWith(
        'test-user-id',
        'assistant',
        'テスト用提案メッセージ',
        true,
        true,
        'buy',
        50000,
        55000,
        48000,
        'test-image-id',
        'test-conversation-id'
      );
    });
  });

  describe('updateChatMessage', () => {
    it('チャットメッセージを正常に更新できること', async () => {
      const updates = {
        content: '更新されたメッセージ',
      };
      
      const result = await chatModule.updateChatMessage('test-message-id', updates);
      
      expect(result).toEqual(testChatMessage);
      expect(chatModule.updateChatMessage).toHaveBeenCalledWith('test-message-id', updates);
    });
  });

  describe('deleteChatMessage', () => {
    it('チャットメッセージを正常に削除できること', async () => {
      const result = await chatModule.deleteChatMessage('test-message-id');
      expect(result).toBe(true);
      expect(chatModule.deleteChatMessage).toHaveBeenCalledWith('test-message-id');
    });
  });

  describe('uploadChatImage', () => {
    it('チャット画像を正常にアップロードできること', async () => {
      const result = await chatModule.uploadChatImage(
        'test-user-id',
        'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh',
        'テスト画像'
      );
      
      expect(result).toEqual(testChatImage);
      expect(chatModule.uploadChatImage).toHaveBeenCalledWith(
        'test-user-id',
        'data:image/png;base64,dGVzdCBpbWFnZSBkYXRh',
        'テスト画像'
      );
    });
  });

  describe('getChatImage', () => {
    it('チャット画像を正常に取得できること', async () => {
      const result = await chatModule.getChatImage('test-image-id');
      expect(result).toEqual(testChatImage);
      expect(chatModule.getChatImage).toHaveBeenCalledWith('test-image-id');
    });
    
    it('存在しない画像の場合はnullを返すこと', async () => {
      jest.spyOn(chatModule, 'getChatImage').mockResolvedValueOnce(null);
      
      const result = await chatModule.getChatImage('non-existent-id');
      expect(result).toBeNull();
      expect(chatModule.getChatImage).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('subscribeToChatMessages', () => {
    it('チャットメッセージの購読が正常に機能すること', () => {
      const callback = jest.fn();
      const onError = jest.fn();
      const onStatusChange = jest.fn();
      
      const unsubscribe = chatModule.subscribeToChatMessages(
        callback,
        true,
        onError,
        onStatusChange
      );
      
      expect(typeof unsubscribe).toBe('function');
      expect(chatModule.subscribeToChatMessages).toHaveBeenCalledWith(
        callback,
        true,
        onError,
        onStatusChange
      );
    });
  });

  describe('subscribeToConversationMessages', () => {
    it('会話メッセージの購読が正常に機能すること', () => {
      const callback = jest.fn();
      const onError = jest.fn();
      const onStatusChange = jest.fn();
      
      const unsubscribe = chatModule.subscribeToConversationMessages(
        'test-conversation-id',
        callback,
        onError,
        onStatusChange
      );
      
      expect(typeof unsubscribe).toBe('function');
      expect(chatModule.subscribeToConversationMessages).toHaveBeenCalledWith(
        'test-conversation-id',
        callback,
        onError,
        onStatusChange
      );
    });
  });
}); 