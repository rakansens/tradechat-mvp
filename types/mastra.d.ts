// types/mastra.d.ts
// 作成: mastraモジュールの型定義

declare module 'mastra' {
  export interface MastraConfig {
    bundler?: {
      esbuild?: {
        alias?: Record<string, string>;
        plugins?: any[];
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  }

  export function defineConfig(config: MastraConfig): MastraConfig;
}