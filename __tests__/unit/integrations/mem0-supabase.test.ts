import { SupabaseMem0Integration } from '../../../src/mastra/integrations/mem0-supabase';
import * as memoryModule from '@/lib/supabase/features/memory';

// Mock Supabase memory functions
jest.mock('@/lib/supabase/features/memory', () => ({
  createMemory: jest.fn(),
  getMemoryByExternalId: jest.fn(),
  searchMemoriesBySimilarity: jest.fn(),
  updateMemory: jest.fn(),
}));

// Mocks for Mem0Integration
const mockCreateMemory = jest.fn();
const mockSearchMemory = jest.fn();

let lastConfig: any = null;

jest.mock('@mastra/mem0', () => ({
  Mem0Integration: jest.fn().mockImplementation(({ config }) => {
    lastConfig = config;
    return {
      createMemory: mockCreateMemory,
      searchMemory: mockSearchMemory,
      config,
    };
  }),
}));

describe('SupabaseMem0Integration', () => {
  const apiKey = 'test-key';
  const initialUser = 'initial-user';
  let integration: SupabaseMem0Integration;

  beforeEach(() => {
    jest.clearAllMocks();
    integration = new SupabaseMem0Integration({ apiKey, userId: initialUser });
  });

  describe('createMemory', () => {
    it('stores memory in Mem0 and Supabase', async () => {
      mockCreateMemory.mockResolvedValue({ id: 'mem0id' });
      (memoryModule.createMemory as jest.Mock).mockResolvedValue({});

      const result = await integration.createMemory('hello');

      expect(result).toBe(true);
      expect(mockCreateMemory).toHaveBeenCalledWith('hello');
      expect(memoryModule.createMemory).toHaveBeenCalledWith(
        initialUser,
        'hello',
        'mem0id',
        expect.any(Object)
      );
    });

    it('returns true when Supabase save fails after Mem0 success', async () => {
      mockCreateMemory.mockResolvedValue({ id: 'mem0id' });
      (memoryModule.createMemory as jest.Mock).mockRejectedValue(new Error('sb'));

      const result = await integration.createMemory('hello');

      expect(result).toBe(true);
      expect(memoryModule.createMemory).toHaveBeenCalled();
    });

    it('falls back to Supabase when Mem0 fails', async () => {
      mockCreateMemory.mockRejectedValue(new Error('mem0'));
      (memoryModule.createMemory as jest.Mock).mockResolvedValue({});

      const result = await integration.createMemory('content');

      expect(result).toBe(true);
      expect(memoryModule.createMemory).toHaveBeenCalledWith(
        initialUser,
        'content',
        '',
        expect.any(Object)
      );
    });

    it('returns false if both Mem0 and Supabase save fail', async () => {
      mockCreateMemory.mockRejectedValue(new Error('mem0'));
      (memoryModule.createMemory as jest.Mock).mockRejectedValue(new Error('sb'));

      const result = await integration.createMemory('oops');
      expect(result).toBe(false);
    });
  });

  describe('searchMemory', () => {
    it('returns Mem0 result when available', async () => {
      mockSearchMemory.mockResolvedValue('found');

      const result = await integration.searchMemory('query');

      expect(result).toBe('found');
      expect(mockSearchMemory).toHaveBeenCalledWith('query');
      expect(memoryModule.searchMemoriesBySimilarity).not.toHaveBeenCalled();
    });

    it('falls back to Supabase when Mem0 returns empty', async () => {
      mockSearchMemory.mockResolvedValue('');
      (memoryModule.searchMemoriesBySimilarity as jest.Mock).mockResolvedValue([
        { content: 'supabase' },
      ]);

      const result = await integration.searchMemory('query');

      expect(result).toBe('supabase');
      expect(memoryModule.searchMemoriesBySimilarity).toHaveBeenCalledWith(
        initialUser,
        'query'
      );
    });

    it('uses Supabase when Mem0 search throws', async () => {
      mockSearchMemory.mockRejectedValue(new Error('fail'));
      (memoryModule.searchMemoriesBySimilarity as jest.Mock).mockResolvedValue([
        { content: 'sb' },
      ]);

      const result = await integration.searchMemory('query');
      expect(result).toBe('sb');
    });

    it('returns empty string when both searches fail', async () => {
      mockSearchMemory.mockResolvedValue('');
      (memoryModule.searchMemoriesBySimilarity as jest.Mock).mockRejectedValue(
        new Error('sb')
      );

      const result = await integration.searchMemory('query');

      expect(result).toBe('');
    });
  });

  describe('syncMemories', () => {
    it('returns default sync result', async () => {
      const result = await integration.syncMemories();
      expect(result).toEqual({ success: true, syncedCount: 0 });
    });
  });

  describe('user id helpers', () => {
    it('getUserId returns current id', () => {
      expect(integration.getUserId()).toBe(initialUser);
    });

    it('setUserId updates id and recreates Mem0Integration', () => {
      integration.setUserId('new-user');
      expect(integration.getUserId()).toBe('new-user');
      expect(
        (require('@mastra/mem0').Mem0Integration as jest.Mock).mock.calls[1][0]
          .config
      ).toEqual({ apiKey, userId: 'new-user' });
    });
  });
});
