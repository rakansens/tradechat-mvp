/**
 * 共通の汎用型定義をエクスポートするバレルファイル
 * 
 * このファイルは共通型定義をエクスポートします。
 * T-5フェーズでルートの汎用型がこのディレクトリに移動されました。
 */

// 基本的な共通型をエクスポート
export * from './base';

// コンポーネント間で共有されるインターフェースをエクスポート
export * from './interfaces';

// オーダーブック関連の共通型をエクスポート
export * from './orderbook';

// シンボル関連の共通型をエクスポート
export * from './symbol';

// 将来的な拡張のための予約
// export * from './date';
// export * from './validation';
// export * from './api'; 