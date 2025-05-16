/**
 * fetchのモックファクトリ関数
 * テストで使用するfetchモックを型安全に生成します
 */

type MockResponseInit = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
};

export type MockFetchResult = {
  mockFetch: jest.Mock;
  mockJsonResponse: (data: any, init?: MockResponseInit) => void;
  mockTextResponse: (text: string, init?: MockResponseInit) => void;
  mockErrorResponse: (error?: Error) => void;
  mockNetworkError: () => void;
  resetMocks: () => void;
};

export const createMockFetch = (): MockFetchResult => {
  const mockFetch = jest.fn();
  
  const mockJsonResponse = (data: any, init: MockResponseInit = {}) => {
    const { status = 200, statusText = 'OK', headers = {} } = init;
    
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText,
      headers: new Headers(headers),
      json: jest.fn().mockResolvedValueOnce(data),
      text: jest.fn().mockResolvedValueOnce(JSON.stringify(data)),
      blob: jest.fn().mockResolvedValueOnce(new Blob([JSON.stringify(data)])),
      arrayBuffer: jest.fn().mockResolvedValueOnce(new TextEncoder().encode(JSON.stringify(data)).buffer),
      formData: jest.fn().mockRejectedValueOnce(new Error('FormData not implemented in mock')),
      clone: jest.fn().mockImplementation(function(this: Response) { return this; }),
    });
  };
  
  const mockTextResponse = (text: string, init: MockResponseInit = {}) => {
    const { status = 200, statusText = 'OK', headers = {} } = init;
    
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText,
      headers: new Headers(headers),
      text: jest.fn().mockResolvedValueOnce(text),
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
      blob: jest.fn().mockResolvedValueOnce(new Blob([text])),
      arrayBuffer: jest.fn().mockResolvedValueOnce(new TextEncoder().encode(text).buffer),
      formData: jest.fn().mockRejectedValueOnce(new Error('FormData not implemented in mock')),
      clone: jest.fn().mockImplementation(function(this: Response) { return this; }),
    });
  };
  
  const mockErrorResponse = (error: Error = new Error('Fetch error')) => {
    mockFetch.mockRejectedValueOnce(error);
  };
  
  const mockNetworkError = () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  };
  
  const resetMocks = () => {
    mockFetch.mockReset();
  };
  
  return {
    mockFetch,
    mockJsonResponse,
    mockTextResponse,
    mockErrorResponse,
    mockNetworkError,
    resetMocks
  };
};

// グローバルfetchのモック化処理
export const setupGlobalFetchMock = (): MockFetchResult => {
  const mockFetchResult = createMockFetch();
  
  global.fetch = mockFetchResult.mockFetch;
  
  return mockFetchResult;
}; 