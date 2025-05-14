// jest.setup.js
// 更新: テスト前の共通セットアップ - @testing-library/jest-domの型定義を追加

// エラーのスタックトレースを詳細に表示
Error.stackTraceLimit = Infinity;

// テスト実行タイムアウトの延長（重いAPIテストなどで必要な場合）
jest.setTimeout(30000);

// コンソール出力のモック化（オプション）
// テスト中のノイズを減らすためにコンソール出力を抑制
if (process.env.SUPPRESS_CONSOLE) {
  global.console = {
    ...global.console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// ブラウザ環境のモック
// Canvasのモック
class MockCanvas {
  getContext() {
    return {};
  }
  toDataURL() {
    return 'mock-data-url';
  }
}

// グローバルオブジェクトの設定
global.fetch = jest.fn();
global.HTMLCanvasElement = MockCanvas;

// documentのモック
global.document = global.document || {
  querySelector: jest.fn()
};

// Supabase認証テスト用の環境変数
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// OpenAI API Keyの環境変数設定
process.env.OPENAI_API_KEY = 'test-api-key';

// 開発用.envファイルからの環境変数読み込み
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// 環境変数が設定されていない場合はテスト用のデフォルト値を設定
process.env.MEM0_API_KEY = process.env.MEM0_API_KEY || 'test_mem0_key';

// Jest-DOMのセットアップ（CommonJS形式で）
try {
  require('@testing-library/jest-dom');
  
  // __tests__/setup.tsで定義した型拡張を読み込む
  require('./__tests__/setup.ts');
} catch (e) {
  console.warn('jest-domが見つかりません。DOM関連のテストに影響する可能性があります。');
}

// WebSocketのモック
global.WebSocket = function MockWebSocket() {
  return {
    send: jest.fn(),
    close: jest.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null,
  };
};

// WebSocketの定数
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;
