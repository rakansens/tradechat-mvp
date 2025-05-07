// types/esbuild-plugin-tsconfig-paths.d.ts
// 作成: esbuild-plugin-tsconfig-pathsモジュールの型定義

declare module 'esbuild-plugin-tsconfig-paths' {
  import { Plugin } from 'esbuild';

  export function tsconfigPathsPlugin(options?: {
    tsconfig?: string;
    [key: string]: any;
  }): Plugin;
}