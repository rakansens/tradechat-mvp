// src/mastra/agents/__tests__/index.test.ts
// エージェントファクトリ関数のテスト

import { createChatAgent, createDirectAgent } from '../index';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { mem0RememberTool, mem0MemorizeTool } from '../../tools';

// 依存モジュールのモック
jest.mock('@mastra/core/agent', () => ({
  Agent: jest.fn().mockImplementation(() => ({
    stream: jest.fn(),
    generate: jest.fn(),
  })),
}));

jest.mock('@mastra/memory', () => ({
  Memory: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn().mockReturnValue('mockedOpenAIModel'),
}));

jest.mock('../../tools', () => ({
  mem0RememberTool: { id: 'mem0-remember', execute: jest.fn() },
  mem0MemorizeTool: { id: 'mem0-memorize', execute: jest.fn() },
  chartCaptureAnalysisTool: { id: 'chart-capture-analysis', execute: jest.fn() },
  changeTimeframeTool: { id: 'change-timeframe', execute: jest.fn() },
  changeSymbolTool: { id: 'change-symbol', execute: jest.fn() },
  multiTimeframeAnalysisTool: { id: 'multi-timeframe-analysis', execute: jest.fn() },
  entrySuggestionTool: { id: 'entry-suggestion', execute: jest.fn() }
}));

describe('Agent Factory Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChatAgent', () => {
    it('メモリありでエージェントを作成できること', () => {
      // テスト用メモリインスタンスを作成
      const memory = new Memory();
      
      // エージェント作成
      const agent = createChatAgent(memory);
      
      // 期待される設定でAgentが呼ばれたことを確認
      expect(Agent).toHaveBeenCalledWith({
        name: 'TradingAssistant',
        instructions: expect.stringContaining('トレーディングアシスタント'),
        model: 'mockedOpenAIModel',
        memory: expect.any(Memory),
        tools: expect.objectContaining({
          'mem0-remember': mem0RememberTool,
          'mem0-memorize': mem0MemorizeTool
        })
      });
    });

    it('メモリなしでもエージェントを作成できること', () => {
      // メモリなしでエージェント作成
      const agent = createChatAgent();
      
      // 期待される設定でAgentが呼ばれたことを確認
      expect(Agent).toHaveBeenCalledWith({
        name: 'TradingAssistant',
        instructions: expect.stringContaining('トレーディングアシスタント'),
        model: 'mockedOpenAIModel',
        memory: expect.any(Memory),
        tools: expect.objectContaining({
          'mem0-remember': mem0RememberTool,
          'mem0-memorize': mem0MemorizeTool
        })
      });
    });
  });

  describe('createDirectAgent', () => {
    it('メモリなしのエージェントを作成できること', () => {
      // エージェント作成
      const agent = createDirectAgent();
      
      // 期待される設定でAgentが呼ばれたことを確認
      expect(Agent).toHaveBeenCalledWith({
        name: 'TradingAssistant',
        instructions: expect.stringContaining('トレーディングアシスタント'),
        model: 'mockedOpenAIModel',
        memory: expect.any(Memory),
        tools: expect.objectContaining({
          'mem0-remember': mem0RememberTool,
          'mem0-memorize': mem0MemorizeTool
        })
      });
    });
  });
});
