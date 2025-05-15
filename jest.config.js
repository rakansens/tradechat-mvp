// jest.config.js
// Jestテスト設定ファイル

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/supabase/(.*)$': '<rootDir>/lib/supabase/$1',
    '^lightweight-charts$': '<rootDir>/__tests__/lightweight-charts.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      configFile: './__tests__/config/babel.config.js',
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      configFile: './__tests__/config/babel.config.js',
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library|react|react-dom|lucide-react|@radix-ui)/)'
  ]
};
