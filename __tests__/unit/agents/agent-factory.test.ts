// agent-factory.test.ts
// Unit tests for createChatAgent and createDirectAgent

// Mock external modules before importing the functions under test
jest.mock('@mastra/memory', () => ({ Memory: jest.fn() }));
jest.mock('@mastra/core/agent', () => ({ Agent: jest.fn() }));
jest.mock('@ai-sdk/openai', () => ({ openai: jest.fn() }));
// Mock tools and workflows to avoid importing OpenAI library
jest.mock('../../../src/mastra/tools', () => ({
  mem0RememberTool: {},
  mem0MemorizeTool: {},
  chartCaptureAnalysisTool: {},
  changeTimeframeTool: {},
  changeSymbolTool: {},
  changeInstrumentTypeTool: {},
  multiTimeframeAnalysisTool: {},
  entrySuggestionTool: {},
}));
jest.mock('../../../src/mastra/workflows', () => ({}));
jest.mock('@/utils/common', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { createChatAgent, createDirectAgent } from '../../../src/mastra/agents';
import { Memory } from '@mastra/memory';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

const MemoryMock = Memory as jest.Mock;
const AgentMock = Agent as jest.Mock;
const openaiMock = openai as jest.Mock;

const defaultMemoryOptions = {
  options: {
    lastMessages: 40,
    semanticRecall: false,
    threads: { generateTitle: true },
  },
};

describe('Agent factory functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MemoryMock.mockImplementation((opts) => ({ opts }));
    AgentMock.mockImplementation((config) => ({ config }));
    openaiMock.mockImplementation((model: string) => ({ model }));
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('createChatAgent', () => {
    it('constructs agent with default memory and tools', () => {
      const agent = createChatAgent();
      expect(agent).toBeDefined();
      expect(MemoryMock).toHaveBeenCalledWith(defaultMemoryOptions);
      expect(openaiMock).toHaveBeenCalledWith('gpt-4o');
      const config = AgentMock.mock.calls[0][0];
      expect(Object.keys(config.tools)).toEqual([
        'mem0-remember',
        'mem0-memorize',
        'chart-capture-analysis',
        'change-instrument-type',
        'change-timeframe',
        'change-symbol',
        'multi-timeframe-analysis',
        'entry-suggestion',
      ]);
      expect(config.memory).toEqual({ opts: defaultMemoryOptions });
    });

    it('uses provided memory instance', () => {
      const memory = { custom: true } as any;
      createChatAgent(memory);
      expect(MemoryMock).not.toHaveBeenCalled();
      expect(AgentMock.mock.calls[0][0].memory).toBe(memory);
    });
  });

  describe('createDirectAgent', () => {
    it('constructs agent with default memory', () => {
      createDirectAgent();
      expect(MemoryMock).toHaveBeenCalledWith(defaultMemoryOptions);
      expect(openaiMock).toHaveBeenCalledWith('gpt-4o');
      expect(AgentMock).toHaveBeenCalled();
    });

    it('falls back to gpt-3.5-turbo when API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      createDirectAgent();
      expect(openaiMock).toHaveBeenCalledWith('gpt-3.5-turbo');
    });
  });
});
