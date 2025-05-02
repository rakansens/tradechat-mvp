// types/index.ts
// 更新: 分割された型定義ファイルからの再エクスポート

// 各ドメイン別の型をエクスポート
export * from './chart';
export * from './entry';
export * from './chat';
export * from './ui';
export * from './common';

// 後方互換性のために元の型定義も残しておく
// 注: これらは将来的に削除され、ドメイン別の型に完全に置き換えられる予定
