// mastra.config.ts - Mastraバンドラーにパスエイリアスを設定する
import { defineConfig } from 'mastra';
import { tsconfigPathsPlugin } from 'esbuild-plugin-tsconfig-paths';

export default defineConfig({
  bundler: {
    esbuild: {
      alias: {
        '@/*': './*', // @/xxx -> ./xxx に解決
      },
      plugins: [tsconfigPathsPlugin()],
    },
  },
});
