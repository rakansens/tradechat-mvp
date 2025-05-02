// jest.setup.js
// テスト環境のセットアップを行うファイル

// 開発用.envファイルからの環境変数読み込み
require('dotenv').config();

// 環境変数が設定されていない場合はテスト用のデフォルト値を設定
process.env.MEM0_API_KEY = process.env.MEM0_API_KEY || 'test_mem0_key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test_openai_key';

// 必要に応じてテストのためのグローバル設定やモックを追加
global.console = {
  ...console,
  // テスト中の不要な警告を抑制（必要に応じてコメントを外す）
  // warn: jest.fn(),
  // error: jest.fn(),
  // log: jest.fn(),
};
